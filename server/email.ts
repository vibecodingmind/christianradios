import { IntegrationService } from './services/integrationService.js';

export interface EmailPayload {
  to: string;
  name: string;
  code: string;
  token: string;
  role?: string;
  baseUrl?: string;
}

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  sentAt: string;
  provider: 'SMTP' | 'RESEND' | 'SIMULATOR';
}

const sentEmailsStore: SentEmailRecord[] = [];

export function getSentEmails(): SentEmailRecord[] {
  return [...sentEmailsStore];
}

/**
 * Builds a modern, high-conversion HTML email template for Christian Radios authentication.
 */
function buildVerificationHtml(payload: EmailPayload): string {
  const { name, code, token, role, baseUrl = 'https://christianradios-production.up.railway.app' } = payload;
  const magicLink = `${baseUrl}/?verify_token=${token}&email=${encodeURIComponent(payload.to)}`;
  const roleName = role === 'RADIO_OWNER' ? 'Broadcaster / Station Owner' : 'Gospel Radio Listener';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Christian Radios Authentication</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 40px auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #0284c7 0%, #3b82f6 50%, #6366f1 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      margin-bottom: 16px;
    }
    .logo-icon {
      font-size: 28px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #ffffff;
      margin: 0;
    }
    .subtitle {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 40px 36px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 600;
      color: #f8fafc;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 32px;
    }
    .code-box {
      background-color: #020617;
      border: 2px dashed #0284c7;
      border-radius: 18px;
      padding: 24px;
      text-align: center;
      margin-bottom: 32px;
    }
    .code-label {
      font-size: 12px;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .code-value {
      font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;
      font-size: 38px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.25em;
      margin-left: 0.25em;
    }
    .code-expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .divider {
      position: relative;
      text-align: center;
      margin: 32px 0;
    }
    .divider::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background-color: #1e293b;
    }
    .divider-text {
      position: relative;
      background-color: #0f172a;
      padding: 0 16px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .cta-button {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      color: #ffffff !important;
      text-align: center;
      padding: 16px 24px;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      box-sizing: border-box;
      box-shadow: 0 10px 20px -5px rgba(2, 132, 199, 0.4);
    }
    .security-note {
      font-size: 12px;
      line-height: 1.5;
      color: #64748b;
      margin-top: 32px;
      padding: 16px;
      background-color: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      border-left: 3px solid #38bdf8;
    }
    .footer {
      padding: 24px 36px;
      background-color: #0b1120;
      border-top: 1px solid #1e293b;
      text-align: center;
      font-size: 12px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-container">
        <span class="logo-icon">📻</span>
      </div>
      <h1 class="title">Christian Radios</h1>
      <div class="subtitle">Global Gospel & Worship Network</div>
    </div>

    <div class="content">
      <h2 class="greeting">Peace be with you, ${name || 'Beloved Listener'}</h2>
      <p class="message">
        You are authenticating as a <strong>${roleName}</strong>. Use the 6-digit authentication code below to access your account securely.
      </p>

      <div class="code-box">
        <div class="code-label">One-Time Verification Code</div>
        <div class="code-value">${code}</div>
        <div class="code-expiry">Expires in 15 minutes • Single-use authentication</div>
      </div>

      <div class="divider">
        <span class="divider-text">OR CLICK DIRECT ACCESS</span>
      </div>

      <a href="${magicLink}" class="cta-button" target="_blank">
        Instant One-Click Sign In &rarr;
      </a>

      <div class="security-note">
        <strong>Security Notice:</strong> If you did not request this login code, you can safely ignore this email. No access will be granted without this authorization code.
      </div>
    </div>

    <div class="footer">
      &copy; 2026 Christian Radios Network • Spreading the Word of God Across Every Nation.<br>
      Automated Transactional Gateway • Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches verification email via active provider (Resend, SMTP, or Simulator)
 */
export async function sendAuthVerificationEmail(payload: EmailPayload): Promise<{
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}> {
  const { to, code, token } = payload;
  const emailConfig = IntegrationService.getActiveEmailConfig();

  const record: SentEmailRecord = {
    id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    to,
    subject: `Your Christian Radios Login Authentication Code`,
    sentAt: new Date().toISOString(),
    provider: emailConfig.provider,
  };

  // 1. Resend API
  if (emailConfig.provider === 'RESEND') {
    const resend = IntegrationService.getResendConfig();
    if (!resend.apiKey) {
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          provider: 'RESEND',
          error: 'Email delivery unconfigured in production.',
        };
      }
    } else {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resend.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resend.emailFrom,
            to: [to],
            subject: `Your Christian Radios Authentication Code: ${code}`,
            html: buildVerificationHtml(payload),
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as { id: string };
          record.provider = 'RESEND';
          sentEmailsStore.unshift(record);
          return { success: true, provider: 'RESEND', messageId: json.id };
        } else {
          const errText = await res.text();
          console.warn(`[Email Service] Resend API error (HTTP ${res.status}): ${errText}`);
          return { success: false, provider: 'RESEND', error: `Resend HTTP ${res.status}` };
        }
      } catch (err: any) {
        console.warn('[Email Service] Resend dispatch failure:', err.message);
        return { success: false, provider: 'RESEND', error: err.message };
      }
    }
  }

  // 2. Production safety check
  if (process.env.NODE_ENV === 'production') {
    return {
      success: false,
      provider: emailConfig.provider,
      error: 'Production email provider not configured. Please configure Resend or SMTP.',
    };
  }

  // 3. Local Development Simulator Mode (NEVER logs OTP or Token in production)
  sentEmailsStore.unshift(record);
  if (sentEmailsStore.length > 100) {
    sentEmailsStore.pop();
  }

  return { success: true, provider: 'SIMULATOR', messageId: record.id };
}
