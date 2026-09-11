import crypto from 'crypto';
import { IntegrationService } from './services/integrationService.js';

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Sandbox shortcuts (instant "simulated" approvals) must never be reachable in
 * production, otherwise any authenticated user can grant themselves a paid plan.
 */
export function simulatedPaymentsAllowed(): boolean {
  return !isProductionRuntime();
}

export interface GatewayVerification {
  verified: boolean;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  amount?: number;
  currency?: string;
  trackingId?: string;
  providerRef?: string;
  reason?: string;
}

/** Money comparison tolerant of gateway rounding to the minor unit. */
export function amountsMatch(expected: number, actual: number): boolean {
  if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;
  return Math.abs(expected - actual) < 0.01;
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

export function toStripeMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
}

export function fromStripeMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? amount : amount / 100;
}

/**
 * Server-to-server retrieval of a Stripe PaymentIntent. The client is never
 * trusted to report its own payment outcome.
 */
export async function verifyStripePaymentIntent(paymentIntentId: string): Promise<GatewayVerification> {
  const stripe = IntegrationService.getStripeConfig();
  if (!stripe.secretKey) {
    return { verified: false, status: 'PENDING', reason: 'Stripe secret key is not configured.' };
  }
  if (!paymentIntentId) {
    return { verified: false, status: 'PENDING', reason: 'paymentIntentId is required.' };
  }

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
      {
        headers: { Authorization: `Bearer ${stripe.secretKey}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return { verified: false, status: 'PENDING', reason: `Stripe HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    const intent = (await res.json()) as {
      status?: string;
      amount_received?: number;
      amount?: number;
      currency?: string;
      metadata?: Record<string, string>;
      id?: string;
    };

    const currency = (intent.currency || 'usd').toUpperCase();
    const minorUnits = intent.amount_received ?? intent.amount ?? 0;

    const base: GatewayVerification = {
      verified: false,
      status: 'PENDING',
      amount: fromStripeMinorUnits(minorUnits, currency),
      currency,
      trackingId: intent.metadata?.trackingId,
      providerRef: intent.id,
    };

    if (intent.status === 'succeeded') {
      return { ...base, verified: true, status: 'COMPLETED' };
    }
    if (intent.status === 'canceled') {
      return { ...base, status: 'FAILED', reason: 'PaymentIntent was canceled.' };
    }
    return { ...base, reason: `PaymentIntent status is "${intent.status}".` };
  } catch (err) {
    return {
      verified: false,
      status: 'PENDING',
      reason: err instanceof Error ? err.message : 'Stripe verification request failed.',
    };
  }
}

/**
 * Verifies a Stripe webhook signature (the `Stripe-Signature` scheme) against the
 * exact raw request body. Returns the parsed event, or null when untrusted.
 */
export function constructStripeEvent(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  toleranceSeconds = 300
): any | null {
  const stripe = IntegrationService.getStripeConfig();
  if (!stripe.webhookSecret || !signatureHeader) return null;

  const parts = signatureHeader.split(',').reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split('=');
    if (!key || !value) return acc;
    (acc[key.trim()] ||= []).push(value.trim());
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];
  if (!timestamp || signatures.length === 0) return null;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return null;

  const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expected = crypto
    .createHmac('sha256', stripe.webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  const matches = signatures.some((sig) => timingSafeEqualHex(sig, expected));
  if (!matches) return null;

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

function paypalApiBase(env: string): string {
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

export async function getPayPalAccessToken(): Promise<string | null> {
  const paypal = IntegrationService.getPayPalConfig();
  if (!paypal.configured) return null;

  try {
    const basicAuth = Buffer.from(`${paypal.clientId}:${paypal.clientSecret}`).toString('base64');
    const res = await fetch(`${paypalApiBase(paypal.env)}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Performs the real PayPal Orders v2 capture. A client-reported "success" is
 * never sufficient to release goods.
 */
export async function capturePayPalOrder(orderId: string): Promise<GatewayVerification> {
  const paypal = IntegrationService.getPayPalConfig();
  if (!paypal.configured) {
    return { verified: false, status: 'PENDING', reason: 'PayPal credentials are not configured.' };
  }
  if (!orderId) {
    return { verified: false, status: 'PENDING', reason: 'orderId is required.' };
  }

  const token = await getPayPalAccessToken();
  if (!token) {
    return { verified: false, status: 'PENDING', reason: 'Could not authenticate with PayPal.' };
  }

  try {
    const res = await fetch(
      `${paypalApiBase(paypal.env)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = (await res.json().catch(() => ({}))) as any;

    // A previously captured order replays as 422 ORDER_ALREADY_CAPTURED; fall
    // back to reading the order so replays stay idempotent rather than failing.
    if (!res.ok) {
      const issue = data?.details?.[0]?.issue;
      if (issue === 'ORDER_ALREADY_CAPTURED') {
        return await readPayPalOrder(orderId, token);
      }
      return {
        verified: false,
        status: 'PENDING',
        reason: `PayPal capture HTTP ${res.status}: ${issue || 'unknown error'}`,
      };
    }

    return interpretPayPalOrder(data);
  } catch (err) {
    return {
      verified: false,
      status: 'PENDING',
      reason: err instanceof Error ? err.message : 'PayPal capture request failed.',
    };
  }
}

async function readPayPalOrder(orderId: string, token: string): Promise<GatewayVerification> {
  const paypal = IntegrationService.getPayPalConfig();
  try {
    const res = await fetch(
      `${paypalApiBase(paypal.env)}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) {
      return { verified: false, status: 'PENDING', reason: `PayPal order lookup HTTP ${res.status}` };
    }
    return interpretPayPalOrder(await res.json());
  } catch (err) {
    return {
      verified: false,
      status: 'PENDING',
      reason: err instanceof Error ? err.message : 'PayPal order lookup failed.',
    };
  }
}

function interpretPayPalOrder(order: any): GatewayVerification {
  const unit = order?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const amountSource = capture?.amount || unit?.amount || {};
  const amount = Number(amountSource.value);
  const currency = (amountSource.currency_code || 'USD').toUpperCase();
  const trackingId = unit?.reference_id;

  const base: GatewayVerification = {
    verified: false,
    status: 'PENDING',
    amount: Number.isFinite(amount) ? amount : undefined,
    currency,
    trackingId,
    providerRef: capture?.id || order?.id,
  };

  const status = order?.status;
  const captureStatus = capture?.status;

  if (status === 'COMPLETED' && (!captureStatus || captureStatus === 'COMPLETED')) {
    return { ...base, verified: true, status: 'COMPLETED' };
  }
  if (captureStatus === 'DECLINED' || status === 'VOIDED') {
    return { ...base, status: 'FAILED', reason: `PayPal order status "${status}".` };
  }
  return { ...base, reason: `PayPal order status "${status}".` };
}
