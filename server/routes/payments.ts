import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';
import { createPesaPalOrder, finalizePaymentTransaction, queryPesaPalTransactionStatus } from '../pesapal.js';
import type { PaymentMethod } from '../types.js';

export const paymentsRouter = Router();

// 1. Create Checkout Order (for Subscription or Featured Placement)
paymentsRouter.post('/create-checkout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { planId, featuredCampaignId, paymentMethod = 'MPESA', billingInterval = 'MONTHLY' } = req.body;

    let amount = 0;
    let currency = 'TZS';
    let description = 'Christian Radios Broadcaster Service';

    if (planId) {
      const plan = db.plans.findById(planId);
      if (!plan) {
        res.status(404).json({ error: 'Subscription plan not found.' });
        return;
      }
      amount = billingInterval === 'ANNUAL' ? plan.annualPriceTzs : plan.monthlyPriceTzs;
      currency = plan.currency || 'TZS';
      description = `${plan.name} (${billingInterval === 'ANNUAL' ? '1 Year' : '1 Month'})`;
    } else if (featuredCampaignId) {
      const campaign = db.featuredCampaigns.getAll().find((c) => c.id === featuredCampaignId);
      if (!campaign) {
        res.status(404).json({ error: 'Featured campaign not found.' });
        return;
      }
      amount = campaign.price;
      currency = campaign.currency || 'TZS';
      description = `Featured Station Placement (${campaign.placement})`;
    } else {
      res.status(400).json({ error: 'Either planId or featuredCampaignId must be provided.' });
      return;
    }

    const order = await createPesaPalOrder({
      ownerId: user.id,
      userEmail: user.email,
      userName: user.name,
      userPhone: user.phone || '255700000000',
      amount,
      currency,
      description,
      subscriptionPlanId: planId,
      billingInterval,
      featuredCampaignId,
      paymentMethod: paymentMethod as PaymentMethod,
      callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/owner/subscriptions?verify_tracking_id=`,
    });

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
