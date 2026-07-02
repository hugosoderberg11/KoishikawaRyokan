export const CONTACT_EMAIL = 'koishikawavibecoding@gmail.com';
export const RESEND_TEST_DEFAULT_TO = 'bando.eiji.1177@gmail.com';
export const RESEND_TEST_DEFAULT_FROM = 'KOISHIKAWA <onboarding@resend.dev>';

export function isResendTestMode() {
  const flag = process.env.RESEND_TEST_MODE;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  return true;
}

export function resolveMailConfig() {
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

export function logMailEnvDiagnostics(scope, mailConfig, extra = {}) {
  const secretKeys = new Set(['RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']);
  const trackedKeys = [
    'RESEND_API_KEY',
    'RESEND_FROM',
    'RESEND_TEST_MODE',
    'RESEND_TEST_FROM',
    'RESEND_TEST_TO',
    'RESEND_SEND_PURCHASE_EMAIL',
    'NOTIFY_EMAIL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  console.log(`[${scope}] ===== 環境変数診断 =====`);
  for (const key of trackedKeys) {
    const raw = process.env[key];
    if (secretKeys.has(key)) {
      console.log(
        `  ${key}: ${raw ? `SET (len=${raw.length}, prefix=${raw.slice(0, 8)}...)` : 'NOT SET'}`,
      );
      continue;
    }
    console.log(`  ${key}: ${raw ?? '(未設定)'}`);
  }

  console.log(`[${scope}] ===== 解決済みメール設定 =====`);
  console.log(`  RESEND_TEST_MODE (resolved): ${mailConfig.testMode}`);
  console.log(`  from       : ${mailConfig.from}`);
  console.log(`  fromSource : ${mailConfig.fromSource}`);
  console.log(`  to (admin) : ${JSON.stringify(mailConfig.to)}`);
  console.log(`  toSource   : ${mailConfig.toSource}`);
  for (const [key, value] of Object.entries(extra)) {
    console.log(`  ${key}: ${value}`);
  }
}
