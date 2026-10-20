create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions add column if not exists latitude double precision;
alter table public.push_subscriptions add column if not exists longitude double precision;

create table if not exists public.push_notification_dispatches (
  dedupe_key text not null,
  notification_status text not null check (notification_status in ('active', 'resolved')),
  created_at timestamptz not null default now(),
  primary key (dedupe_key, notification_status)
);

alter table public.push_subscriptions enable row level security;
alter table public.push_notification_dispatches enable row level security;

revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.push_notification_dispatches from anon, authenticated;
grant all on public.push_subscriptions to service_role;
grant all on public.push_notification_dispatches to service_role;
