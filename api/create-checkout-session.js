import Stripe from 'stripe';

const SITE_URL =
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  'https://koishikawa-web.com';

const PLANS = {
  'template-only': {
    name: 'テンプレのみ',
    amount: 9800,
    description: 'テンプレートファイルの提供。ご自身で差し替え・公開。',
    plan_key: 'template-only',
  },
  'replace-and-publish': {
    name: '差し替え＋公開',
    amount: 19800,
    description: '写真・文章の差し替えと公開作業まで代行。',
    plan_key: 'replace-and-publish',
  },
  'full-custom': {
    name: 'フルカスタム',
    amount: 49800,
    description: 'テンプレをベースにデザイン・構成をカスタマイズ。',
    plan_key: 'full-custom',
  },
};

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY が設定されていません');
  return new Stripe(secretKey);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { template_key, template_name, plan_key } = req.body || {};

  if (!template_key || !template_name || !plan_key) {
    return res.status(400).json({ error: 'template_key, template_name, plan_key は必須です' });
  }

  const plan = PLANS[plan_key];
  if (!plan) {
    return res.status(400).json({ error: `不明なプランです: ${plan_key}` });
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (err) {
    console.error('[create-checkout-session] Stripe 初期化エラー:', err.message);
    return res.status(500).json({ error: err.message });
  }

  const productName = `${template_name} — ${plan.name}`;

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: productName,
              description: plan.description,
            },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        product_key: template_key,
        template_key,
        product_name: productName,
        template_name,
        plan_key,
      },
      customer_creation: 'always',
      billing_address_collection: 'auto',
      success_url: `${SITE_URL}/templates/?purchase=success&template=${encodeURIComponent(template_name)}`,
      cancel_url: `${SITE_URL}/templates/?purchase=cancel`,
    });
  } catch (err) {
    console.error('[create-checkout-session] Stripe セッション作成エラー:', err.message);
    return res.status(500).json({ error: err.message || 'Stripe セッション作成に失敗しました' });
  }

  console.log('[create-checkout-session] セッション作成成功:', session.id, productName);
  return res.status(200).json({ url: session.url });
}
