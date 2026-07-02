import { Resend } from 'resend';
import { resolveGmailConfig, sendViaGmail } from './lib/gmail-smtp.js';

const CONTACT_EMAIL = 'koishikawavibecoding@gmail.com';
const RESEND_TEST_DEFAULT_TO = 'bando.eiji.1177@gmail.com';
const RESEND_TEST_DEFAULT_FROM = 'KOISHIKAWA <onboarding@resend.dev>';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://vruxpxocefqxoxrwexhj.supabase.co';

// --- Resend（Stripe 購入確認等で引き続き利用。問い合わせフォームでは未使用） ---

function isResendTestMode() {
  const flag = process.env.RESEND_TEST_MODE;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  return true;
}

function resolveMailConfig() {
  const testMode = isResendTestMode();

  if (testMode) {
    const from = process.env.RESEND_TEST_FROM || RESEND_TEST_DEFAULT_FROM;
    const to = [process.env.RESEND_TEST_TO || RESEND_TEST_DEFAULT_TO];
    return {
      testMode: true,
      from,
      to,
      fromSource: process.env.RESEND_TEST_FROM
        ? 'RESEND_TEST_FROM'
        : 'default (onboarding@resend.dev)',
      toSource: process.env.RESEND_TEST_TO
        ? 'RESEND_TEST_TO'
        : `default (${RESEND_TEST_DEFAULT_TO})`,
    };
  }

  const from = process.env.RESEND_FROM || RESEND_TEST_DEFAULT_FROM;
  const override = process.env.NOTIFY_EMAIL;
  const to = [override || CONTACT_EMAIL];
  return {
    testMode: false,
    from,
    to,
    fromSource: process.env.RESEND_FROM ? 'RESEND_FROM' : 'default (onboarding@resend.dev)',
    toSource: override ? 'NOTIFY_EMAIL' : `default (${CONTACT_EMAIL})`,
  };
}

function buildInquirySubject(data) {
  const isPurchase =
    data.source === 'template_purchase' || data.inquiry_type.includes('購入');
  return isPurchase
    ? `【テンプレート購入】${data.template_name || data.inquiry_type} — ${data.name}`
    : `【お問い合わせ】${data.inquiry_type} — ${data.name}`;
}

function buildEmailHtml(data) {
  const rows = [
    ['お名前', data.name],
    ['メール', data.email],
    ['電話', data.phone || '—'],
    ['施設名', data.facility || '—'],
    ['ご相談内容', data.inquiry_type],
    ['テンプレート', data.template_name || '—'],
    ['プラン', data.plan_name || '—'],
    ['メッセージ', (data.message || '—').replace(/\n/g, '<br>')],
    ['送信元', data.source || 'contact'],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;font-weight:600;width:140px">${label}</td><td style="padding:8px 12px;border:1px solid #ddd">${value}</td></tr>`,
    )
    .join('');

  return `<div style="font-family:sans-serif;max-width:600px"><h2 style="color:#1a3a2a">KOISHIKAWA お問い合わせ</h2><table style="border-collapse:collapse;width:100%">${tableRows}</table></div>`;
}

/** @deprecated 問い合わせフォームでは Gmail SMTP を使用。Resend は購入確認メール等で利用。 */
async function sendEmailViaResend(data, mailConfig) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('[send-inquiry] RESEND_API_KEY が設定されていません');
    return { ok: false, reason: 'RESEND_API_KEY not set' };
  }

  const resend = new Resend(resendKey);
  const subject = buildInquirySubject(data);

  console.log('[send-inquiry] Resend SDK 送信開始:', {
    testMode: mailConfig.testMode,
    from: mailConfig.from,
    to: mailConfig.to,
    subject,
    reply_to: data.email,
  });

  const { data: emailData, error } = await resend.emails.send({
    from: mailConfig.from,
    to: mailConfig.to,
    reply_to: data.email,
    subject,
    html: buildEmailHtml(data),
  });

  if (error) {
    console.error('[send-inquiry] Resend エラー詳細:');
    console.error('  error.name       :', error.name);
    console.error('  error.message    :', error.message);
    console.error('  error.statusCode :', error.statusCode);
    console.error('  error.response   :', JSON.stringify(error.response ?? null));
    console.error('  error (raw)      :', JSON.stringify(error));
    return { ok: false, reason: error.message || JSON.stringify(error) };
  }

  console.log('[send-inquiry] Resend 送信成功 — id:', emailData?.id);
  return { ok: true, id: emailData?.id, provider: 'resend' };
}

