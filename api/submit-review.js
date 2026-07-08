const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://vruxpxocefqxoxrwexhj.supabase.co';

async function saveReview(data) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn('[submit-review] SUPABASE_SERVICE_ROLE_KEY 未設定 — DB保存をスキップ');
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      template_name: (data.template_name || 'unknown').trim(),
      nickname: data.nickname.trim(),
      stay_type: data.stay_type?.trim() || null,
      rating: Number(data.rating),
      comment: data.comment.trim(),
      is_approved: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[submit-review] Supabase insert エラー:', errText);
    throw new Error('保存に失敗しました');
  }

  console.log('[submit-review] Supabase 保存成功');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body;

  const nickname = data?.nickname?.trim();
  const comment  = data?.comment?.trim();
  const rating   = Number(data?.rating);

  if (!nickname || !comment || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '必須項目（ニックネーム・評価・コメント）を入力してください' });
  }
  if (comment.length > 1000) {
    return res.status(400).json({ error: 'コメントは1000文字以内でご入力ください' });
  }

  try {
    await saveReview(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || '保存に失敗しました' });
  }

  return res.status(200).json({
    ok: true,
    message: '口コミをお送りいただきありがとうございます。確認後、掲載させていただきます。',
  });
}
