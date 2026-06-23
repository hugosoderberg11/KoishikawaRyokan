import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const CONTACT_EMAIL = 'koishikawa.vibecoding@gmail.com';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InquiryPayload {
  name: string;
  email: string;
  phone?: string;
  facility?: string;
  inquiry_type: string;
  message?: string;
  source?: string;
  template_name?: string;
  plan_name?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function buildEmailHtml(data: InquiryPayload) {
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

  return `
    <div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#1a3a2a">KOISHIKAWA お問い合わせ</h2>
      <table style="border-collapse:collapse;width:100%">${tableRows}</table>
    </div>`;
}

async function sendEmail(data: InquiryPayload) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) return { ok: false, reason: 'RESEND_API_KEY not set' };

  const from = Deno.env.get('RESEND_FROM') || 'KOISHIKAWA <onboarding@resend.dev>';
  const isPurchase = data.source === 'template_purchase' || data.inquiry_type.includes('購入');
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
      to: [CONTACT_EMAIL],
      reply_to: data.email,
      subject,
      html: buildEmailHtml(data),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, reason: err };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let data: InquiryPayload;
  try {
    data = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!data.name?.trim() || !data.email?.trim() || !data.inquiry_type?.trim()) {
    return jsonResponse({ error: '必須項目が不足しています' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error: dbError } = await supabase.from('inquiries').insert({
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || null,
    facility: data.facility?.trim() || null,
    inquiry_type: data.inquiry_type.trim(),
    message: data.message?.trim() || null,
    source: data.source || 'contact',
    template_name: data.template_name?.trim() || null,
    plan_name: data.plan_name?.trim() || null,
  });

  if (dbError) {
    console.error('DB insert error:', dbError);
    return jsonResponse({ error: '保存に失敗しました' }, 500);
  }

  const emailResult = await sendEmail(data);

  return jsonResponse({
    ok: true,
    email_sent: emailResult.ok,
    message: emailResult.ok
      ? 'お問い合わせを送信しました。担当者よりご連絡いたします。'
      : 'お問い合わせを受け付けました。メール通知の設定を確認中のため、返信まで少々お待ちください。',
  });
});
