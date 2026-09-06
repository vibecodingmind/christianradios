import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';
import { createPesaPalOrder, finalizePaymentTransaction, queryPesaPalTransactionStatus } from '../pesapal.js';
import type { PaymentMethod } from '../types.js';

export const paymentsRouter = Router();

// 1. Create Checkout Order (for Subscription or Featured Placement)
paymentsRouter.post(['/create-checkout', '/checkout'], requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { planId, featuredCampaignId, paymentMethod = 'PESAPAL', billingInterval = 'MONTHLY' } = req.body;

    let amount = 0;
    let currency = 'USD';
    let description = 'Christian Radios Broadcaster Service';

    if (planId) {
      const plan = db.plans.findById(planId);
      if (!plan) {
        res.status(404).json({ error: 'Subscription plan not found.' });
        return;
      }
      amount = billingInterval === 'ANNUAL' ? plan.annualPriceUsd : plan.monthlyPriceUsd;
      currency = plan.currency || 'USD';
      description = `${plan.name} (${billingInterval === 'ANNUAL' ? '1 Year' : '1 Month'})`;
    } else if (featuredCampaignId) {
      const campaign = db.featuredCampaigns.getAll().find((c) => c.id === featuredCampaignId);
      if (!campaign) {
        res.status(404).json({ error: 'Featured campaign not found.' });
        return;
      }
      amount = campaign.price;
      currency = campaign.currency || 'USD';
      description = `Featured Station Placement (${campaign.placement})`;
    } else {
      res.status(400).json({ error: 'Either planId or featuredCampaignId must be provided.' });
      return;
    }

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
      callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/owner/subscriptions?verify_tracking_id=`,
    });

    // If sandbox / simulated payment requested, finalize atomically right away
    if (req.body.simulateInstant || paymentMethod === 'SIMULATED') {
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
      verification.paymentMethod || 'MPESA'
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

// 3. Payment Status Verification (invoked by client or return URL)
paymentsRouter.get('/pesapal/verify', async (req, res) => {
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

  // Query PesaPal API if pending
  if (payment.status === 'PENDING') {
    const verification = await queryPesaPalTransactionStatus(trackingId);
    if (verification.status === 'COMPLETED') {
      await finalizePaymentTransaction(trackingId, 'COMPLETED', verification.paymentMethod || payment.paymentMethod || 'MPESA');
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

// 4. Test Sandbox Mobile Money Simulator (For fast tester & developer verification)
paymentsRouter.post('/simulate-instant-mobile-money', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { trackingId, method = 'MPESA' } = req.body;
  if (!trackingId) {
    res.status(400).json({ error: 'trackingId is required' });
    return;
  }

  const result = await finalizePaymentTransaction(
    trackingId,
    'COMPLETED',
    method as PaymentMethod
  );

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
    const durationDays = billingInterval === 'ANNUAL' ? 365 : 30;

    const ownerShare = Number((price * 0.8).toFixed(2));
    const platformShare = Number((price - ownerShare).toFixed(2));

    const sub = db.premiumSubscriptions.create({
      id: `pr_sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      listenerId: user.id,
      stationId: station.id,
      ownerId: station.ownerId,
      status: 'ACTIVE',
      billingInterval,
      amountTzs: price,
      ownerShareTzs: ownerShare,
      platformShareTzs: platformShare,
      currency: 'USD',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + durationDays * 86400000).toISOString(),
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Credit Owner Ledger
    db.ledgerEntries.create({
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId: station.ownerId,
      stationId: station.id,
      type: 'PREMIUM_SHARE_CREDIT',
      amount: ownerShare,
      currency: 'USD',
      status: 'SETTLED',
      balanceAfter: (db.ledgerEntries.getOwnerBalance(station.ownerId)?.availableBalance || 0) + ownerShare,
      description: `Listener Premium Radio Subscription Share (${station.name})`,
      createdAt: new Date().toISOString(),
    });

    // Trigger Referral Commission if listener was referred
    const referral = db.referrals.findByReferredUserId(user.id);
    if (referral && referral.referrerId !== user.id) {
      const settings = db.settings.get();
      const commRate = settings.referralCommissionListenerPercentage || 10;
      // Convert USD subscription price to TZS (1 USD = ~2600 TZS)
      const priceInTzs = Math.round(price * 2600);
      const commAmount = Math.round(priceInTzs * (commRate / 100));

      if (commAmount > 0) {
        db.referralCommissions.create({
          id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          referralId: referral.id,
          referrerId: referral.referrerId,
          referredUserId: user.id,
          sourcePaymentId: sub.id,
          paymentType: 'PREMIUM_RADIO_SUBSCRIPTION',
          grossAmountTzs: priceInTzs,
          commissionPercentage: commRate,
          commissionAmountTzs: commAmount,
          status: 'SETTLED',
          settlesAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });

        // Mark referral as QUALIFIED
        db.referrals.update(referral.id, { status: 'QUALIFIED' });

        // Notify referrer
        db.notifications.create({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: referral.referrerId,
          title: 'Referral Commission Earned! 💰',
          message: `You earned TZS ${commAmount.toLocaleString()} (${commRate}%) from a subscriber you invited to Christian Radios!`,
          type: 'PAYMENT_SUCCESS',
          read: false,
          createdAt: new Date().toISOString(),
        });

        console.log(`[Referral System] Commission TZS ${commAmount} awarded to referrer ${referral.referrerId} for listener ${user.id} subscription to ${station.name}`);
      }
    }

    if (station.ownerId) {
      db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: station.ownerId,
        title: 'New Premium Station Subscriber!',
        message: `${user.fullName || user.name || user.email} subscribed to your premium station "${station.name}" (${billingInterval}).`,
        type: 'PAYMENT_SUCCESS',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: `Successfully subscribed to ${station.name}!`,
      subscription: sub,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Subscription failed';
    res.status(500).json({ error: message });
  }
});

