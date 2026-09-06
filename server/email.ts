import { db } from './db.js';

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
  code: string;
  token: string;
  sentAt: string;
  provider: 'SMTP' | 'RESEND' | 'SIMULATOR';
}

const sentEmailsStore: SentEmailRecord[] = [];

export function getSentEmails(): SentEmailRecord[] {
  return [...sentEmailsStore];
}

export function getLatestEmailFor(email: string): SentEmailRecord | undefined {
  const clean = email.toLowerCase().trim();
  return sentEmailsStore
    .filter((e) => e.to.toLowerCase() === clean)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];
}

/**
 * Builds a modern, high-conversion HTML email template for Christian Radios authentication.
 */
function buildVerificationHtml(payload: EmailPayload): string {
  const { name, code, token, role, baseUrl = 'http://localhost:3000' } = payload;
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
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #0284c7 0%, #312e81 50%, #0f172a 100%);
      padding: 36px 32px 30px;
      text-align: center;
      border-bottom: 1px solid #1e293b;
    }
    .brand-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      margin: 12px 0 4px;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      color: #bae6fd;
      font-size: 13px;
      margin: 0;
      font-weight: 500;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .lead-text {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .code-box {
      background: #020617;
      border: 2px dashed #0284c7;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .code-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #38bdf8;
      margin-bottom: 8px;
    }
    .code-number {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #f8fafc;
      text-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
      margin: 4px 0;
      padding-left: 12px;
    }
    .code-expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .cta-container {
      text-align: center;
      margin: 28px 0 20px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 32px;
      border-radius: 14px;
      box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.3);
    }
    .divider {
      border-top: 1px solid #1e293b;
      margin: 32px 0 24px;
    }
    .security-note {
      font-size: 12px;
      line-height: 1.5;
      color: #64748b;
    }
    .footer {
      background-color: #090d16;
      padding: 24px 32px;
      text-align: center;
      font-size: 11px;
      color: #475569;
      border-top: 1px solid #1e293b;
    }
    .footer a {
      color: #38bdf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="font-size: 40px; line-height: 1;">📻</div>
      <h1 class="brand-title">Christian Radios</h1>
      <p class="brand-tagline">Stream & Discover Gospel Radio Worldwide</p>
    </div>
    <div class="content">
      <h2 class="greeting">Welcome to the Platform, ${name}!</h2>
      <p class="lead-text">
        Thank you for joining Christian Radios as a <strong>${roleName}</strong>. To authenticate your registration and secure your account, please enter the 6-digit authentication code below in your browser:
      </p>

      <div class="code-box">
        <div class="code-label">Authentication Code</div>
        <div class="code-number">${code}</div>
        <div class="code-expiry">⏱️ Valid for 24 hours. Do not share this code with anyone.</div>
      </div>

      <div class="cta-container">
        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">Or authenticate instantly with one click:</p>
        <a href="${magicLink}" class="btn" target="_blank">Authenticate & Enter Platform</a>
      </div>

      <div class="divider"></div>

      <p class="security-note">
        🔒 <strong>Security Tip:</strong> Christian Radios will never ask for your password or payment PIN via email. If you did not create this account, you can safely disregard this email.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Christian Radios Network. Empowering Gospel Broadcasters & Listeners.<br>
      Dar es Salaam, Tanzania & Worldwide • <a href="${baseUrl}">christianradios.org</a>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Sends authentication email with code and 1-click verification link.
 */
export async function sendAuthVerificationEmail(payload: EmailPayload): Promise<{
  success: boolean;
  provider: 'SMTP' | 'RESEND' | 'SIMULATOR';
  messageId?: string;
}> {
  const { to, name, code, token, role } = payload;
  const settings = db.settings.get();

  const record: SentEmailRecord = {
    id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    to,
    subject: `Your Christian Radios Login Authentication Code: ${code}`,
    code,
    token,
    sentAt: new Date().toISOString(),
    provider: 'SIMULATOR',
  };

  // 1. Check for Resend API Key in env or settings
  const resendApiKey = process.env.RESEND_API_KEY || (settings as any).resendApiKey;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Christian Radios <auth@christianradios.org>',
          to: [to],
          subject: `Your Christian Radios Authentication Code: ${code}`,
          html: buildVerificationHtml(payload),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        record.provider = 'RESEND';
        sentEmailsStore.unshift(record);
        console.log(`[Email Service] Authentication email sent via Resend to ${to} (ID: ${json.id})`);
        return { success: true, provider: 'RESEND', messageId: json.id };
      }
    } catch (err) {
      console.warn('[Email Service] Resend dispatch error:', err);
    }
  }

  // 2. Default & Local/Launch Simulator Mode
  // Cleanly formatted for server terminal logs
  console.log('===============================================================');
  console.log(`📨 [AUTHENTICATION EMAIL DISPATCHED]`);
  console.log(`To:        ${name} <${to}>`);
  console.log(`Role:      ${role || 'LISTENER'}`);
  console.log(`Subject:   Your Christian Radios Login Authentication Code: ${code}`);
  console.log(`🔑 CODE:   ${code}`);
  console.log(`🔗 LINK:   http://localhost:3000/?verify_token=${token}&email=${encodeURIComponent(to)}`);
  console.log(`Sent At:   ${record.sentAt}`);
  console.log('===============================================================');

  sentEmailsStore.unshift(record);
  if (sentEmailsStore.length > 100) {
    sentEmailsStore.pop();
  }

  return { success: true, provider: 'SIMULATOR', messageId: record.id };
}
