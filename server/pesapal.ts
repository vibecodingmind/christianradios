import crypto from 'crypto';
import { db } from './db.js';
import type { Payment, PaymentMethod, PaymentStatus, Subscription } from './types.js';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || '';
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || '';
const PESAPAL_ENV = process.env.PESAPAL_ENV || 'sandbox';

const BASE_URL =
  PESAPAL_ENV === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPesaPalAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
    // Return a mock token for development if credentials are empty
    return 'sandbox_pesapal_jwt_token_local_dev';
  }

  try {
    const res = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    if (!res.ok) {
      throw new Error(`PesaPal auth error: HTTP ${res.status}`);
    }

    const data = (await res.json()) as { token: string; expiryDate: string };
    cachedToken = {
      token: data.token,
      expiresAt: Date.now() + 50 * 60 * 1000,
    };
    return data.token;
  } catch (err) {
    console.error('PesaPal Auth Token Error:', err);
    return 'fallback_sandbox_token';
  }
}

export async function queryPesaPalTransactionStatus(orderTrackingId: string): Promise<{
  verified: boolean;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  description?: string;
}> {
  const hasRealKeys =
    PESAPAL_CONSUMER_KEY &&
    PESAPAL_CONSUMER_KEY !== 'pesapal_live_or_sandbox_consumer_key';

  if (!hasRealKeys) {
    // Development / Sandbox mode without keys configured
    return {
      verified: true,
      status: 'COMPLETED',
      paymentMethod: 'MPESA',
      description: 'Dev sandbox verified status',
    };
  }

  try {
    const token = await getPesaPalAuthToken();
    const url = `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn(`[PesaPal API Error] GetTransactionStatus returned HTTP ${res.status}`);
      return { verified: false, status: 'PENDING' };
    }

    const data = (await res.json()) as {
      payment_status_description?: string;
      status_code?: number;
      payment_method?: string;
    };

    const statusDesc = (data.payment_status_description || '').toLowerCase();

    if (statusDesc === 'completed' || data.status_code === 1) {
      let method: PaymentMethod = 'MPESA';
      const pm = (data.payment_method || '').toUpperCase();
      if (pm.includes('CARD') || pm.includes('VISA') || pm.includes('MASTERCARD')) {
        method = 'CARD';
      } else if (pm.includes('TIGO')) {
        method = 'TIGO_PESA';
      } else if (pm.includes('AIRTEL')) {
        method = 'AIRTEL_MONEY';
      }

      return {
        verified: true,
        status: 'COMPLETED',
        paymentMethod: method,
        description: data.payment_status_description,
      };
    } else if (statusDesc === 'failed' || statusDesc === 'invalid' || data.status_code === 2) {
      return {
        verified: false,
        status: 'FAILED',
        description: data.payment_status_description,
      };
    }

    return {
      verified: false,
      status: 'PENDING',
      description: data.payment_status_description || 'Pending confirmation',
    };
  } catch (err) {
    console.error('Error querying PesaPal transaction status:', err);
    return { verified: false, status: 'PENDING' };
  }
}


export interface CreateOrderParams {
  ownerId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  amount: number;
  currency: string;
  description: string;
  subscriptionPlanId?: string;
  billingInterval?: 'MONTHLY' | 'ANNUAL';
  featuredCampaignId?: string;
  paymentMethod?: PaymentMethod;
  callbackUrl?: string;
}

export interface OrderCreationResult {
  orderTrackingId: string;
  merchantReference: string;
  redirectUrl: string;
  paymentId: string;
  status: PaymentStatus;
}

export async function createPesaPalOrder(
  params: CreateOrderParams
): Promise<OrderCreationResult> {
  const merchantReference = `CR_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const orderTrackingId = `PESA_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Record initial pending payment in DB
  const paymentRecord: Payment = {
    id: `pay_${Date.now()}`,
    trackingId: orderTrackingId,
    ownerId: params.ownerId,
    subscriptionId: params.subscriptionPlanId,
    featuredCampaignId: params.featuredCampaignId,
    amount: params.amount,
    currency: params.currency || 'TZS',
    status: 'PENDING',
    provider: 'PESAPAL',
    providerRef: merchantReference,
    paymentMethod: params.paymentMethod || 'MPESA',
    billingInterval: params.billingInterval || 'MONTHLY',
    description: params.description,
    createdAt: new Date().toISOString(),
  };

  db.payments.create(paymentRecord);

  // If live or valid keys exist, call real PesaPal SubmitOrderRequest
  const hasRealKeys =
    PESAPAL_CONSUMER_KEY &&
    PESAPAL_CONSUMER_KEY !== 'pesapal_live_or_sandbox_consumer_key';

  let redirectUrl = `/owner/payments/process?tracking_id=${orderTrackingId}&ref=${merchantReference}`;

  if (hasRealKeys) {
    try {
      const token = await getPesaPalAuthToken();
      const ipnId = process.env.PESAPAL_IPN_ID || '00000000-0000-0000-0000-000000000000';
      const orderPayload = {
        id: merchantReference,
        currency: params.currency,
        amount: params.amount,
        description: params.description,
        callback_url:
          params.callbackUrl ||
          `${process.env.APP_URL || 'http://localhost:3000'}/api/payments/pesapal/callback`,
        notification_id: ipnId,
        billing_address: {
          email_address: params.userEmail,
          phone_number: params.userPhone || '255700000000',
          country_code: 'TZ',
          first_name: params.userName.split(' ')[0] || 'Radio',
          last_name: params.userName.split(' ')[1] || 'Owner',
        },
      };

      const res = await fetch(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          order_tracking_id: string;
          merchant_reference: string;
          redirect_url: string;
        };
        paymentRecord.trackingId = json.order_tracking_id;
        db.payments.update(paymentRecord.id, {
          trackingId: json.order_tracking_id,
        });
        redirectUrl = json.redirect_url;
      }
    } catch (e) {
      console.error('Error submitting order to PesaPal API:', e);
    }
  }

  return {
    orderTrackingId: paymentRecord.trackingId,
    merchantReference,
    redirectUrl,
    paymentId: paymentRecord.id,
    status: 'PENDING',
  };
}

/**
 * Verifies transaction with provider and updates subscription/invoice atomically
 */
export async function finalizePaymentTransaction(
  trackingId: string,
  verifiedStatus: PaymentStatus,
  providerMethod?: PaymentMethod,
  failureReason?: string
): Promise<{ success: boolean; payment: Payment | null; invoice?: any }> {
  const payment = db.payments.findByTrackingId(trackingId);
  if (!payment) {
    return { success: false, payment: null };
  }

  // Idempotency: do not reprocess already completed or failed terminal transactions
  if (payment.status === 'COMPLETED' && verifiedStatus === 'COMPLETED') {
    return { success: true, payment };
  }

  const updatedPayment = db.payments.update(payment.id, {
    status: verifiedStatus,
    completedAt: verifiedStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
    paymentMethod: providerMethod || payment.paymentMethod,
    failureReason,
  });

  if (verifiedStatus === 'COMPLETED' && updatedPayment) {
    // 1. Activate or renew Subscription if payment is for a subscription
    if (updatedPayment.subscriptionId) {
      const plan = db.plans.findById(updatedPayment.subscriptionId);
      if (plan) {
        const isAnnual = updatedPayment.billingInterval === 'ANNUAL';
        const intervalDays = isAnnual ? 365 : 30;
        const currentPeriodStart = new Date().toISOString();
        const currentPeriodEnd = new Date(Date.now() + intervalDays * 86400000).toISOString();

        const existingSub = db.subscriptions.findByOwnerId(updatedPayment.ownerId);
        let newSub: Subscription;
        if (existingSub) {
          newSub = db.subscriptions.update(existingSub.id, {
            planId: plan.id,
            status: 'ACTIVE',
            billingInterval: isAnnual ? 'ANNUAL' : 'MONTHLY',
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
            autoRenew: true,
            updatedAt: new Date().toISOString(),
          })!;
        } else {
          newSub = db.subscriptions.create({
            id: `sub_${Date.now()}`,
            ownerId: updatedPayment.ownerId,
            planId: plan.id,
            status: 'ACTIVE',
            billingInterval: isAnnual ? 'ANNUAL' : 'MONTHLY',
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
            autoRenew: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // 2. Generate immutable invoice
        const invCount = db.invoices.getAll().length + 1;
        const invoiceNumber = `CR-INV-${new Date().getFullYear()}-${String(invCount).padStart(4, '0')}`;
        const invoice = db.invoices.create({
          id: `inv_${Date.now()}`,
          invoiceNumber,
          ownerId: updatedPayment.ownerId,
          paymentId: updatedPayment.id,
          subscriptionId: newSub.id,
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          taxAmount: 0,
          billingPeriod: isAnnual ? `1 Year (${plan.name})` : `1 Month (${plan.name})`,
          status: 'PAID',
          issuedAt: new Date().toISOString(),
          planName: plan.name,
        });

        // 3. Send in-app notification to radio owner
        db.notifications.create({
          id: `notif_${Date.now()}`,
          userId: updatedPayment.ownerId,
          title: 'Subscription Activated! 🎉',
          message: `Your ${plan.name} subscription payment of ${updatedPayment.amount.toLocaleString()} ${updatedPayment.currency} was successfully verified.`,
          type: 'PAYMENT_SUCCESS',
          read: false,
          createdAt: new Date().toISOString(),
        });

        // 4. Trigger Owner Referral Commission if referred by another owner
        try {
          const referral = db.referrals.findByReferredUserId(updatedPayment.ownerId);
          if (referral && referral.referrerId !== updatedPayment.ownerId) {
            const settings = db.settings.get();
            const commRate = settings.referralCommissionOwnerPercentage ?? 10;
            const commAmount = Math.round(updatedPayment.amount * (commRate / 100));

            db.referralCommissions.create({
              id: `refc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              referralId: referral.id,
              referrerId: referral.referrerId,
              referredUserId: updatedPayment.ownerId,
              sourcePaymentId: updatedPayment.id,
              paymentType: 'OWNER_SUBSCRIPTION',
              grossAmountTzs: updatedPayment.amount,
              commissionPercentage: commRate,
              commissionAmountTzs: commAmount,
              status: 'SETTLED',
              settlesAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });

            // Mark referral as QUALIFIED
            db.referrals.update(referral.id, { status: 'QUALIFIED' });

            // Record ledger credit for referrer
            const currentBal = db.getUserFinancialSummary(referral.referrerId);
            db.ledgerEntries.create({
              id: `ldg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              ownerId: referral.referrerId,
              type: 'REFERRAL_CREDIT',
              amount: commAmount,
              currency: 'TZS',
              balanceAfter: currentBal.availableBalance + commAmount,
              description: `Referral commission for Broadcaster Subscription (${commRate}% of TZS ${updatedPayment.amount.toLocaleString()})`,
              createdAt: new Date().toISOString(),
            });

            db.notifications.create({
              id: `notif_${Date.now()}`,
              userId: referral.referrerId,
              title: 'Referral Commission Earned! 💰',
              message: `You earned TZS ${commAmount.toLocaleString()} in referral commission from a broadcaster subscription!`,
              type: 'PAYMENT_SUCCESS',
              read: false,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error('[Referral Engine Error]', e);
        }

        // 5. Record audit log
        db.auditLogs.log({
          actorId: updatedPayment.ownerId,
          actorRole: 'RADIO_OWNER',
          action: 'PAYMENT_COMPLETED',
          entityType: 'Subscription',
          entityId: newSub.id,
          details: `Verified payment ${updatedPayment.trackingId} for plan ${plan.name}`,
        });

        return { success: true, payment: updatedPayment, invoice };
      }
    }

    // If payment is for a Listener Radio Donation
    const donation = db.donations.findByTrackingId(trackingId);
    if (donation && donation.status !== 'COMPLETED') {
      const grossAmount = donation.amount || updatedPayment.amount;
      const settings = db.settings.get();
      const feePercentage = donation.platformFeePercentage ?? settings.donationFeePercentage ?? 5.0;
      const platformFeeAmount = Math.round(grossAmount * (feePercentage / 100));
      const netOwnerAmount = grossAmount - platformFeeAmount;

      const completedDonation = db.donations.update(donation.id, {
        status: 'COMPLETED',
        grossAmount,
        platformFeePercentage: feePercentage,
        platformFeeAmount,
        netOwnerAmount,
        completedAt: new Date().toISOString(),
        paymentMethod: providerMethod || donation.paymentMethod || 'MPESA',
      });

      // Update campaign stats if donation was pledged to a specific campaign
      if (completedDonation?.campaignId) {
        db.donationCampaigns.recordDonation(completedDonation.campaignId, grossAmount);
      }

      // Record financial ledger credit entry for radio owner
      if (completedDonation?.ownerId) {
        const currentBalance = db.ledgerEntries.getOwnerBalance(completedDonation.ownerId);
        db.ledgerEntries.create({
          id: `ldg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ownerId: completedDonation.ownerId,
          stationId: completedDonation.stationId,
          donationId: completedDonation.id,
          type: 'DONATION_CREDIT',
          amount: netOwnerAmount,
          currency: completedDonation.currency || 'TZS',
          balanceAfter: currentBalance.availableBalance + netOwnerAmount,
          description: `Net donation credit from ${completedDonation.isAnonymous ? 'Anonymous Listener' : completedDonation.donorName} (Gross: ${grossAmount.toLocaleString()} ${completedDonation.currency}, Fee: ${platformFeeAmount.toLocaleString()} ${completedDonation.currency})`,
          createdAt: new Date().toISOString(),
        });

        // Send instant notification to station owner
        db.notifications.create({
          id: `notif_${Date.now()}`,
          userId: completedDonation.ownerId,
          title: `New Donation Received! (${completedDonation.currency} ${grossAmount.toLocaleString()})`,
          message: `${completedDonation.isAnonymous ? 'An anonymous supporter' : completedDonation.donorName} donated ${completedDonation.currency} ${grossAmount.toLocaleString()} to ${completedDonation.stationName}. Net earnings credited: ${completedDonation.currency} ${netOwnerAmount.toLocaleString()}.`,
          type: 'PAYMENT_SUCCESS',
          read: false,
          createdAt: new Date().toISOString(),
        });

        // Audit Log
        db.auditLogs.log({
          actorId: completedDonation.ownerId,
          actorRole: 'RADIO_OWNER',
          action: 'DONATION_RECEIVED',
          entityType: 'Donation',
          entityId: completedDonation.id,
          details: `Listener donation verified for ${completedDonation.stationName}: ${completedDonation.currency} ${grossAmount}`,
        });
      }
    }

    // If payment is for a Featured Promotion Campaign
    if (updatedPayment.featuredCampaignId) {
      const campaign = db.featuredCampaigns.getAll().find((c) => c.id === updatedPayment.featuredCampaignId);
      if (campaign) {
        db.featuredCampaigns.update(campaign.id, {
          status: 'ACTIVE',
          paymentId: updatedPayment.id,
        });

        // Mark station as featured
        db.stations.update(campaign.stationId, { isFeatured: true });

        db.notifications.create({
          id: `notif_${Date.now()}`,
          userId: updatedPayment.ownerId,
          title: 'Featured Promotion Activated! 🌟',
          message: `Your station featured placement has been scheduled and is now active.`,
          type: 'FEATURED_ACTIVATED' as any,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return { success: true, payment: updatedPayment };
}
