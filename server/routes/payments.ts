import type { Request, Response } from 'express';
import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';
import { createPesaPalOrder, finalizePaymentTransaction, queryPesaPalTransactionStatus, registerPesaPalIPN, ensurePesaPalIPN } from '../pesapal.js';
import type { Payment, PaymentMethod } from '../types.js';
import { IntegrationService } from '../services/integrationService.js';
import {
  amountsMatch,
  capturePayPalOrder,
  constructStripeEvent,
  isProductionRuntime,
  simulatedPaymentsAllowed,
  toStripeMinorUnits,
  verifyStripePaymentIntent,
} from '../paymentVerification.js';

export const paymentsRouter = Router();

interface PricedPurchase {
  amount: number;
  currency: string;
  description: string;
  planId?: string;
  featuredCampaignId?: string;
}

/**
 * Resolves the authoritative price of a purchase from server-side records.
 * A client-supplied amount is never used for anything a user receives value for.
 */
function resolvePurchase(
  body: Record<string, any>,
  userId: string
): { purchase: PricedPurchase } | { error: string; status: number } {
  const { planId, featuredCampaignId, billingInterval = 'MONTHLY' } = body;

  if (planId) {
    const plan = db.plans.findById(planId);
    if (!plan) return { error: 'Subscription plan not found.', status: 404 };
    return {
      purchase: {
        amount: billingInterval === 'ANNUAL' ? plan.annualPriceUsd : plan.monthlyPriceUsd,
        currency: plan.currency || 'USD',
        description: `${plan.name} (${billingInterval === 'ANNUAL' ? '1 Year' : '1 Month'})`,
        planId,
      },
    };
  }

  if (featuredCampaignId) {
    const campaign = db.featuredCampaigns.getAll().find((c) => c.id === featuredCampaignId);
    if (!campaign) return { error: 'Featured campaign not found.', status: 404 };
    if (campaign.ownerId && campaign.ownerId !== userId) {
      return { error: 'You can only pay for your own featured placements.', status: 403 };
    }
    return {
      purchase: {
        amount: campaign.price,
        currency: campaign.currency || 'USD',
        description: `Featured Station Placement (${campaign.placement})`,
        featuredCampaignId,
      },
    };
  }

  return { error: 'Either planId or featuredCampaignId must be provided.', status: 400 };
}

/** Only the payer or a platform admin may inspect or act on a payment record. */
function canActOnPayment(payment: Payment, user: { id: string; role: string }): boolean {
  return payment.ownerId === user.id || user.role === 'SUPER_ADMIN';
}

