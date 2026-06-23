-- お問い合わせ・テンプレート購入リクエスト
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  facility text,
  inquiry_type text not null,
  message text,
  source text not null default 'contact',
  template_name text,
  plan_name text
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

-- Edge Function（service role）からのみ書き込み。クライアントからの直接 insert は不可。
