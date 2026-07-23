import { resolveGmailConfig, sendViaGmail, INQUIRY_NOTIFY_EMAIL } from './lib/gmail-smtp.js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://vruxpxocefqxoxrwexhj.supabase.co';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_THRESHOLD = 0.5;

async function verifyRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.log('[send-inquiry] RECAPTCHA_SECRET_KEY 未設定 — reCAPTCHA 検証をスキップ');
    return true;
  }
  if (!token) {
    console.warn('[send-inquiry] reCAPTCHA トークンなし — 拒否');
    return false;
  }
  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });
    const json = await res.json();
    console.log('[send-inquiry] reCAPTCHA 結果:', { success: json.success, score: json.score });
    return json.success && (json.score ?? 1) >= RECAPTCHA_THRESHOLD;
  } catch (err) {
    console.error('[send-inquiry] reCAPTCHA 検証エラー:', err.message);
    return true; // 検証エラー時は通過させる（ユーザー体験優先）
  }
}

function buildAutoReplyHtml(data) {
  const isPurchase = data.source === 'template_purchase' || data.inquiry_type?.includes('購入');
  const templateLine = data.template_name ? `<br />ご希望テンプレート：${data.template_name}` : '';
  const planLine = data.plan_name ? `<br />ご希望プラン：${data.plan_name}` : '';

  return `
    <div style="font-family:sans-serif;max-width:600px;color:#222;line-height:1.8">
      <p style="margin:0 0 16px">${data.name?.trim() || 'お客'}様</p>
      <p style="margin:0 0 16px">この度はKOISHIKAWAへのお問い合わせありがとうございます。<br />
      以下の内容でお問い合わせを受け付けました。</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
        <tr>
          <td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;font-weight:600;width:130px">ご相談内容</td>
          <td style="padding:8px 12px;border:1px solid #ddd">${data.inquiry_type || '—'}${templateLine}${planLine}</td>
        </tr>
      </table>
      <p style="margin:0 0 16px">${isPurchase
        ? 'テンプレートのご購入について、担当者より<strong>2営業日以内</strong>にご連絡いたします。'
        : '内容を確認のうえ、担当者より<strong>2営業日以内</strong>にご連絡いたします。'
      }</p>
      <p style="margin:0 0 16px">お急ぎの場合は下記までお電話ください。<br />
      TEL：<a href="tel:0367091795" style="color:#1a3a2a">03-6709-1795</a>（平日10:00〜18:00）</p>
      <p style="margin:0 0 8px">KOISHIKAWA</p>
      <p style="margin:0;font-size:13px;color:#888"><a href="https://koishikawa-web.com" style="color:#1a3a2a">https://koishikawa-web.com</a></p>
    </div>`;
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

// --- 問い合わせフォーム: Gmail SMTP ---

function logEnvDiagnostics(gmailConfig, replyTo) {
  const secretKeys = new Set([
    'SUPABASE_SERVICE_ROLE_KEY',
    'GMAIL_APP_PASSWORD',
  ]);
  const trackedKeys = [
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
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

  // reCAPTCHA 検証（SECRET_KEY 未設定時はスキップ）
  const recaptchaOk = await verifyRecaptcha(data.recaptcha_token);
  if (!recaptchaOk) {
    return res.status(400).json({ error: 'スパム検出により送信をブロックしました。ページを再読み込みして再度お試しください。' });
  }

  const gmailConfig = resolveGmailConfig();
  logEnvDiagnostics(gmailConfig, data.email.trim());

  try {
    await saveInquiry(data);
  } catch (err) {
    console.error('[send-inquiry] saveInquiry 失敗:', err.message);
    return res.status(500).json({ error: err.message || '保存に失敗しました' });
  }

  // 管理者通知メール
  const adminResult = await sendInquiryEmailViaGmail(data);
  if (!adminResult.ok) {
    console.error('[send-inquiry] 管理者メール送信失敗:', adminResult.reason);
  }

  // 自動返信メール（失敗しても全体は成功扱い）
  try {
    await sendViaGmail({
      from: gmailConfig.from,
      to: data.email.trim(),
      subject: '【KOISHIKAWA】お問い合わせを受け付けました',
      html: buildAutoReplyHtml(data),
      replyTo: INQUIRY_NOTIFY_EMAIL,
      logScope: 'send-inquiry-autoreply',
    });
  } catch (err) {
    console.error('[send-inquiry] 自動返信メール送信失敗:', err.message);
  }

  return res.status(200).json({
    ok: true,
    email_sent: adminResult.ok,
    email_provider: 'gmail',
    ...(adminResult.ok ? {} : { email_error: adminResult.reason }),
    message: adminResult.ok
      ? 'お問い合わせを送信しました。担当者よりご連絡いたします。'
      : 'お問い合わせを受け付けました。担当者より順次ご連絡いたします。',
  });
}
