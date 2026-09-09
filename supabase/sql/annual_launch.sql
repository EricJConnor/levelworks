-- ============================================================================
-- LevelWorks: $49 annual launch
-- Paste this whole file into Supabase → SQL Editor → Run. Safe to run twice.
-- ============================================================================

-- 1. Plan columns on profiles -------------------------------------------------
alter table public.profiles
  add column if not exists plan text,                       -- 'annual' | null (null = trial / monthly, handled by Stripe subscription)
  add column if not exists plan_expires_at timestamptz,
  add column if not exists plan_source text,                -- 'annual_49_launch'
  add column if not exists lang text,                       -- 'en' | 'es', the language they bought in
  add column if not exists activated_at timestamptz,        -- first estimate created (the number Eric watches)
  add column if not exists expiring_flagged_at timestamptz, -- set by the daily cron 14 days before plan_expires_at
  add column if not exists nudge_stage int not null default 0; -- 0 none, 1 day-1 sent, 3 day-3 sent, 7 day-7 sent, 30 day-30 sent

create index if not exists profiles_plan_expires_idx on public.profiles (plan, plan_expires_at);

-- 2. Every annual purchase, one row each. Counter = rows with refunded_at null.
create table if not exists public.annual_purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  amount integer not null default 4900,       -- cents
  currency text not null default 'usd',
  lang text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists annual_purchases_pi_idx on public.annual_purchases (stripe_payment_intent);
alter table public.annual_purchases enable row level security;
-- No policies on purpose: only the server (service key) reads or writes this table.

-- 3. Stripe webhook idempotency: one row per event id we have processed.
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  created_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- 4. The live counter the landing page shows. Real purchases only, refunds excluded.
create or replace function public.annual_claimed_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.annual_purchases where refunded_at is null;
$$;
grant execute on function public.annual_claimed_count() to anon, authenticated, service_role;

-- 5. activated_at: stamped the first time a user creates an estimate.
create or replace function public.stamp_activated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set activated_at = coalesce(activated_at, now())
   where user_id = new.user_id;
  return new;
end;
$$;
drop trigger if exists estimates_stamp_activated on public.estimates;
create trigger estimates_stamp_activated
  after insert on public.estimates
  for each row execute function public.stamp_activated_at();

-- Backfill for people who already have estimates.
update public.profiles p
   set activated_at = e.first_at
  from (select user_id, min(created_at) as first_at from public.estimates group by user_id) e
 where p.user_id = e.user_id and p.activated_at is null;

-- 6. Quick check (should return 0 until the first purchase):
select public.annual_claimed_count() as annual_claimed;