// --- 問い合わせフォーム: Gmail SMTP ---

function logEnvDiagnostics(gmailConfig, replyTo) {
  const secretKeys = new Set([
    'RESEND_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GMAIL_APP_PASSWORD',
  ]);
  const trackedKeys = [
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'RESEND_API_KEY',
    'RESEND_FROM',
    'RESEND_TEST_MODE',
    'RESEND_TEST_FROM',
    'RESEND_TEST_TO',
    'NOTIFY_EMAIL',
    'SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  console.log('[send-inquiry] ===== 環境変数診断 =====');
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

  console.log('[send-inquiry] ===== 解決済みメール設定（問い合わせ → Gmail SMTP） =====');
  console.log(`  provider   : gmail`);
  console.log(`  from       : ${gmailConfig.from ?? '(GMAIL_USER 未設定)'}`);
  console.log(`  fromSource : ${gmailConfig.userSource}`);
  console.log(`  to         : ${gmailConfig.to}`);
  console.log(`  toSource   : ${gmailConfig.toSource}`);
  console.log(`  reply_to   : ${replyTo}`);
  console.log(`  SUPABASE_URL (resolved): ${SUPABASE_URL}`);
}

async function sendInquiryEmailViaGmail(data) {
  const gmailConfig = resolveGmailConfig();
  const subject = buildInquirySubject(data);

  try {
    return await sendViaGmail({
      from: gmailConfig.from,
      to: gmailConfig.to,
      subject,
      html: buildEmailHtml(data),
      replyTo: data.email.trim(),
      logScope: 'send-inquiry',
    });
  } catch (err) {
    console.error('[send-inquiry] Gmail SMTP エラー:', err.message);
    return { ok: false, reason: err.message || 'Gmail SMTP send failed' };
  }
}

async function saveInquiry(data) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn('[send-inquiry] SUPABASE_SERVICE_ROLE_KEY 未設定 — DB保存をスキップ');
    return;
  }

  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        facility: data.facility?.trim() || null,
        inquiry_type: data.inquiry_type.trim(),
        message: data.message?.trim() || null,
        source: data.source || 'contact',
        template_name: data.template_name?.trim() || null,
        plan_name: data.plan_name?.trim() || null,
      }),
    });
  } catch (err) {
    console.error('[send-inquiry] Supabase 接続エラー:', err);
    throw new Error(
      'データベースへの接続に失敗しました。開発環境では npm run dev を再起動してください。',
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('[send-inquiry] Supabase insert エラー:', errText);
    throw new Error('保存に失敗しました');
  }

  console.log('[send-inquiry] Supabase 保存成功');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[send-inquiry] POST リクエスト受信');

  const data = req.body;
  if (!data?.name?.trim() || !data?.email?.trim() || !data?.inquiry_type?.trim()) {
    console.warn('[send-inquiry] バリデーション失敗:', {
      name: !!data?.name,
      email: !!data?.email,
      inquiry_type: !!data?.inquiry_type,
    });
    return res.status(400).json({ error: '必須項目が不足しています' });
  }

  console.log('[send-inquiry] ペイロード:', {
    name: data.name,
    email: data.email,
    inquiry_type: data.inquiry_type,
    source: data.source,
  });

  const gmailConfig = resolveGmailConfig();
  logEnvDiagnostics(gmailConfig, data.email.trim());

  try {
    await saveInquiry(data);
  } catch (err) {
    console.error('[send-inquiry] saveInquiry 失敗:', err.message);
    return res.status(500).json({ error: err.message || '保存に失敗しました' });
  }

  const emailResult = await sendInquiryEmailViaGmail(data);

  if (!emailResult.ok) {
    console.error('[send-inquiry] メール送信失敗:', emailResult.reason);
  }

  return res.status(200).json({
    ok: true,
    email_sent: emailResult.ok,
    email_provider: 'gmail',
    ...(emailResult.ok ? {} : { email_error: emailResult.reason }),
    message: emailResult.ok
      ? 'お問い合わせを送信しました。担当者よりご連絡いたします。'
      : 'お問い合わせを受け付けました。担当者より順次ご連絡いたします。',
  });
}
