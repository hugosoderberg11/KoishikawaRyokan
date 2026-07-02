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
| `GMAIL_USER` | 問い合わせ・購入確認メール送信用 Gmail アドレス |
| `GMAIL_APP_PASSWORD` | Google アカウント → アプリパスワード（2段階認証必須） |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → `checkout.session.completed` |

## 3. 動作
```
フォーム → /api/send-inquiry（Vercel）→ Supabase inquiries テーブル → Gmail SMTP 通知（koishikawavibecoding@gmail.com）

Stripe Checkout 完了
  → /api/stripe-webhook（checkout.session.completed）
  → Supabase orders テーブル
  → Gmail SMTP 購入確認メール（購入者 + koishikawavibecoding@gmail.com）
  → 商品別テンプレート: api/lib/purchase-email-templates.js
```

Stripe Checkout の `metadata.product_key` にテンプレート ID（例: `hoshino-standard`）を設定すると、商品ごとのメール内容に切り替わります。

Stripe Webhook エンドポイント URL（本番）: `https://<your-domain>/api/stripe-webhook`

ローカル Webhook テスト: `stripe listen --forward-to localhost:5173/api/stripe-webhook`

ローカルで API テスト: `npm run dev`（Vite + vite-plugin-api で `/api/send-inquiry` と `/api/stripe-webhook` を提供）

`.env` に `SUPABASE_SERVICE_ROLE_KEY` を設定してから開発サーバーを再起動すること。

Windows で `fetch failed` / SSL エラーが出る場合: `npm run dev` は `node --use-system-ca` 経由で起動する（package.json 設定済み）。

## 4. 通知先
`koishikawavibecoding@gmail.com`
