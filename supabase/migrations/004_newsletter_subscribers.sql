-- メルマガ登録者
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  template_name text,
  source text not null default 'template',
  is_active boolean not null default true,
  constraint newsletter_subscribers_email_template_key unique (email, template_name)
);

create index if not exists newsletter_subscribers_email_idx
  on public.newsletter_subscribers (email);

alter table public.newsletter_subscribers enable row level security;
