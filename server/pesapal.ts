import crypto from 'crypto';
import { db } from './db.js';
import { IntegrationService } from './services/integrationService.js';
import type { Payment, PaymentMethod, PaymentStatus, Subscription } from './types.js';

export function getPesaPalConfig() {
  return IntegrationService.getPesaPalConfig();
}

let cachedToken: { token: string; expiresAt: number; configKey: string } | null = null;

export async function getPesaPalAuthToken(): Promise<string> {
  const config = getPesaPalConfig();

  if (cachedToken && cachedToken.configKey === config.consumerKey && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  if (!config.consumerKey || !config.consumerSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PesaPal credentials not configured in production environment.');
    }
    return 'sandbox_pesapal_jwt_token_local_dev';
  }

  try {
    const res = await fetch(`${config.baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
      }),
    });

    if (!res.ok) {
      throw new Error(`PesaPal auth error: HTTP ${res.status}`);
    }

    const data = (await res.json()) as { token: string; expiryDate: string };
    cachedToken = {
      token: data.token,
      expiresAt: Date.now() + 50 * 60 * 1000,
      configKey: config.consumerKey,
    };
    return data.token;
  } catch (err) {
    console.error('[PesaPal] Auth Token Request Failed:', err instanceof Error ? err.message : err);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PesaPal payment gateway authentication failed.');
    }
    return 'fallback_sandbox_token';
  }
}

/**
 * Register IPN URL with PesaPal and persist the returned IPN ID to settings.
 * Must be called at least once before submitting any live orders.
 */
export async function registerPesaPalIPN(): Promise<string> {
  const config = getPesaPalConfig();
  if (!config.consumerKey || !config.consumerSecret) {
    throw new Error('PesaPal credentials not configured.');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const ipnUrl = `${appUrl}/api/payments/pesapal/ipn-webhook`;

  const token = await getPesaPalAuthToken();
  const res = await fetch(`${config.baseUrl}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: ipnUrl,
      ipn_notification_type: 'GET',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PesaPal IPN registration failed: HTTP ${res.status} — ${body}`);
  }

  const data = (await res.json()) as { ipn_id?: string; url?: string; ipn_status?: string };
  const ipnId = data.ipn_id || '';

  if (ipnId) {
    // Persist to DB settings so all future orders use this IPN ID
    db.settings.update({ pesapalIpnId: ipnId } as any);
    console.log(`[PesaPal] IPN registered. ID: ${ipnId}, URL: ${ipnUrl}`);
  }

  return ipnId;
}

let ipnRegistrationDone = false;

/**
 * Ensures IPN is registered exactly once per server lifecycle.
 * Safe to call before every order — skips if already done or IPN ID exists.
 */
export async function ensurePesaPalIPN(): Promise<void> {
  if (ipnRegistrationDone) return;
  const config = getPesaPalConfig();
  if (!config.configured) return;

  if (config.ipnId) {
    ipnRegistrationDone = true;
    return;
  }

  try {
    await registerPesaPalIPN();
    ipnRegistrationDone = true;
  } catch (err) {
    console.error('[PesaPal] Auto IPN registration failed:', err instanceof Error ? err.message : err);
  }
}

export async function queryPesaPalTransactionStatus(orderTrackingId: string): Promise<{
  verified: boolean;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  description?: string;
  amount?: number;
  currency?: string;
}> {
  const config = getPesaPalConfig();
  const hasRealKeys =
    config.consumerKey &&
    config.consumerKey !== 'pesapal_live_or_sandbox_consumer_key';

  if (!hasRealKeys) {
    // Without credentials there is nothing to verify against. Auto-approving is
    // only acceptable for local/sandbox work; in production it would hand out
    // paid subscriptions for free.
    if (process.env.NODE_ENV === 'production') {
      return {
        verified: false,
        status: 'PENDING',
        description: 'PesaPal credentials are not configured, so the payment cannot be verified.',
      };
    }
    return {
      verified: true,
      status: 'COMPLETED',
      paymentMethod: 'MPESA',
      description: 'Dev sandbox verified status',
    };
  }

  try {
    const token = await getPesaPalAuthToken();
    const url = `${config.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`;
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
      amount?: number | string;
      currency?: string;
    };

    const statusDesc = (data.payment_status_description || '').toLowerCase();
    const paidAmount = Number(data.amount);
    const paidCurrency = data.currency ? String(data.currency).toUpperCase() : undefined;

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
        amount: Number.isFinite(paidAmount) ? paidAmount : undefined,
        currency: paidCurrency,
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
  premiumSubscriptionId?: string;
  donationId?: string;
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
    premiumSubscriptionId: params.premiumSubscriptionId,
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
  const config = getPesaPalConfig();
  const hasRealKeys =
    config.consumerKey &&
    config.consumerKey !== 'pesapal_live_or_sandbox_consumer_key';

  let redirectUrl = `/owner/payments/process?tracking_id=${orderTrackingId}&ref=${merchantReference}`;

  if (hasRealKeys) {
    try {
      const token = await getPesaPalAuthToken();
      const ipnId = config.ipnId;
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

      const res = await fetch(`${config.baseUrl}/api/Transactions/SubmitOrderRequest`, {
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
        const previousTrackingId = paymentRecord.trackingId;
        paymentRecord.trackingId = json.order_tracking_id;
        db.payments.update(paymentRecord.id, {
          trackingId: json.order_tracking_id,
        });
        // Donations are matched back to their payment by tracking id, so the
        // donation must follow the id PesaPal assigned.
        if (params.donationId) {
          db.donations.update(params.donationId, { trackingId: json.order_tracking_id });
        } else {
          const linkedDonation = db.donations.findByTrackingId(previousTrackingId);
          if (linkedDonation) {
            db.donations.update(linkedDonation.id, { trackingId: json.order_tracking_id });
          }
        }
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
const ZERO_DECIMAL_CURRENCIES = new Set(['TZS', 'UGX', 'RWF', 'KRW', 'JPY', 'VND', 'XAF', 'XOF']);

/** Rounds to the smallest unit the currency actually supports. */
function roundMoney(value: number, currency: string): number {
  if (!Number.isFinite(value)) return 0;
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? Math.round(value)
    : Number(value.toFixed(2));
}

/**
 * Derives the next invoice number from the highest issued sequence rather than
 * the record count, so deleting or archiving an invoice cannot cause a reuse.
 */
function nextInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const prefix = `CR-INV-${year}-`;
  const highest = db.invoices.getAll().reduce((max, inv) => {
    if (!inv.invoiceNumber?.startsWith(prefix)) return max;
    const seq = parseInt(inv.invoiceNumber.slice(prefix.length), 10);
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, '0')}`;
}

/**
 * Moves a listener's premium station subscription from PENDING to ACTIVE and
 * books the owner's revenue share. Only ever called from a verified payment.
 */
function activatePremiumStationSubscription(payment: Payment): void {
  const sub = db.premiumSubscriptions.findById(payment.premiumSubscriptionId!);
  if (!sub || sub.status === 'ACTIVE') return;

  const durationDays = sub.billingInterval === 'ANNUAL' ? 365 : 30;
  const currency = (sub.currency || payment.currency || 'USD').toUpperCase();
  const activated = db.premiumSubscriptions.update(sub.id, {
    status: 'ACTIVE',
    paymentId: payment.id,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + durationDays * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }) || sub;

  const station = db.stations.findById(activated.stationId);
  const ownerShare = roundMoney(activated.ownerShareTzs, currency);

  if (activated.ownerId && ownerShare > 0) {
    db.ledgerEntries.create({
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId: activated.ownerId,
      stationId: activated.stationId,
      type: 'PREMIUM_SHARE_CREDIT',
      amount: ownerShare,
      currency,
      status: 'SETTLED',
      balanceAfter: (db.ledgerEntries.getOwnerBalance(activated.ownerId)?.availableBalance || 0) + ownerShare,
      description: `Listener Premium Radio Subscription Share (${station?.name || activated.stationId})`,
      createdAt: new Date().toISOString(),
    });
  }

  const referral = db.referrals.findByReferredUserId(activated.listenerId);
  if (referral && referral.referrerId !== activated.listenerId) {
    const settings = db.settings.get();
    const commRate = settings.referralCommissionListenerPercentage || 10;
    const commAmount = roundMoney(activated.amountTzs * (commRate / 100), currency);

    if (commAmount > 0) {
      db.referralCommissions.create({
        id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        referralId: referral.id,
        referrerId: referral.referrerId,
        referredUserId: activated.listenerId,
        sourcePaymentId: payment.id,
        paymentType: 'PREMIUM_RADIO_SUBSCRIPTION',
        grossAmountTzs: activated.amountTzs,
        commissionPercentage: commRate,
        commissionAmountTzs: commAmount,
        status: 'SETTLED',
        settlesAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      db.referrals.update(referral.id, { status: 'QUALIFIED' });

      db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: referral.referrerId,
        title: 'Referral Commission Earned! 💰',
        message: `You earned ${currency} ${commAmount.toLocaleString()} (${commRate}%) from a subscriber you invited to Christian Radios!`,
        type: 'PAYMENT_SUCCESS',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (activated.ownerId) {
    const listener = db.users.findById(activated.listenerId);
    db.notifications.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: activated.ownerId,
      title: 'New Premium Station Subscriber!',
      message: `${listener?.fullName || listener?.name || 'A listener'} subscribed to your premium station "${station?.name || ''}" (${activated.billingInterval}).`,
      type: 'PAYMENT_SUCCESS',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}

export interface FinalizeOptions {
  /** Amount the gateway confirmed it actually collected. */
  verifiedAmount?: number;
  verifiedCurrency?: string;
}

export async function finalizePaymentTransaction(
  trackingId: string,
  verifiedStatus: PaymentStatus,
  providerMethod?: PaymentMethod,
  failureReason?: string,
  options: FinalizeOptions = {}
): Promise<{ success: boolean; payment: Payment | null; invoice?: any; error?: string }> {
  const payment = db.payments.findByTrackingId(trackingId);
  if (!payment) {
    return { success: false, payment: null };
  }

  // Idempotency: COMPLETED and FAILED are both terminal. Without the FAILED
  // guard a declined transaction could be replayed into a completed one.
  if (payment.status === 'COMPLETED') {
    return { success: verifiedStatus === 'COMPLETED', payment };
  }
  if (payment.status === 'FAILED' && verifiedStatus === 'COMPLETED') {
    return { success: false, payment, error: 'This transaction already failed and cannot be completed.' };
  }

  // Partial or wrong-currency settlements must not release entitlements.
  if (verifiedStatus === 'COMPLETED' && options.verifiedAmount !== undefined) {
    const shortfall = payment.amount - options.verifiedAmount;
    if (shortfall > 0.01) {
      db.payments.update(payment.id, {
        status: 'FAILED',
        failureReason: `Underpaid: received ${options.verifiedAmount} of ${payment.amount} ${payment.currency}.`,
      });
      return { success: false, payment: db.payments.findById(payment.id) || payment, error: 'Paid amount is less than the amount due.' };
    }
    if (options.verifiedCurrency && options.verifiedCurrency !== payment.currency.toUpperCase()) {
      db.payments.update(payment.id, {
        status: 'FAILED',
        failureReason: `Currency mismatch: paid in ${options.verifiedCurrency}, expected ${payment.currency}.`,
      });
      return { success: false, payment: db.payments.findById(payment.id) || payment, error: 'Payment currency does not match the amount due.' };
    }
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
        const invoiceNumber = nextInvoiceNumber();
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
            const commissionCurrency = updatedPayment.currency.toUpperCase();
            // Commission is paid in the same currency the subscriber was charged.
            const commAmount = roundMoney(updatedPayment.amount * (commRate / 100), commissionCurrency);

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
              currency: commissionCurrency,
              balanceAfter: currentBal.availableBalance + commAmount,
              description: `Referral commission for Broadcaster Subscription (${commRate}% of ${commissionCurrency} ${updatedPayment.amount.toLocaleString()})`,
              createdAt: new Date().toISOString(),
            });

            db.notifications.create({
              id: `notif_${Date.now()}`,
              userId: referral.referrerId,
              title: 'Referral Commission Earned! 💰',
              message: `You earned ${commissionCurrency} ${commAmount.toLocaleString()} in referral commission from a broadcaster subscription!`,
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
      const donationCurrency = (donation.currency || 'TZS').toUpperCase();
      const platformFeeAmount = roundMoney(grossAmount * (feePercentage / 100), donationCurrency);
      const netOwnerAmount = roundMoney(grossAmount - platformFeeAmount, donationCurrency);

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

    // If payment unlocks a listener's premium access to a single station
    if (updatedPayment.premiumSubscriptionId) {
      activatePremiumStationSubscription(updatedPayment);
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
