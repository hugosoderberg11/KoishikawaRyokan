-- Stripe Checkout 完了時の注文
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  customer_email text not null,
  customer_name text,
  product_name text not null,
  amount_total integer,
  currency text not null default 'jpy',
  status text not null default 'paid',
  metadata jsonb
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_customer_email_idx on public.orders (customer_email);

alter table public.orders enable row level security;

-- service role（API / Webhook）からのみ書き込み
