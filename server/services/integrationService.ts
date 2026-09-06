import { db } from '../db.js';
import { decryptSecret, encryptSecret, maskSecret } from '../crypto.js';

export type IntegrationCategory =
  | 'EMAIL'
  | 'PAYMENTS'
  | 'AUTHENTICATION'
  | 'AI'
  | 'COMMUNICATION'
  | 'RADIO_DIRECTORY'
  | 'STORAGE'
  | 'ANALYTICS';

export interface IntegrationSummary {
  id: string;
  provider: string;
  category: IntegrationCategory;
  name: string;
  enabled: boolean;
  configured: boolean;
  environment?: 'sandbox' | 'live';
  status: 'CONNECTED' | 'CONNECTION_FAILED' | 'NOT_CONFIGURED' | 'DISABLED';
  lastTestedAt?: string;
  lastError?: string;
}

export class IntegrationService {
  /**
   * Resend Transactional Email Configuration
   */
  static getResendConfig() {
    const settings = db.settings.get();
    const rawKey = settings?.resendApiKey || process.env.RESEND_API_KEY || '';
    const apiKey = decryptSecret(rawKey).trim();
    const emailFrom =
      settings?.emailFrom ||
      process.env.EMAIL_FROM ||
      'Christian Radios <auth@christianradios.org>';

    return {
      configured: Boolean(apiKey),
      apiKey,
      emailFrom,
    };
  }

  /**
   * SMTP Configuration
   */
  static getSmtpConfig() {
    const settings = db.settings.get();
    const host = settings?.smtpHost || process.env.SMTP_HOST || '';
    const port = settings?.smtpPort || Number(process.env.SMTP_PORT) || 587;
    const secure = settings?.smtpSecure ?? (process.env.SMTP_SECURE === 'true');
    const user = settings?.smtpUser || process.env.SMTP_USER || '';
    const rawPass = settings?.smtpPass || process.env.SMTP_PASS || '';
    const pass = decryptSecret(rawPass);
    const from =
      settings?.emailFrom ||
      process.env.EMAIL_FROM ||
      'Christian Radios <auth@christianradios.org>';

    return {
      configured: Boolean(host && user),
      host,
      port,
      secure,
      user,
      pass,
      from,
    };
  }

  /**
   * Active Email Provider Config
   */
  static getActiveEmailConfig() {
    const settings = db.settings.get();
    const provider =
      settings?.emailProvider ||
      (process.env.RESEND_API_KEY ? 'RESEND' : process.env.SMTP_HOST ? 'SMTP' : 'SIMULATOR');

    if (provider === 'RESEND') {
      const resend = this.getResendConfig();
      return { provider: 'RESEND' as const, ...resend };
    }
    if (provider === 'SMTP') {
      const smtp = this.getSmtpConfig();
      return { provider: 'SMTP' as const, ...smtp };
    }
    return {
      provider: 'SIMULATOR' as const,
      configured: true,
      emailFrom: settings?.emailFrom || 'Christian Radios <auth@christianradios.org>',
    };
  }

  /**
   * PesaPal 3.0 Configuration
   */
  static getPesaPalConfig() {
    const settings = db.settings.get();
    const env = (settings?.pesapalEnv || process.env.PESAPAL_ENV || 'sandbox') as 'live' | 'sandbox';
    const consumerKey = (settings?.pesapalConsumerKey || process.env.PESAPAL_CONSUMER_KEY || '').trim();
    const rawSecret = settings?.pesapalConsumerSecret || process.env.PESAPAL_CONSUMER_SECRET || '';
    const consumerSecret = decryptSecret(rawSecret).trim();
    const ipnId = (settings?.pesapalIpnId || process.env.PESAPAL_IPN_ID || '').trim();
    const enabled = settings?.pesapalEnabled ?? true;

    const baseUrl =
      env === 'live'
        ? 'https://pay.pesapal.com/v3'
        : 'https://cybqa.pesapal.com/pesapalv3';

    return {
      enabled,
      configured: Boolean(consumerKey && consumerSecret),
      env,
      consumerKey,
      consumerSecret,
      ipnId,
      baseUrl,
    };
  }

