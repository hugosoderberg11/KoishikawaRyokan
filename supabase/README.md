# Supabase セットアップ（project: vruxpxocefqxoxrwexhj）

## 接続情報
- **URL:** https://vruxpxocefqxoxrwexhj.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/vruxpxocefqxoxrwexhj

## 1. データベース（SQL Editor）
`supabase/migrations/001_inquiries.sql` を実行（誤字 `14b8b011` 混入版を実行した場合は再実行）

## 2. Vercel 環境変数（必須）
| Key | 取得場所 |
|-----|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API → service_role |
| `SUPABASE_URL` | `https://vruxpxocefqxoxrwexhj.supabase.co` |
| `RESEND_API_KEY` | https://resend.com（メール通知・任意） |
| `RESEND_FROM` | `KOISHIKAWA <onboarding@resend.dev>` |

## 3. 動作
```
フォーム → /api/send-inquiry（Vercel）→ Supabase inquiries テーブル → Gmail 通知
```

ローカルで API テスト: `npm run dev:api`

## 4. 通知先
`koishikawa.vibecoding@gmail.com`
