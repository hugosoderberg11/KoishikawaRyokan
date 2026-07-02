export const PURCHASE_EMAIL_SUBJECT = '【KOISHIKAWA】ご購入ありがとうございます';
export const ADMIN_NOTIFY_EMAIL = 'koishikawavibecoding@gmail.com';
export const SITE_URL = 'https://koishikawa-web.com';

function includesAny(text, needles) {
  const haystack = (text || '').toLowerCase();
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}

function matchProductKey(order, keys) {
  const productKey = order.product_key || order.metadata?.product_key || order.metadata?.template_key;
  if (!productKey) return false;
  return keys.includes(productKey);
}

function matchProductName(order, needles) {
  return includesAny(order.product_name, needles);
}

/** 購入者メールの共通テンプレート（商品別は customer 内の各項目を上書き） */
export const DEFAULT_CUSTOMER_BODY = {
  greeting: (order) => `${order.customer_name?.trim() || 'お客'}様`,
  opening: 'この度はKOISHIKAWAをご利用いただきありがとうございます。',
  confirmation: 'ご購入内容を確認いたしました。',
  followUp: '内容を確認後、順次対応させていただきます。',
  closing: 'ご不明な点がございましたら本メールへご返信ください。',
  signOff: '今後ともよろしくお願いいたします。',
  brand: 'KOISHIKAWA',
  siteUrl: SITE_URL,
};

export const DEFAULT_PURCHASE_TEMPLATE = {
  id: 'default',
  match: () => true,
  customer: DEFAULT_CUSTOMER_BODY,
  admin: {
    subject: (order) => `【KOISHIKAWA】新規購入通知 — ${order.product_name}`,
    intro: 'Stripe 決済により新規購入がありました。',
    note: '購入者への自動返信メールは送信済みです。',
  },
};

/**
 * 商品ごとのメール差分。match で注文を判定し、customer の文言のみ上書き可能。
 * Stripe Checkout の metadata.product_key に id を設定すると確実に一致します。
 */
export const PRODUCT_PURCHASE_TEMPLATES = [
  {
    id: 'hoshino-standard',
    match: (order) =>
      matchProductKey(order, ['hoshino-standard']) ||
      matchProductName(order, ['湯宿スタンダード', '星野庵', 'hoshino']),
    customer: {
      followUp:
        '湯宿スタンダードテンプレートの内容を確認後、納品方法について順次ご案内いたします。',
    },
  },
  {
    id: 'pet-friendly-ryokan',
    match: (order) =>
      matchProductKey(order, ['pet-friendly-ryokan']) ||
      matchProductName(order, ['ペット同伴', 'わんにゃん']),
    customer: {
      followUp:
        'ペット同伴温泉旅館テンプレートの内容を確認後、納品方法について順次ご案内いたします。',
    },
  },
  {
    id: 'luxury-glamping',
    match: (order) =>
      matchProductKey(order, ['luxury-glamping']) ||
      matchProductName(order, ['グランピング', 'glamping']),
    customer: {
      followUp:
        'ラグジュアリーグランピングテンプレートの内容を確認後、納品方法について順次ご案内いたします。',
    },
  },
  {
    id: 'ocean-view-onsen',
    match: (order) =>
      matchProductKey(order, ['ocean-view-onsen']) ||
      matchProductName(order, ['オーシャンビュー', 'ocean']),
    customer: {
      followUp:
        'オーシャンビュー温泉旅館テンプレートの内容を確認後、納品方法について順次ご案内いたします。',
    },
  },
  {
    id: 'traditional-kominka',
    match: (order) =>
      matchProductKey(order, ['traditional-kominka']) ||
      matchProductName(order, ['古民家宿', '紬の郷', 'kominka']),
    customer: {
      followUp:
        '古民家宿テンプレートの内容を確認後、納品方法について順次ご案内いたします。',
    },
  },
  {
    id: 'urban-boutique-hotel',
    match: (order) =>
      matchProductKey(order, ['urban-boutique-hotel']) ||
      matchProductName(order, ['都市型ブティック', 'boutique']),
    customer: {
      followUp:
        '都市型ブティックホテルテンプレートの内容を確認後、納品方法について順次ご案内いたします。',
    },
  },
  {
    id: 'ski-mountain-resort',
    match: (order) =>
      matchProductKey(order, ['ski-mountain-resort']) ||
      matchProductName(order, ['スキーリゾート', '山岳ロッジ', 'ski']),
    customer: {
      followUp:
        'スキーリゾート・山岳ロッジテンプレートの内容を確認後、納品方法について順次ご案内いたします。',
    },
  },
];

