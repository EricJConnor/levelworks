# Trial reminder emails — what's here and what's left

This folder was added to close a real gap: LevelWorks had no automated way to
warn users before their free trial ends — the only reminder was an in-app
banner that only shows if the user happens to open the app in their last 5
days. Someone who doesn't log in during that window gets no warning before
being locked out.

## What I could actually build from this session

This repo doesn't contain your live Supabase project (no existing
`supabase/functions` or `supabase/migrations` before this change, and this
session has no Supabase CLI login or service-role credentials). So I built a
**deployable scaffold**, not something that's live yet:

- `supabase/migrations/20260708_trial_reminders.sql` — creates a
  `trial_reminders_sent` table (so the job doesn't double-email someone) and a
  `users_view_for_trial_reminders` view that computes days-left-in-trial per
  user.
- `supabase/functions/send-trial-reminders/index.ts` — a daily scheduled edge
  function that finds users with 3 days left or 0 days left (trial just
  ended), and emails them via your existing `send-email` function.

## Assumptions you need to verify before deploying

I don't have access to your actual database schema, so I made the most
defensible guesses I could from the frontend code and flagged them in
comments:

1. **Trial start = `auth.users.created_at`** (sign-up time). No separate
   `trial_start` column showed up anywhere in the app's code, so this was the
   safest assumption. If you track trial start differently, update the view.
2. **"Still on trial" = no row in `public.subscriptions` with status
   `active`/`trialing`/`past_due`.** I couldn't find this table in the repo
   either (your `check-subscription` / `get-subscription-status` /
   `create-subscription` edge functions aren't stored here) — adjust the table
   and column names in the view to match reality.
3. **`send-email` needs two new `templateType` values**: `trial_ending_soon`
   and `trial_ended`. I don't have that function's source, so I can't add the
   template content myself — whoever maintains `send-email` needs to add
   handling (and copy) for those two template types the same way
   `estimate_sent` / `invoice_sent` are handled today.

## Deployment steps (I can't run these myself — no Supabase CLI/credentials in this session)

```
supabase link --project-ref djrsmuafbbzxpbdibolq
supabase db push                          # applies the migration
supabase functions deploy send-trial-reminders
```

Then schedule it to run daily — either via **Supabase Dashboard → Edge
Functions → send-trial-reminders → Cron** (e.g. `0 14 * * *`), or via
`pg_cron` + `pg_net` from the SQL editor (exact snippet is in a comment at the
top of `index.ts`).

## Bottom line

The frontend-only trial fixes in this PR (14-day text everywhere, unified
trial-status display, working "Subscribe Now" button) are live the moment this
branch is deployed. The reminder-email piece needs someone with Supabase
project access to review the assumptions above, adjust the table names if
needed, and run the deploy steps — I got it as close to done as I could
without that access.
