-- お客様の口コミ投稿（モデレーション承認後に掲載）
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  template_name text not null,
  nickname text not null,
  stay_type text,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  is_approved boolean not null default false
);

create index if not exists reviews_template_approved_idx
  on public.reviews (template_name, is_approved, created_at desc);

alter table public.reviews enable row level security;

-- service role からのみ書き込み・読み取り可能
