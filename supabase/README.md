# Supabase セットアップ（project: vruxpxocefqxoxrwexhj）

## 接続情報
- **URL:** https://vruxpxocefqxoxrwexhj.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/vruxpxocefqxoxrwexhj

## 1. データベース（SQL Editor）
`supabase/migrations/001_inquiries.sql` を実行（誤字 `14b8b011` 混入版を実行した場合は再実行）

`supabase/migrations/002_orders.sql` を実行（Stripe 決済完了 Webhook 用の orders テーブル）

## 2. Vercel 環境変数（必須）
| Key | 取得場所 |
|-----|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API → service_role |
| `SUPABASE_URL` | `https://vruxpxocefqxoxrwexhj.supabase.co` |
| `GMAIL_USER` | 問い合わせ通知用 Gmail アドレス |
| `GMAIL_APP_PASSWORD` | Google アカウント → アプリパスワード（2段階認証必須） |
| `RESEND_API_KEY` | https://resend.com（Stripe 購入確認メール等） |
| `RESEND_TEST_MODE` | `1` = テストモード（デフォルト）/ `0` = 本番 |
| `RESEND_TEST_TO` | テスト送信先（例: Resend 認証済み Gmail） |
| `RESEND_TEST_FROM` | `KOISHIKAWA <onboarding@resend.dev>` |
| `RESEND_FROM` | 本番モード時の送信元 |
| `NOTIFY_EMAIL` | 本番モード時の通知先 |
| `RESEND_SEND_PURCHASE_EMAIL` | `1` = 購入確認メール送信（DNS 認証後 + コードコメント解除） |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → `checkout.session.completed` |

## 3. 動作
```
フォーム → /api/send-inquiry（Vercel）→ Supabase inquiries テーブル → Gmail SMTP 通知（koishikawavibecoding@gmail.com）

Stripe Checkout 完了
  → /api/stripe-webhook（checkout.session.completed）
  → Supabase orders テーブル
  → 購入確認メール（Resend・現状は console.log dry-run）
```

Stripe Webhook エンドポイント URL（本番）: `https://<your-domain>/api/stripe-webhook`

ローカル Webhook テスト: `stripe listen --forward-to localhost:5173/api/stripe-webhook`

ローカルで API テスト: `npm run dev`（Vite + vite-plugin-api で `/api/send-inquiry` と `/api/stripe-webhook` を提供）

`.env` に `SUPABASE_SERVICE_ROLE_KEY` を設定してから開発サーバーを再起動すること。

Windows で `fetch failed` / SSL エラーが出る場合: `npm run dev` は `node --use-system-ca` 経由で起動する（package.json 設定済み）。

## 4. 通知先
`koishikawavibecoding@gmail.com`
