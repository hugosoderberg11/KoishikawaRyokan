const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://vruxpxocefqxoxrwexhj.supabase.co';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function saveSubscriber(email, templateName) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn('[newsletter-subscribe] SUPABASE_SERVICE_ROLE_KEY 未設定 — DB保存をスキップ');
    return { duplicate: false };
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      template_name: templateName || null,
      source: 'template',
    }),
  });

  if (res.status === 409) return { duplicate: true };

  if (!res.ok) {
    const errText = await res.text();
    // 一意制約違反（重複メール）
    if (errText.includes('unique') || errText.includes('duplicate')) return { duplicate: true };
    console.error('[newsletter-subscribe] Supabase insert エラー:', errText);
    throw new Error('登録に失敗しました');
  }

  console.log('[newsletter-subscribe] Supabase 保存成功');
  return { duplicate: false };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email        = req.body?.email?.trim();
  const templateName = req.body?.template_name?.trim();

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: '正しいメールアドレスを入力してください' });
  }

  try {
    const { duplicate } = await saveSubscriber(email, templateName);
    if (duplicate) {
      return res.status(200).json({
        ok: true,
        message: 'このメールアドレスはすでに登録済みです。',
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || '登録に失敗しました' });
  }

  return res.status(200).json({
    ok: true,
    message: 'ご登録ありがとうございます。最新情報をお届けします。',
  });
}
