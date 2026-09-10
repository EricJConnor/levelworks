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

## Pre-launch checks (run Sep 9 2026)

| # | Check | Status |
|---|---|---|
| 1 | Purchase → account → login → counter | **pass**. Eric paid $49 on his own card (counter 0→1, plan set through Sep 9 2027, existing-account path). A $0 CREW purchase with a throwaway email ran the brand-new path headless: set-password screen → signed in → four-step tour → estimate builder open. Test accounts removed. |
| 2 | Refund → plan reverted → counter decremented | **pass**. Refund `re_3UDs3yCrlMKmuUj41yhqfXG9`; Stripe delivered `charge.refunded`, counter 1→0, plan cleared. |
| 3 | Pixel events and CAPI dedupe | browser events fire on the live page (PageView, InitiateCheckout, Purchase with the session id as eventID) and the server sends Purchase through CAPI with the same id. **Not yet seen in Events Manager**: needs Eric to open Test Events, or to read the pixel's event list after the first real purchase. |
| 4 | Pages load on mobile, speed | pass: both pages load in well under a second on a phone viewport (DOMContentLoaded ~150ms, load ~250ms); no video, one WebP above the fold. Lighthouse score itself not run from this environment. |
| 5 | No language leaks | pass, checked on the live pages: /es/annual has no English strings, /es/annual/success is Spanish, recurring billing panel translated. |
| 6 | Videos | pass: twelve files, Eric's shop intro, ~32s, all under 4MB, H.264 yuv420p, thumbnails. Approved by Eric ("ads approved"). Sep 10: music bed added ("Close Up", Mixkit free licence) under the phone story, voice alone on the intro, runs to the end; Eric's pick. |
| 7 | Campaign PAUSED with budget, pixel, event | pass: campaign `52547713746537`, ad sets `52547713777737` (EN) / `52547713784537` (ES), six ads (recreated Sep 10 with the music cut; the originals are deleted) `LW49-EN-estimate` `52547921879937` `LW49-EN-invoice` `52547921910137` `LW49-EN-recurring` `52547921974737` `LW49-ES-estimate` `52547921995737` `LW49-ES-invoice` `52547922028537` `LW49-ES-recurring` `52547922040537`, all PAUSED, in Meta review. 1:1 on feed, 9:16 on Stories/Reels via asset customization. **Dates are placeholders**: reset start/end to the go-live day before enabling. |
| 8 | Domain verified in Meta | **unknown**: the bot token cannot read Business Manager domains. Eric checks Business Settings → Brand Safety and Suitability → Domains. |
| 9 | Terms, Privacy, 30-day refund | pass. |
| 10 | Sold-out state | pass: with the counter forced to 500 the button reads "Sold out — join for $5/month" and the line explains. |
| 11 | Annual plan on the Plan tab | code done; seen only through the API on Eric's account (plan set, then cleared by the refund). |
| 12 | Live webhook secret | pass: live endpoint `we_1UDX36CrlMKmuUj4vyfcsWwm`, now at the **www** host (the bare domain redirects and Stripe does not follow redirects; this bit the first purchase). |

Old campaign `Level-Works-Signups-Test1` paused Sep 9 at Eric's word. CREW promo code exists (`promo_1UDsNHCrlMKmuUj4uCxRbQk0`, 100% off, 15 uses).

## Known gaps, stated plainly

- **This environment cannot reach Vercel.** The preview URL and the redeploys are Eric's clicks.
- **Row-level security is not enforcing on estimates (and likely invoices, clients).** A logged-in
  user can read every user's rows through the API. Unrelated to this launch; needs its own fix
  (enable RLS with the per-user policies from the SQL docs, plus a policy for the public
  view-by-token pages). Do not ship the launch ads without at least scheduling this.
- The demo account `demo.lw49@levelworks.org` exists in production for screenshots. Remove with
  `node scripts/lw49-demo.mjs delete` when no longer needed.
