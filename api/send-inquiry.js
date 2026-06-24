const CONTACT_EMAIL = 'koishikawavibecoding@gmail.com';

function getNotifyRecipients() {
  return [CONTACT_EMAIL];
}
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://vruxpxocefqxoxrwexhj.supabase.co';

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

async function sendEmail(data) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { ok: false, reason: 'RESEND_API_KEY not set' };

  const from = process.env.RESEND_FROM || 'KOISHIKAWA <onboarding@resend.dev>';
  const isPurchase =
    data.source === 'template_purchase' || data.inquiry_type.includes('購入');
  const subject = isPurchase
    ? `【テンプレート購入】${data.template_name || data.inquiry_type} — ${data.name}`
    : `【お問い合わせ】${data.inquiry_type} — ${data.name}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: getNotifyRecipients(),
      reply_to: data.email,
      subject,
      html: buildEmailHtml(data),
    }),
  });

  if (!res.ok) {
    return { ok: false, reason: await res.text() };
  }
  return { ok: true };
}

async function saveInquiry(data) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY が設定されていません');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
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

  if (!res.ok) {
    const err = await res.text();
    console.error('Supabase insert error:', err);
    throw new Error('保存に失敗しました');
  }
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

  const data = req.body;
  if (!data?.name?.trim() || !data?.email?.trim() || !data?.inquiry_type?.trim()) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }

  try {
    await saveInquiry(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || '保存に失敗しました' });
  }

  const emailResult = await sendEmail(data);

  return res.status(200).json({
    ok: true,
    email_sent: emailResult.ok,
    message: emailResult.ok
      ? 'お問い合わせを送信しました。担当者よりご連絡いたします。'
      : 'お問い合わせを受け付けました。担当者より順次ご連絡いたします。',
  });
}