export function resolvePurchaseTemplate(order) {
  const matched = PRODUCT_PURCHASE_TEMPLATES.find((template) => template.match(order));
  if (!matched) return DEFAULT_PURCHASE_TEMPLATE;

  return {
    id: matched.id,
    customer: { ...DEFAULT_CUSTOMER_BODY, ...matched.customer },
    admin: { ...DEFAULT_PURCHASE_TEMPLATE.admin, ...matched.admin },
  };
}

function resolveCustomerField(field, order) {
  return typeof field === 'function' ? field(order) : field;
}

function formatAmountYen(order) {
  if (order.amount_total == null) return '—';
  return Number(order.amount_total).toLocaleString('ja-JP');
}

function paragraph(text) {
  return `<p style="margin:0 0 16px;line-height:1.8">${text}</p>`;
}

function renderOrderTable(order, extraRows = []) {
  const rows = [
    ['商品名', order.product_name],
    ['金額', `${formatAmountYen(order)}円`],
    ['注文ID', order.stripe_session_id],
    ['お名前', order.customer_name || '—'],
    ['メール', order.customer_email],
    ...extraRows,
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;font-weight:600;width:140px">${label}</td><td style="padding:8px 12px;border:1px solid #ddd">${value}</td></tr>`,
    )
    .join('');

  return `<table style="border-collapse:collapse;width:100%;margin-top:16px">${tableRows}</table>`;
}

/**
 * 購入者向けメール本文
 *
 * ○○様
 * この度はKOISHIKAWAをご利用いただきありがとうございます。
 * ご購入内容を確認いたしました。
 * 商品名：{{product_name}}
 * 金額：{{amount}}円
 * ...
 */
export function buildCustomerPurchaseEmailHtml(order, template) {
  const customer = template.customer;

  if (typeof customer.render === 'function') {
    return customer.render(order, template);
  }

  const greeting = resolveCustomerField(customer.greeting, order);
  const opening = resolveCustomerField(customer.opening, order);
  const confirmation = resolveCustomerField(customer.confirmation, order);
  const followUp = resolveCustomerField(customer.followUp, order);
  const closing = resolveCustomerField(customer.closing, order);
  const signOff = resolveCustomerField(customer.signOff, order);
  const brand = resolveCustomerField(customer.brand, order);
  const siteUrl = resolveCustomerField(customer.siteUrl, order);
  const extraNote = customer.extraNote ? resolveCustomerField(customer.extraNote, order) : null;

  const productName = order.product_name || '—';
  const amount = formatAmountYen(order);

  return `
    <div style="font-family:sans-serif;max-width:600px;color:#222;line-height:1.8">
      ${paragraph(greeting)}
      ${paragraph(opening)}
      ${paragraph(confirmation)}
      ${paragraph(`商品名：<br>${productName}`)}
      ${paragraph(`金額：<br>${amount}円`)}
      ${extraNote ? paragraph(extraNote) : ''}
      ${paragraph(followUp)}
      ${paragraph(closing)}
      ${paragraph(signOff)}
      ${paragraph(`${brand}<br><a href="${siteUrl}" style="color:#1a3a2a">${siteUrl}</a>`)}
    </div>`;
}

export function buildAdminPurchaseEmailHtml(order, template) {
  const admin = template.admin;

  return `
    <div style="font-family:sans-serif;max-width:600px;color:#222">
      <h2 style="color:#1a3a2a;margin:0 0 16px">新規購入通知</h2>
      <p style="margin:0 0 12px;line-height:1.7">${admin.intro}</p>
      <p style="margin:0 0 12px;line-height:1.7">${admin.note}</p>
      ${renderOrderTable(order, [['テンプレートID', template.id]])}
    </div>`;
}
