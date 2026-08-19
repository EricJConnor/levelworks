-- Support tables/view for the send-trial-reminders edge function.
--
-- IMPORTANT: this assumes your paid-subscription state lives in a table called
-- `public.subscriptions` with a `user_id` and a `status` column (values like
-- 'active' / 'trialing' / 'past_due' / 'canceled'). That table wasn't visible
-- from the app's frontend code, so if your actual table/column names differ,
-- edit the view definition below to match before running this migration.

-- Tracks which trial-reminder milestones (days_left) have already been emailed
-- to which user, so the daily cron doesn't send duplicates.
create table if not exists public.trial_reminders_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  days_left integer not null,
  sent_at timestamptz not null default now(),
  unique (user_id, days_left)
);

alter table public.trial_reminders_sent enable row level security;

-- Only the service role (used by the edge function) needs access to this table.
create policy "service role manages trial reminders"
  on public.trial_reminders_sent
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- View computing days-left-in-trial for users who are not currently on a paid plan.
-- Trial start = auth.users.created_at, trial length = 14 days (matches the app).
create or replace view public.users_view_for_trial_reminders as
select
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'full_name' as full_name,
  u.created_at,
  (14 - extract(day from (now() - u.created_at)))::int as days_left
from auth.users u
where not exists (
  select 1
  from public.subscriptions s
  where s.user_id = u.id
    and s.status in ('active', 'trialing', 'past_due')
)
and u.created_at > now() - interval '15 days';
