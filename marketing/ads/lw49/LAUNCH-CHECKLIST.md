# LW49 launch checklist

Status is kept here as each box is actually run. "Pass" means it was run and seen, not described.

## Eric's two paste jobs (blocking everything below)

**1. Supabase SQL.** Dashboard → SQL Editor → New query → paste all of
`supabase/sql/annual_launch.sql` → Run. The last line prints `annual_claimed | 0`.

**2. Vercel environment variables.** Project → Settings → Environment Variables. Add each for
**Production and Preview**, then Deployments → latest → Redeploy.

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | the live `sk_live_…` key (same one given in chat) |
| `STRIPE_PRICE_ANNUAL_49` | `price_1UDWi6CrlMKmuUj4z7Whuzoh` |
| `STRIPE_ANNUAL_WEBHOOK_SECRET` | the `whsec_…` given in chat (Stripe endpoint `we_1UDX36CrlMKmuUj4vyfcsWwm`) |
| `SUPABASE_SERVICE_ROLE_KEY` | the `sb_secret_…` key (same one given in chat) |
| `META_CAPI_TOKEN` | the levelworksadbot system user token |
| `CRON_SECRET` | the random string given in chat |
| `RESEND_API_KEY` | optional. With it, emails come from "Eric at LevelWorks <eric@levelworks.org>"; without it they go through the app's existing send-email function from noreply@levelworks.org |

## Pre-launch checks

| # | Check | Status |
|---|---|---|
| 1 | Test purchase → account created → login link works → counter incremented | pending: needs SQL + env vars, then Eric buys a year on his own card |
| 2 | Refund → plan reverted → counter decremented | pending: same purchase refunded from the Stripe dashboard |
| 3 | Pixel: PageView, InitiateCheckout, Purchase visible in Meta Test Events; Purchase deduped browser vs CAPI | pending: set `META_TEST_EVENT_CODE` in Vercel while testing, then remove |
| 4 | `/annual` and `/es/annual` load on mobile, Lighthouse 90+ | rendered at 390px both languages (screenshots sent); Lighthouse pending on the deployed URL |
| 5 | No English on the Spanish page and vice versa | pass locally, both pages read through; recurring billing panel translated (was leaking) |
| 6 | All 12 videos play, loop clean, text readable at thumbnail size | pass: rendered, ffprobe `h264 (High) yuv420p`, all < 1MB; loop fades to ground on the last 0.35s |
| 7 | Campaign exists PAUSED with correct budget, dates, pixel, event | campaign `52547713746537` and ad sets `LW49-EN` `52547713777737` / `LW49-ES` `52547713784537` exist PAUSED, lifetime $200, pixel 2017000758930909, Purchase. Ads pending Eric's approval of the creatives. Dates are placeholders (start tomorrow, 7 days); reset them the day it goes live |
| 8 | Domain verified in Meta | pending: bot token cannot read Business Manager domains; check Business Settings → Brand Safety and Suitability → Domains for levelworks.org |
| 9 | Terms, Privacy, refund policy exist and are linked (30 days stated) | pass: Terms §6 rewritten, linked from the page footer |
| 10 | Sold-out state tested at 500 | pending: temporarily insert 500 rows? No. Test by setting `ANNUAL_CAP` to the current count + 0 on a preview, or insert one row with `refunded_at` null and cap at 1 in a preview env |
| 11 | Annual plan shows on the user's Plan tab | code done; verify with the test purchase |
| 12 | Stripe webhook signing secret is the live one | the endpoint was created in live mode; the secret in Vercel must be the one from `we_1UDX36CrlMKmuUj4vyfcsWwm` |

## Known gaps, stated plainly

- **This environment cannot reach Vercel.** The preview URL and the redeploys are Eric's clicks.
- **Row-level security is not enforcing on estimates (and likely invoices, clients).** A logged-in
  user can read every user's rows through the API. Unrelated to this launch; needs its own fix
  (enable RLS with the per-user policies from the SQL docs, plus a policy for the public
  view-by-token pages). Do not ship the launch ads without at least scheduling this.
- The demo account `demo.lw49@levelworks.org` exists in production for screenshots. Remove with
  `node scripts/lw49-demo.mjs delete` when no longer needed.
