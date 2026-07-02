import { resolveGmailConfig, sendViaGmail, INQUIRY_NOTIFY_EMAIL } from './gmail-smtp.js';
import {
  ADMIN_NOTIFY_EMAIL,
  PURCHASE_EMAIL_SUBJECT,
  buildAdminPurchaseEmailHtml,
  buildCustomerPurchaseEmailHtml,
  resolvePurchaseTemplate,
} from './purchase-email-templates.js';

function logPurchaseEnvDiagnostics(order, template) {
  const secretKeys = new Set(['GMAIL_APP_PASSWORD', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY']);
  const trackedKeys = [
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  console.log('[stripe-webhook] ===== 購入メール環境変数診断 =====');
  for (const key of trackedKeys) {
    const raw = process.env[key];
    if (secretKeys.has(key)) {
      console.log(
        `  ${key}: ${raw ? `SET (len=${raw.length}, prefix=${raw.slice(0, 4)}...)` : 'NOT SET'}`,
      );
      continue;
    }
    console.log(`  ${key}: ${raw ?? '(未設定)'}`);
  }

  const gmailConfig = resolveGmailConfig();
  console.log('[stripe-webhook] ===== 解決済み購入メール設定 =====');
  console.log(`  provider         : gmail`);
  console.log(`  from             : ${gmailConfig.from ?? '(GMAIL_USER 未設定)'}`);
  console.log(`  customer_to      : ${order.customer_email}`);
  console.log(`  admin_to         : ${ADMIN_NOTIFY_EMAIL}`);
  console.log(`  template_id      : ${template.id}`);
  console.log(`  customer_subject : ${PURCHASE_EMAIL_SUBJECT}`);
}

export async function sendPurchaseConfirmationEmail(order) {
  const template = resolvePurchaseTemplate(order);
  logPurchaseEnvDiagnostics(order, template);

  const gmailConfig = resolveGmailConfig();
  if (!gmailConfig.user || !gmailConfig.pass) {
    console.error('[stripe-webhook] GMAIL_USER / GMAIL_APP_PASSWORD が設定されていません');
    return { ok: false, reason: 'GMAIL credentials not set' };
  }

  const customerHtml = buildCustomerPurchaseEmailHtml(order, template);
  const adminHtml = buildAdminPurchaseEmailHtml(order, template);
  const adminSubject =
    typeof template.admin.subject === 'function'
      ? template.admin.subject(order)
      : template.admin.subject;

  try {
    const customerResult = await sendViaGmail({
      from: gmailConfig.from,
      to: order.customer_email,
      subject: PURCHASE_EMAIL_SUBJECT,
      html: customerHtml,
      replyTo: INQUIRY_NOTIFY_EMAIL,
      logScope: 'stripe-webhook',
    });

    const adminResult = await sendViaGmail({
      from: gmailConfig.from,
      to: ADMIN_NOTIFY_EMAIL,
      subject: adminSubject,
      html: adminHtml,
      replyTo: order.customer_email,
      logScope: 'stripe-webhook',
    });

    console.log('[stripe-webhook] 購入確認メール送信完了:', {
      customer_message_id: customerResult.id,
      admin_message_id: adminResult.id,
      template_id: template.id,
    });

    return {
      ok: true,
      provider: 'gmail',
      template_id: template.id,
      customer: customerResult,
      admin: adminResult,
    };
  } catch (err) {
    console.error('[stripe-webhook] Gmail SMTP 購入メール送信エラー:', err.message);
    return { ok: false, reason: err.message || 'Gmail SMTP send failed' };
  }
}