// 1. Create Checkout Order (for Subscription or Featured Placement)
paymentsRouter.post(['/create-checkout', '/checkout'], requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { paymentMethod = 'PESAPAL', billingInterval = 'MONTHLY' } = req.body;

    const resolved = resolvePurchase(req.body, user.id);
    if ('error' in resolved) {
      res.status(resolved.status).json({ error: resolved.error });
      return;
    }
    const { amount, currency, description, planId, featuredCampaignId } = resolved.purchase;

    // Ensure PesaPal IPN is registered before submitting any order
    await ensurePesaPalIPN();

    const order = await createPesaPalOrder({
      ownerId: user.id,
      userEmail: user.email,
      userName: user.name,
      userPhone: user.phone || req.body.phoneNumber || '255700000000',
      amount,
      currency,
      description,
      subscriptionPlanId: planId,
      billingInterval,
      featuredCampaignId,
      paymentMethod: paymentMethod as PaymentMethod,
      callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/owner/subscriptions`,
    });

    // Sandbox-only shortcut. In production a subscription is only ever activated
    // after the gateway confirms the funds server-to-server.
    const wantsSimulation = req.body.simulateInstant || paymentMethod === 'SIMULATED';
    if (wantsSimulation) {
      if (!simulatedPaymentsAllowed()) {
        res.status(403).json({
          error: 'Simulated payments are disabled in production. Complete the checkout with a real payment method.',
        });
        return;
      }

      const finalized = await finalizePaymentTransaction(
        order.orderTrackingId,
        'COMPLETED',
        paymentMethod as PaymentMethod
      );
      res.json({
        success: true,
        orderTrackingId: order.orderTrackingId,
        redirectUrl: order.redirectUrl,
        paymentId: order.paymentId,
        amount,
        currency,
        description,
        isCompleted: true,
        payment: finalized.payment,
        invoice: finalized.invoice,
      });
      return;
    }

    res.json({
      success: true,
      orderTrackingId: order.orderTrackingId,
      redirectUrl: order.redirectUrl,
      paymentId: order.paymentId,
      amount,
      currency,
      description,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout initiation failed';
    res.status(500).json({ error: message });
  }
});

// 2. PesaPal IPN Webhook Receiver (Server-to-Server)
// The notification body is untrusted; it only tells us which order to re-query.
paymentsRouter.post('/pesapal/ipn-webhook', async (req, res) => {
  const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = req.body;
  console.log(`[PesaPal IPN] Notification received: ${OrderTrackingId}, Ref: ${OrderMerchantReference}`);

  if (!OrderTrackingId) {
    res.status(400).json({ error: 'OrderTrackingId required' });
    return;
  }

  // Query PesaPal API 3.0 server-to-server for verified transaction status
  const verification = await queryPesaPalTransactionStatus(OrderTrackingId);

  if (verification.status === 'COMPLETED') {
    const result = await finalizePaymentTransaction(
      OrderTrackingId,
      'COMPLETED',
      verification.paymentMethod || 'MPESA',
      undefined,
      { verifiedAmount: verification.amount, verifiedCurrency: verification.currency }
    );
    res.json({
      orderNotificationType: OrderNotificationType || 'IPNCHANGE',
      orderTrackingId: OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: result.success ? '200' : '500',
    });
    return;
  } else if (verification.status === 'FAILED') {
    await finalizePaymentTransaction(
      OrderTrackingId,
      'FAILED',
      verification.paymentMethod || 'MPESA',
      verification.description
    );
    res.json({
      orderNotificationType: OrderNotificationType || 'IPNCHANGE',
      orderTrackingId: OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: '200',
    });
    return;
  }

  res.json({
    orderNotificationType: OrderNotificationType || 'IPNCHANGE',
    orderTrackingId: OrderTrackingId,
    orderMerchantReference: OrderMerchantReference,
    status: '200',
  });
});

// 3. Payment Status Verification (invoked by the payer returning from the gateway)
paymentsRouter.get('/pesapal/verify', requireAuth, async (req: AuthenticatedRequest, res) => {
  const trackingId = (req.query.tracking_id || req.query.OrderTrackingId) as string;
  if (!trackingId) {
    res.status(400).json({ error: 'tracking_id is required' });
    return;
  }

  const payment = db.payments.findByTrackingId(trackingId);
  if (!payment) {
    res.status(404).json({ error: 'Transaction reference not found.' });
    return;
  }

  if (!canActOnPayment(payment, req.user!)) {
    res.status(403).json({ error: 'You are not authorised to view this transaction.' });
    return;
  }

  // Query PesaPal if still pending
  if (payment.status === 'PENDING') {
    const verification = await queryPesaPalTransactionStatus(trackingId);
    if (verification.status === 'COMPLETED') {
      await finalizePaymentTransaction(
        trackingId,
        'COMPLETED',
        verification.paymentMethod || payment.paymentMethod || 'MPESA',
        undefined,
        { verifiedAmount: verification.amount, verifiedCurrency: verification.currency }
      );
    } else if (verification.status === 'FAILED') {
      await finalizePaymentTransaction(trackingId, 'FAILED', verification.paymentMethod || payment.paymentMethod || 'MPESA', verification.description);
    }
  }

  const updatedPayment = db.payments.findByTrackingId(trackingId);
  const invoice = db.invoices.getAll().find((i) => i.paymentId === updatedPayment?.id);

  res.json({
    success: true,
    payment: updatedPayment,
    invoice,
  });
});

// 4. Sandbox mobile money simulator — never available in production.
paymentsRouter.post('/simulate-instant-mobile-money', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!simulatedPaymentsAllowed()) {
    res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
    return;
  }

  const { trackingId, method = 'MPESA' } = req.body;
  if (!trackingId) {
    res.status(400).json({ error: 'trackingId is required' });
    return;
  }

  const payment = db.payments.findByTrackingId(trackingId);
  if (!payment) {
    res.status(404).json({ error: 'Payment record not found' });
    return;
  }
  if (!canActOnPayment(payment, req.user!)) {
    res.status(403).json({ error: 'You are not authorised to act on this transaction.' });
    return;
  }

  const result = await finalizePaymentTransaction(trackingId, 'COMPLETED', method as PaymentMethod);

  if (!result.success) {
    res.status(404).json({ error: 'Payment record not found' });
    return;
  }

  res.json({
    success: true,
    message: `Simulated payment via ${method} completed successfully!`,
    payment: result.payment,
    invoice: result.invoice,
  });
});

// 5. Listener Premium Radio Station Subscription Endpoint
paymentsRouter.post('/subscribe-station', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { stationId, billingInterval = 'MONTHLY', paymentMethod = 'PESAPAL' } = req.body;

    if (!stationId) {
      res.status(400).json({ error: 'stationId is required.' });
      return;
    }

    const station = db.stations.findById(stationId);
    if (!station) {
      res.status(404).json({ error: 'Radio station not found.' });
      return;
    }

    const price = billingInterval === 'ANNUAL' ? (station.annualPriceUsd || 50) : (station.monthlyPriceUsd || 5);
    const currency = 'USD';
    const durationDays = billingInterval === 'ANNUAL' ? 365 : 30;

    const ownerShare = Number((price * 0.8).toFixed(2));
    const platformShare = Number((price - ownerShare).toFixed(2));

    const existing = db.premiumSubscriptions
      .getAll()
      .find((s) => s.listenerId === user.id && s.stationId === station.id && s.status === 'ACTIVE');
    if (existing && new Date(existing.currentPeriodEnd).getTime() > Date.now()) {
      res.json({ success: true, message: 'You already have an active subscription to this station.', subscription: existing });
      return;
    }

    // The subscription starts life as PENDING and is only activated by
    // finalizePaymentTransaction once the gateway confirms the funds.
    const sub = db.premiumSubscriptions.create({
      id: `pr_sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      listenerId: user.id,
      stationId: station.id,
      ownerId: station.ownerId,
      status: 'PENDING',
      billingInterval,
      amountTzs: price,
      ownerShareTzs: ownerShare,
      platformShareTzs: platformShare,
      currency,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + durationDays * 86400000).toISOString(),
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await ensurePesaPalIPN();

    const order = await createPesaPalOrder({
      ownerId: user.id,
      userEmail: user.email,
      userName: user.name,
      userPhone: user.phone || req.body.phoneNumber || '255700000000',
      amount: price,
      currency,
      description: `Premium Station Access — ${station.name} (${billingInterval === 'ANNUAL' ? '1 Year' : '1 Month'})`,
      billingInterval,
      premiumSubscriptionId: sub.id,
      paymentMethod: paymentMethod as PaymentMethod,
      callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/station/${station.slug}`,
    });

    db.premiumSubscriptions.update(sub.id, { paymentId: order.paymentId });

    // Outside production there is no real gateway to return from, so settle now
    // to keep the local/sandbox experience usable.
    if (simulatedPaymentsAllowed()) {
      const finalized = await finalizePaymentTransaction(order.orderTrackingId, 'COMPLETED', paymentMethod as PaymentMethod);
      res.json({
        success: true,
        message: `Successfully subscribed to ${station.name}!`,
        subscription: db.premiumSubscriptions.findById(sub.id) || sub,
        payment: finalized.payment,
        isCompleted: true,
      });
      return;
    }

    res.json({
      success: true,
      requiresPayment: true,
      message: `Complete your payment to unlock ${station.name}.`,
      subscription: sub,
      orderTrackingId: order.orderTrackingId,
      redirectUrl: order.redirectUrl,
      paymentId: order.paymentId,
      amount: price,
      currency,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Subscription failed';
    res.status(500).json({ error: message });
  }
});

// 6. Stripe PaymentIntent Creation Endpoint
paymentsRouter.post('/stripe/create-intent', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { currency: requestedCurrency = 'USD', description, billingInterval = 'MONTHLY' } = req.body;

    // For anything that grants entitlements the price comes from the database.
    // A free-form amount is only accepted for open-ended giving.
    let amount: number;
    let currency: string;
    let purchaseDescription: string;
    let planId: string | undefined;
    let featuredCampaignId: string | undefined;

    if (req.body.planId || req.body.featuredCampaignId) {
      const resolved = resolvePurchase(req.body, user.id);
      if ('error' in resolved) {
        res.status(resolved.status).json({ error: resolved.error });
        return;
      }
      ({ amount, currency, description: purchaseDescription, planId, featuredCampaignId } = resolved.purchase);
    } else {
      amount = Number(req.body.amount);
      currency = String(requestedCurrency).toUpperCase();
      purchaseDescription = description || 'Christian Radios Offering';
      if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: 'Valid amount is required' });
        return;
      }
    }

    const stripeConfig = IntegrationService.getStripeConfig();
    const trackingId = `STRIPE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Record pending transaction against the authenticated user
    const payment = db.payments.create({
      id: `pay_str_${Date.now()}`,
      trackingId,
      ownerId: user.id,
      subscriptionId: planId,
      featuredCampaignId,
      billingInterval: billingInterval as any,
      amount,
      currency,
      status: 'PENDING',
      provider: 'STRIPE',
      paymentMethod: 'CARD',
      description: purchaseDescription,
      createdAt: new Date().toISOString(),
    });

    if (!stripeConfig.secretKey || stripeConfig.secretKey.startsWith('sk_test_mock')) {
      if (isProductionRuntime()) {
        res.status(503).json({ error: 'Card payments are not available right now. Please choose another payment method.' });
        return;
      }
      res.json({
        success: true,
        clientSecret: `pi_sandbox_${Date.now()}_secret_${Math.random().toString(36).substring(2, 8)}`,
        trackingId,
        paymentId: payment.id,
        publishableKey: stripeConfig.publishableKey || 'pk_test_cr_demo_sandbox',
        sandbox: true,
      });
      return;
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeConfig.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: toStripeMinorUnits(amount, currency).toString(),
        currency: currency.toLowerCase(),
        description: purchaseDescription,
        'metadata[trackingId]': trackingId,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error(`[Stripe API] PaymentIntent creation failed (HTTP ${stripeRes.status}):`, errBody);
      db.payments.update(payment.id, { status: 'FAILED', failureReason: 'Stripe PaymentIntent creation failed.' });
      res.status(502).json({ error: 'Could not start the card payment. Please try again.' });
      return;
    }

    const stripeData = (await stripeRes.json()) as { client_secret?: string; id?: string };
    if (!stripeData.client_secret) {
      db.payments.update(payment.id, { status: 'FAILED', failureReason: 'Stripe did not return a client secret.' });
      res.status(502).json({ error: 'Could not start the card payment. Please try again.' });
      return;
    }

    db.payments.update(payment.id, { providerRef: stripeData.id });

    res.json({
      success: true,
      clientSecret: stripeData.client_secret,
      trackingId,
      paymentId: payment.id,
      publishableKey: stripeConfig.publishableKey,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe initialization failed';
    res.status(500).json({ error: msg });
  }
});

/**
 * Stripe webhook. Mounted in server.ts ahead of the JSON body parser so the
 * exact raw bytes are available for signature verification.
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const stripeConfig = IntegrationService.getStripeConfig();
  if (!stripeConfig.webhookSecret) {
    console.error('[Stripe Webhook] Rejected: STRIPE_WEBHOOK_SECRET is not configured.');
    res.status(503).json({ error: 'Webhook secret not configured.' });
    return;
  }

  const rawBody: Buffer | string = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body ?? {});
  const event = constructStripeEvent(rawBody, req.headers['stripe-signature'] as string | undefined);

  if (!event) {
    console.warn('[Stripe Webhook] Rejected event with invalid or missing signature.');
    res.status(400).json({ error: 'Invalid signature.' });
    return;
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data?.object;
      const trackingId = intent?.metadata?.trackingId;
      if (trackingId) {
        const currency = (intent.currency || 'usd').toUpperCase();
        await finalizePaymentTransaction(trackingId, 'COMPLETED', 'CARD', undefined, {
          verifiedAmount: (intent.amount_received ?? intent.amount ?? 0) / 100,
          verifiedCurrency: currency,
        });
        console.log(`[Stripe Webhook] Finalized transaction: ${trackingId}`);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const trackingId = event.data?.object?.metadata?.trackingId;
      if (trackingId) {
        await finalizePaymentTransaction(trackingId, 'FAILED', 'CARD', 'Stripe reported a failed payment.');
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook Error]:', err);
    res.status(400).json({ error: 'Webhook handling failed' });
  }
}

paymentsRouter.post('/stripe/webhook', handleStripeWebhook);

// 6c. Stripe Client Confirmation Endpoint
paymentsRouter.post('/stripe/confirm-intent', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { trackingId, paymentIntentId } = req.body;
    if (!trackingId) {
      res.status(400).json({ error: 'trackingId is required' });
      return;
    }

    const payment = db.payments.findByTrackingId(trackingId);
    if (!payment) {
      res.status(404).json({ error: 'Transaction reference not found' });
      return;
    }
    if (!canActOnPayment(payment, req.user!)) {
      res.status(403).json({ error: 'You are not authorised to act on this transaction.' });
      return;
    }

    if (payment.status === 'COMPLETED') {
      const existingInvoice = db.invoices.getAll().find((i) => i.paymentId === payment.id);
      res.json({ success: true, message: 'Payment already confirmed.', payment, invoice: existingInvoice });
      return;
    }

    const stripeConfig = IntegrationService.getStripeConfig();
    const stripeLive = Boolean(stripeConfig.secretKey) && !stripeConfig.secretKey.startsWith('sk_test_mock');

    if (!stripeLive) {
      if (isProductionRuntime()) {
        res.status(503).json({ error: 'Card payments are not configured.' });
        return;
      }
      const sandboxResult = await finalizePaymentTransaction(trackingId, 'COMPLETED', 'CARD');
      res.json({
        success: true,
        message: 'Sandbox card payment confirmed.',
        payment: sandboxResult.payment,
        invoice: sandboxResult.invoice,
        sandbox: true,
      });
      return;
    }

    const intentRef = paymentIntentId || payment.providerRef;
    const verification = await verifyStripePaymentIntent(intentRef);

    if (!verification.verified) {
      if (verification.status === 'FAILED') {
        await finalizePaymentTransaction(trackingId, 'FAILED', 'CARD', verification.reason);
      }
      res.status(402).json({ error: verification.reason || 'Stripe has not confirmed this payment yet.' });
      return;
    }

    // The intent must belong to this payment and cover the full amount.
    if (verification.trackingId && verification.trackingId !== trackingId) {
      res.status(400).json({ error: 'Payment intent does not belong to this transaction.' });
      return;
    }
    if (!amountsMatch(payment.amount, verification.amount ?? -1)) {
      res.status(400).json({ error: 'Paid amount does not match the amount due.' });
      return;
    }

    const result = await finalizePaymentTransaction(trackingId, 'COMPLETED', 'CARD', undefined, {
      verifiedAmount: verification.amount,
      verifiedCurrency: verification.currency,
    });

    res.json({
      success: true,
      message: 'Card payment confirmed and subscription activated successfully!',
      payment: result.payment,
      invoice: result.invoice,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe confirmation failed';
    res.status(500).json({ error: msg });
  }
});

// 7. PayPal Orders v2 Creation Endpoint
paymentsRouter.post('/paypal/create-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { currency: requestedCurrency = 'USD', description, billingInterval = 'MONTHLY' } = req.body;

    let amount: number;
    let currency: string;
    let purchaseDescription: string;
    let planId: string | undefined;
    let featuredCampaignId: string | undefined;

    if (req.body.planId || req.body.featuredCampaignId) {
      const resolved = resolvePurchase(req.body, user.id);
      if ('error' in resolved) {
        res.status(resolved.status).json({ error: resolved.error });
        return;
      }
      ({ amount, currency, description: purchaseDescription, planId, featuredCampaignId } = resolved.purchase);
    } else {
      amount = Number(req.body.amount);
      currency = String(requestedCurrency).toUpperCase();
      purchaseDescription = description || 'Christian Radios Giving';
      if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: 'Valid amount is required' });
        return;
      }
    }

    const paypal = IntegrationService.getPayPalConfig();
    const trackingId = `PP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const payment = db.payments.create({
      id: `pay_pp_${Date.now()}`,
      trackingId,
      ownerId: user.id,
      subscriptionId: planId,
      featuredCampaignId,
      billingInterval: billingInterval as any,
      amount,
      currency,
      status: 'PENDING',
      provider: 'PAYPAL',
      paymentMethod: 'PAYPAL',
      description: purchaseDescription,
      createdAt: new Date().toISOString(),
    });

    if (!paypal.configured) {
      if (isProductionRuntime()) {
        res.status(503).json({ error: 'PayPal is not available right now. Please choose another payment method.' });
        return;
      }
      const sandboxOrderId = `PAYPAL_SANDBOX_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      res.json({
        success: true,
        orderId: sandboxOrderId,
        trackingId,
        approveUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${sandboxOrderId}`,
        paymentId: payment.id,
        sandbox: true,
      });
      return;
    }

    const authBase = paypal.env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const basicAuth = Buffer.from(`${paypal.clientId}:${paypal.clientSecret}`).toString('base64');

    const tokenRes = await fetch(`${authBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10000),
    });

    if (!tokenRes.ok) {
      db.payments.update(payment.id, { status: 'FAILED', failureReason: 'PayPal authentication failed.' });
      res.status(502).json({ error: 'Could not reach PayPal. Please try again.' });
      return;
    }

    const { access_token: accessToken } = (await tokenRes.json()) as { access_token?: string };
    if (!accessToken) {
      db.payments.update(payment.id, { status: 'FAILED', failureReason: 'PayPal did not return an access token.' });
      res.status(502).json({ error: 'Could not reach PayPal. Please try again.' });
      return;
    }

    const ppOrderRes = await fetch(`${authBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: trackingId,
            description: purchaseDescription,
            amount: { currency_code: currency, value: amount.toFixed(2) },
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!ppOrderRes.ok) {
      const errBody = await ppOrderRes.text();
      console.error(`[PayPal API] Order creation failed (HTTP ${ppOrderRes.status}):`, errBody);
      db.payments.update(payment.id, { status: 'FAILED', failureReason: 'PayPal order creation failed.' });
      res.status(502).json({ error: 'Could not start the PayPal checkout. Please try again.' });
      return;
    }

    const ppOrderData = (await ppOrderRes.json()) as { id?: string; links?: Array<{ rel: string; href: string }> };
    if (!ppOrderData.id) {
      db.payments.update(payment.id, { status: 'FAILED', failureReason: 'PayPal did not return an order id.' });
      res.status(502).json({ error: 'Could not start the PayPal checkout. Please try again.' });
      return;
    }

    db.payments.update(payment.id, { providerRef: ppOrderData.id });
    const approveLink = ppOrderData.links?.find((l) => l.rel === 'approve')?.href;

    res.json({
      success: true,
      orderId: ppOrderData.id,
      trackingId,
      approveUrl:
        approveLink ||
        `${paypal.env === 'live' ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com'}/checkoutnow?token=${ppOrderData.id}`,
      paymentId: payment.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PayPal initialization failed';
    res.status(500).json({ error: msg });
  }
});

// 7b. PayPal Order Capture Endpoint
paymentsRouter.post('/paypal/capture-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, trackingId } = req.body;
    if (!trackingId) {
      res.status(400).json({ error: 'trackingId is required' });
      return;
    }

    const payment = db.payments.findByTrackingId(trackingId);
    if (!payment) {
      res.status(404).json({ error: 'Transaction reference not found' });
      return;
    }
    if (!canActOnPayment(payment, req.user!)) {
      res.status(403).json({ error: 'You are not authorised to act on this transaction.' });
      return;
    }

    if (payment.status === 'COMPLETED') {
      const existingInvoice = db.invoices.getAll().find((i) => i.paymentId === payment.id);
      res.json({ success: true, payment, invoice: existingInvoice });
      return;
    }

    const paypal = IntegrationService.getPayPalConfig();
    if (!paypal.configured) {
      if (isProductionRuntime()) {
        res.status(503).json({ error: 'PayPal is not configured.' });
        return;
      }
      const sandboxResult = await finalizePaymentTransaction(trackingId, 'COMPLETED', 'PAYPAL');
      res.json({ success: sandboxResult.success, payment: sandboxResult.payment, invoice: sandboxResult.invoice, sandbox: true });
      return;
    }

    const verification = await capturePayPalOrder(orderId || payment.providerRef);

    if (!verification.verified) {
      if (verification.status === 'FAILED') {
        await finalizePaymentTransaction(trackingId, 'FAILED', 'PAYPAL', verification.reason);
      }
      res.status(402).json({ error: verification.reason || 'PayPal has not confirmed this payment.' });
      return;
    }

    if (verification.trackingId && verification.trackingId !== trackingId) {
      res.status(400).json({ error: 'PayPal order does not belong to this transaction.' });
      return;
    }
    if (!amountsMatch(payment.amount, verification.amount ?? -1)) {
      res.status(400).json({ error: 'Captured amount does not match the amount due.' });
      return;
    }

    const result = await finalizePaymentTransaction(trackingId, 'COMPLETED', 'PAYPAL', undefined, {
      verifiedAmount: verification.amount,
      verifiedCurrency: verification.currency,
    });

    res.json({
      success: result.success,
      payment: result.payment,
      invoice: result.invoice,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PayPal capture failed';
    res.status(500).json({ error: msg });
  }
});

// 8. Admin: Manually trigger PesaPal IPN registration (call after updating credentials or APP_URL)
paymentsRouter.post('/pesapal/register-ipn', requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const ipnId = await registerPesaPalIPN();
    res.json({
      success: true,
      ipnId,
      message: `PesaPal IPN registered successfully. IPN ID: ${ipnId}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'IPN registration failed';
    res.status(500).json({ error: msg });
  }
});
