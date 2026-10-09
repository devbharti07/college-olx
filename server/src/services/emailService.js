import config from '../config/environment.js';

/**
 * Generate a professional HTML email template for college email verification.
 */
export const buildVerificationEmailHtml = ({ name, verificationUrl, expiresMinutes }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your College Email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .brand { font-size: 20px; font-weight: 700; color: #047857; margin-bottom: 24px; display: inline-block; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .button-container { text-align: center; margin: 28px 0; }
    .button { background-color: #059669; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; }
    .link-fallback { word-break: break-all; font-size: 12px; color: #64748b; background: #f1f5f9; padding: 12px; border-radius: 6px; }
    .notice { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">🎓 Campus Classifieds</div>
    <h1 class="title">Verify Your Institutional College Email</h1>
    <p class="text">Hi ${name || 'Student'},</p>
    <p class="text">
      Thank you for registering on <strong>Campus Classifieds</strong>. To ensure a trusted, student-only marketplace, please verify your institutional email address by clicking the button below.
    </p>
    <div class="button-container">
      <a href="${verificationUrl}" class="button" target="_blank" rel="noopener noreferrer">
        Verify My College Email
      </a>
    </div>
    <p class="text">
      This verification link is valid for <strong>${expiresMinutes || 15} minutes</strong>. If the button does not work, copy and paste this link into your browser:
    </p>
    <div class="link-fallback">${verificationUrl}</div>
    <div class="notice">
      Security reminder: If you did not create an account on Campus Classifieds, please disregard this email. Never share this link with anyone.
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Send institutional email verification message.
 * Supports Resend transactional email API with fallback to safe dev simulation.
 * @param {Object} options
 * @param {string} options.to - Recipient institutional email
 * @param {string} options.name - Student's full name
 * @param {string} options.verificationUrl - Generated verification link with raw token
 * @param {number} [options.expiresMinutes=15] - Expiration duration
 * @returns {Promise<{ sent: boolean, provider: string, id?: string }>}
 */
export const sendVerificationEmail = async ({ to, name, verificationUrl, expiresMinutes = 15 }) => {
  const subject = 'Verify Your College Email — Campus Classifieds';
  const html = buildVerificationEmailHtml({ name, verificationUrl, expiresMinutes });
  const text = `Hi ${name || 'Student'},\n\nPlease verify your Campus Classifieds account using this link (expires in ${expiresMinutes} mins):\n${verificationUrl}\n\nIf you did not sign up, please ignore this email.`;

  // 1. Development Mode / Missing API key simulation
  if (config.isTest || !config.email.apiKey || config.email.provider === 'development') {
    if (!config.isTest && config.env === 'development') {
      console.log('----------------------------------------------------');
      console.log('  [EMAIL DEV SIMULATOR] Transactional Dispatch');
      console.log('----------------------------------------------------');
      console.log(`  To          : ${to}`);
      console.log(`  Subject     : ${subject}`);
      console.log(`  Expires In  : ${expiresMinutes} minutes`);
      console.log(`  Verify URL  : ${verificationUrl}`);
      console.log('----------------------------------------------------');
    }
    return { sent: true, provider: 'development_simulator' };
  }

  // 2. Production Resend Transactional Delivery via native fetch
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.email.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.email.from,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[EMAIL ERROR] Resend dispatch failed (${response.status}):`, data);
      return { sent: false, provider: 'resend', error: data };
    }

    return { sent: true, provider: 'resend', id: data.id };
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to dispatch verification email:', error.message);
    return { sent: false, provider: 'resend', error: error.message };
  }
};

export default {
  buildVerificationEmailHtml,
  sendVerificationEmail,
};
