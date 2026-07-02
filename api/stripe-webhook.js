import Stripe from 'stripe';
import { sendPurchaseConfirmationEmail } from './lib/purchase-email.js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://vruxpxocefqxoxrwexhj.supabase.co';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY が設定されていません');
  }
  return new Stripe(secretKey);
}

function getCustomerEmail(session) {
  return (
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.customer_email ||
    null
  );
}

function getCustomerName(session) {
  return (
    session.customer_details?.name ||
    session.metadata?.customer_name ||
    null
  );
}

function getProductKey(session) {
  const metadataKey =
    session.metadata?.product_key ||
    session.metadata?.template_key ||
    session.metadata?.product_id;

  if (metadataKey?.trim()) {
    return metadataKey.trim();
  }

  const lineItems = session.line_items?.data || [];
  const product = lineItems[0]?.price?.product;
  if (typeof product === 'object' && product?.id) {
    return product.id;
  }
  if (typeof product === 'string') {
    return product;
  }

  return null;
}

function getProductName(session) {
  const metadataName =
    session.metadata?.product_name ||
    session.metadata?.template_name ||
    session.metadata?.plan_name;

  if (metadataName?.trim()) {
    return metadataName.trim();
  }

  const lineItems = session.line_items?.data || [];
  if (lineItems.length === 0) {
    return 'KOISHIKAWA テンプレート';
  }

  return lineItems
    .map((item) => {
      const product = item.price?.product;
      if (typeof product === 'object' && product?.name) {
        return product.name;
      }
      return item.description || item.price?.nickname || '商品';
    })
    .join(', ');
}

async function orderExists(stripeSessionId) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return false;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?stripe_session_id=eq.${encodeURIComponent(stripeSessionId)}&select=id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('[stripe-webhook] 注文重複チェック失敗:', err);
    return false;
  }

  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}

async function saveOrder(order) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY が設定されていません');
  }

  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(order),
    });
  } catch (err) {
    console.error('[stripe-webhook] Supabase 接続エラー:', err);
    throw new Error('データベースへの接続に失敗しました');
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('[stripe-webhook] Supabase insert エラー:', errText);
    throw new Error('注文の保存に失敗しました');
  }

  const rows = await res.json();
  console.log('[stripe-webhook] Supabase 注文保存成功:', rows[0]?.id);
  return rows[0];
}

async function readRawBodyFromRequest(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleCheckoutSessionCompleted(session) {
  console.log('[stripe-webhook] checkout.session.completed 処理開始:', session.id);

  if (await orderExists(session.id)) {
    console.log('[stripe-webhook] 既存注文のためスキップ:', session.id);
    return { skipped: true, reason: 'already_processed' };
  }

  const stripe = getStripeClient();
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price.product'],
  });

  const customerEmail = getCustomerEmail(fullSession);
  if (!customerEmail) {
    throw new Error('顧客メールアドレスを取得できませんでした');
  }

  const productName = getProductName(fullSession);
  const productKey = getProductKey(fullSession);
  const customerName = getCustomerName(fullSession);

  console.log('[stripe-webhook] 取得データ:', {
    stripe_session_id: fullSession.id,
    customer_email: customerEmail,
    customer_name: customerName,
    product_name: productName,
    product_key: productKey,
    amount_total: fullSession.amount_total,
    currency: fullSession.currency,
  });

  const orderRecord = {
    stripe_session_id: fullSession.id,
    stripe_payment_intent_id:
      typeof fullSession.payment_intent === 'string'
        ? fullSession.payment_intent
        : fullSession.payment_intent?.id || null,
    stripe_customer_id:
      typeof fullSession.customer === 'string'
        ? fullSession.customer
        : fullSession.customer?.id || null,
    customer_email: customerEmail,
    customer_name: customerName,
    product_name: productName,
    product_key: productKey,
    amount_total: fullSession.amount_total ?? null,
    currency: fullSession.currency || 'jpy',
    status: fullSession.payment_status === 'paid' ? 'paid' : fullSession.status || 'paid',
    metadata: fullSession.metadata || null,
  };

  const savedOrder = await saveOrder(orderRecord);
  const emailResult = await sendPurchaseConfirmationEmail({
    ...orderRecord,
    id: savedOrder?.id,
  });

  if (!emailResult.ok) {
    console.error('[stripe-webhook] 購入メール送信失敗（注文は保存済み）:', emailResult.reason);
  }

  return {
    order_id: savedOrder?.id,
    customer_email: customerEmail,
    product_name: productName,
    email: emailResult,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET が設定されていません');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    const stripe = getStripeClient();
    const rawBody = await readRawBodyFromRequest(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] 署名検証失敗:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log('[stripe-webhook] イベント受信:', event.type, event.id);

  try {
    if (event.type === 'checkout.session.completed') {
      const result = await handleCheckoutSessionCompleted(event.data.object);
      return res.status(200).json({ received: true, ...result });
    }

    console.log('[stripe-webhook] 未処理イベント（200 で ACK）:', event.type);
    return res.status(200).json({ received: true, ignored: event.type });
  } catch (err) {
    console.error('[stripe-webhook] 処理エラー:', err);
    return res.status(500).json({ error: err.message || 'Webhook handler failed' });
  }
}