// 6. Stripe PaymentIntent Creation Endpoint
paymentsRouter.post('/stripe/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'USD', description, metadata = {}, ownerId, planId, billingInterval = 'MONTHLY' } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount is required' });
      return;
    }

    const settings = db.settings.get();
    const trackingId = `STRIPE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Record pending transaction
    const payment = db.payments.create({
      id: `pay_str_${Date.now()}`,
      trackingId,
      ownerId: ownerId || 'platform',
      subscriptionId: planId || undefined,
      billingInterval: billingInterval as any,
      amount: Number(amount),
      currency: currency.toUpperCase(),
      status: 'PENDING',
      provider: 'STRIPE',
      paymentMethod: 'CARD',
      description: description || 'Christian Radios Offering / Subscription',
      createdAt: new Date().toISOString(),
    });

    let clientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 8)}`;

    // If Stripe Secret Key is configured, attempt real Stripe REST API PaymentIntent creation
    if (settings.stripeSecretKey && !settings.stripeSecretKey.startsWith('sk_test_mock')) {
      try {
        const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${settings.stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: Math.round(Number(amount) * 100).toString(), // convert to cents
            currency: currency.toLowerCase(),
            description: description || 'Christian Radios Payment',
            'metadata[trackingId]': trackingId,
          }),
        });

        if (stripeRes.ok) {
          const stripeData = (await stripeRes.json()) as { client_secret?: string; id?: string };
          if (stripeData.client_secret) {
            clientSecret = stripeData.client_secret;
            db.payments.update(payment.id, { providerRef: stripeData.id });
          }
        } else {
          console.warn('[Stripe API] Live creation warning, continuing with sandbox intent:', await stripeRes.text());
        }
      } catch (err) {
        console.warn('[Stripe API] Direct request error, fallback to sandbox intent:', err);
      }
    }

    res.json({
      success: true,
      clientSecret,
      trackingId,
      paymentId: payment.id,
      publishableKey: settings.stripePublishableKey || 'pk_test_cr_demo_sandbox',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe initialization failed';
    res.status(500).json({ error: msg });
  }
});