  /**
   * Stripe Configuration
   */
  static getStripeConfig() {
    const settings = db.settings.get();
    const enabled = settings?.stripeEnabled ?? true;
    const env = (settings?.stripeEnv || 'sandbox') as 'sandbox' | 'live';
    const publishableKey = (settings?.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
    const rawSecret = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '';
    const secretKey = decryptSecret(rawSecret).trim();
    const rawWhSec = settings?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
    const webhookSecret = decryptSecret(rawWhSec).trim();

    return {
      enabled,
      configured: Boolean(secretKey),
      env,
      publishableKey,
      secretKey,
      webhookSecret,
    };
  }

  /**
   * PayPal Configuration
   */
  static getPayPalConfig() {
    const settings = db.settings.get();
    const enabled = settings?.paypalEnabled ?? true;
    const env = (settings?.paypalEnv || 'sandbox') as 'sandbox' | 'live';
    const clientId = (settings?.paypalClientId || process.env.PAYPAL_CLIENT_ID || '').trim();
    const rawSecret = settings?.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET || '';
    const clientSecret = decryptSecret(rawSecret).trim();

    return {
      enabled,
      configured: Boolean(clientId && clientSecret),
      env,
      clientId,
      clientSecret,
    };
  }

  /**
   * Google OAuth Configuration
   */
  static getGoogleOAuthConfig() {
    const settings = db.settings.get();
    const enabled = settings?.googleAuthEnabled ?? true;
    const clientId = (settings?.googleClientId || process.env.GOOGLE_CLIENT_ID || '').trim();
    const rawSecret = settings?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
    const clientSecret = decryptSecret(rawSecret).trim();

    return {
      enabled,
      configured: Boolean(clientId),
      clientId,
      clientSecret,
    };
  }

  /**
   * Google Gemini AI Configuration
   */
  static getGeminiConfig() {
    const settings = db.settings.get();
    const enabled = typeof settings?.aiEnabled === 'boolean' ? settings.aiEnabled : true;
    const rawKey = settings?.aiApiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
    const apiKey = decryptSecret(rawKey).trim();
    const model = settings?.aiModel || 'gemini-2.5-flash';
    const systemPromptOverride = settings?.systemPromptOverride || '';

    return {
      enabled,
      configured: Boolean(apiKey),
      apiKey,
      model,
      systemPromptOverride,
    };
  }

  /**
   * WhatsApp Studio Gateway Configuration
   */
  static getWhatsAppConfig() {
    const settings = db.settings.get();
    const enabled = settings?.whatsappGatewayEnabled ?? true;
    const apiUrl = settings?.whatsappApiUrl || process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
    const phoneNumberId = (settings?.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    const rawToken = settings?.whatsappAccessToken || process.env.WHATSAPP_ACCESS_TOKEN || '';
    const accessToken = decryptSecret(rawToken).trim();
    const verifyToken = settings?.whatsappVerifyToken || process.env.WHATSAPP_VERIFY_TOKEN || 'christian_radios_wa_webhook_token';
    const defaultNumber = settings?.whatsappDefaultNumber || process.env.WHATSAPP_DEFAULT_NUMBER || '+255700000000';

    return {
      enabled,
      configured: Boolean(phoneNumberId || defaultNumber),
      apiUrl,
      phoneNumberId,
      accessToken,
      verifyToken,
      defaultNumber,
    };
  }

  /**
   * Radio Browser Streaming Directory API Configuration
   */
  static getRadioBrowserConfig() {
    const settings = db.settings.get();
    const apiUrl = settings?.radioBrowserApiUrl || process.env.RADIO_BROWSER_API_URL || 'https://de1.api.radio-browser.info';
    const autoSyncIntervalHours = settings?.autoSyncStreamsIntervalHours || 6;

    return {
      apiUrl,
      autoSyncIntervalHours,
    };
  }

  /**
   * Retrieve Public Summary of all Integrations for Admin Portal
   */
  static getIntegrationSummaries(): IntegrationSummary[] {
    const resend = this.getResendConfig();
    const smtp = this.getSmtpConfig();
    const pesapal = this.getPesaPalConfig();
    const stripe = this.getStripeConfig();
    const paypal = this.getPayPalConfig();
    const google = this.getGoogleOAuthConfig();
    const gemini = this.getGeminiConfig();
    const wa = this.getWhatsAppConfig();
    const radio = this.getRadioBrowserConfig();

    return [
      {
        id: 'resend',
        provider: 'Resend',
        category: 'EMAIL',
        name: 'Resend Transactional Email',
        enabled: true,
        configured: resend.configured,
        status: resend.configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      },
      {
        id: 'smtp',
        provider: 'SMTP',
        category: 'EMAIL',
        name: 'Custom SMTP Server',
        enabled: true,
        configured: smtp.configured,
        status: smtp.configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      },
      {
        id: 'pesapal',
        provider: 'PesaPal 3.0',
        category: 'PAYMENTS',
        name: 'PesaPal Mobile Money & Cards',
        enabled: pesapal.enabled,
        configured: pesapal.configured,
        environment: pesapal.env,
        status: !pesapal.enabled ? 'DISABLED' : pesapal.configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      },
      {
        id: 'stripe',
        provider: 'Stripe',
        category: 'PAYMENTS',
        name: 'Stripe International Gateway',
        enabled: stripe.enabled,
        configured: stripe.configured,
        environment: stripe.env,
        status: !stripe.enabled ? 'DISABLED' : stripe.configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      },
      {
        id: 'paypal',
        provider: 'PayPal',
        category: 'PAYMENTS',
        name: 'PayPal Global Checkout',
        enabled: paypal.enabled,
        configured: paypal.configured,
        environment: paypal.env,
        status: !paypal.enabled ? 'DISABLED' : paypal.configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      },
      {
        id: 'google',
        provider: 'Google Identity',
        category: 'AUTHENTICATION',
        name: 'Google OAuth Single Sign-On',
        enabled: google.enabled,
        configured: google.configured,
        status: !google.enabled ? 'DISABLED' : google.configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      },
      {
        id: 'gemini',
        provider: 'Google Gemini',
        category: 'AI',
        name: 'Gemini AI Search & Chaplain Engine',
        enabled: gemini.enabled,
        configured: gemini.configured,
        status: !gemini.enabled ? 'DISABLED' : gemini.configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      },
      {
        id: 'whatsapp',
        provider: 'Meta Cloud API',
        category: 'COMMUNICATION',
        name: 'WhatsApp Studio Gateway',
        enabled: wa.enabled,
        configured: wa.configured,
        status: !wa.enabled ? 'DISABLED' : wa.configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      },
      {
        id: 'radio_browser',
        provider: 'Radio-Browser',
        category: 'RADIO_DIRECTORY',
        name: 'Radio Browser Public Directory',
        enabled: true,
        configured: true,
        status: 'CONNECTED',
      },
    ];
  }
}
