import nodemailer from 'nodemailer';

export const INQUIRY_NOTIFY_EMAIL = 'koishikawavibecoding@gmail.com';

export function resolveGmailConfig() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  return {
    user,
    pass,
    from: user ? `KOISHIKAWA <${user}>` : null,
    to: INQUIRY_NOTIFY_EMAIL,
    userSource: user ? 'GMAIL_USER' : '(未設定)',
    toSource: `default (${INQUIRY_NOTIFY_EMAIL})`,
  };
}

export function createGmailTransport() {
  const { user, pass } = resolveGmailConfig();
  if (!user || !pass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD が設定されていません');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendViaGmail({ to, subject, html, replyTo, from }) {
  const transport = createGmailTransport();
  const gmailConfig = resolveGmailConfig();

  const mailOptions = {
    from: from || gmailConfig.from,
    to,
    subject,
    html,
    replyTo: replyTo || undefined,
  };

  console.log('[send-inquiry] Gmail SMTP 送信開始:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
    replyTo: mailOptions.replyTo,
  });

  const info = await transport.sendMail(mailOptions);
  console.log('[send-inquiry] Gmail SMTP 送信成功 — messageId:', info.messageId);
  return { ok: true, id: info.messageId };
}