// 6b. Stripe Webhook & Verification Receiver
paymentsRouter.post('/stripe/webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data?.object;
      const trackingId = intent?.metadata?.trackingId;
      if (trackingId) {
        await finalizePaymentTransaction(trackingId, 'COMPLETED', 'CARD');
        console.log(`[Stripe Webhook] Successfully finalized transaction: ${trackingId}`);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook Error]:', err);
    res.status(400).json({ error: 'Webhook handling failed' });
  }
});

// 6c. Stripe Client Confirmation Endpoint
paymentsRouter.post('/stripe/confirm-intent', async (req, res) => {
  try {
    const { trackingId, paymentIntentId } = req.body;
    if (!trackingId) {
      res.status(400).json({ error: 'trackingId is required' });
      return;
    }

    const result = await finalizePaymentTransaction(trackingId, 'COMPLETED', 'CARD');
    if (!result.success) {
      res.status(404).json({ error: 'Transaction reference not found' });
      return;
    }

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
paymentsRouter.post('/paypal/create-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', description, ownerId, planId, billingInterval = 'MONTHLY' } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount is required' });
      return;
    }

    const settings = db.settings.get();
    const trackingId = `PP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const payment = db.payments.create({
      id: `pay_pp_${Date.now()}`,
      trackingId,
      ownerId: ownerId || 'platform',
      subscriptionId: planId || undefined,
      billingInterval: billingInterval as any,
      amount: Number(amount),
      currency: currency.toUpperCase(),
      status: 'PENDING',
      provider: 'PAYPAL',
      paymentMethod: 'PAYPAL',
      description: description || 'Christian Radios Giving / Subscription',
      createdAt: new Date().toISOString(),
    });

    const mockOrderId = `PAYPAL_ORD_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    let orderId = mockOrderId;
    let approveUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`;

    // If real PayPal API credentials configured
    if (settings.paypalClientId && settings.paypalClientSecret) {
      try {
        const authBase = settings.paypalEnv === 'live'
          ? 'https://api-m.paypal.com'
          : 'https://api-m.sandbox.paypal.com';

        const basicAuth = Buffer.from(`${settings.paypalClientId}:${settings.paypalClientSecret}`).toString('base64');
        const tokenRes = await fetch(`${authBase}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });

        if (tokenRes.ok) {
          const tokenData = (await tokenRes.json()) as { access_token?: string };
          if (tokenData.access_token) {
            const ppOrderRes = await fetch(`${authBase}/v2/checkout/orders`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                  {
                    reference_id: trackingId,
                    description: description || 'Christian Radios Offering',
                    amount: {
                      currency_code: currency.toUpperCase(),
                      value: Number(amount).toFixed(2),
                    },
                  },
                ],
              }),
            });

            if (ppOrderRes.ok) {
              const ppOrderData = (await ppOrderRes.json()) as {
                id?: string;
                links?: Array<{ rel: string; href: string }>;
              };
              if (ppOrderData.id) {
                orderId = ppOrderData.id;
                const link = ppOrderData.links?.find((l) => l.rel === 'approve');
                if (link?.href) approveUrl = link.href;
                db.payments.update(payment.id, { providerRef: orderId });
              }
            }
          }
        }
      } catch (err) {
        console.warn('[PayPal API] Order creation warning, continuing with sandbox:', err);
      }
    }

    res.json({
      success: true,
      orderId,
      trackingId,
      approveUrl,
      paymentId: payment.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PayPal initialization failed';
    res.status(500).json({ error: msg });
  }
});

// 7b. PayPal Order Capture Endpoint
paymentsRouter.post('/paypal/capture-order', async (req, res) => {
  try {
    const { orderId, trackingId } = req.body;
    if (!trackingId) {
      res.status(400).json({ error: 'trackingId is required' });
      return;
    }

    const result = await finalizePaymentTransaction(trackingId, 'COMPLETED', 'PAYPAL');
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
