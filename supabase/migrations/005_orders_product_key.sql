-- orders テーブルに product_key カラムを追加
-- stripe-webhook.js が product_key を保存しているが 002_orders.sql に定義がなかった
alter table public.orders add column if not exists product_key text;
create index if not exists orders_product_key_idx on public.orders (product_key);
