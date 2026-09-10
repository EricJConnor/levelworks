# LW49 — "A year of LevelWorks for $49"

Everything for the launch lives here or is linked from here. Plain language on purpose.

## What is in this folder

- `lw49_<story>_<size>[_es].mp4` — the twelve ads. Three stories (estimate, invoice, recurring),
  two sizes (1x1 feed, 9x16 Stories/Reels), English-first and Spanish-first (`_es`).
  15 seconds, loops clean, H.264 yuv420p, all under 1MB.
- `lw49_<story>_<size>[_es].png` — the first frame of each, the static fallback and the ad thumbnail.
- `src/ad.html` — the ad itself, one HTML page driven frame by frame by `render(t)`.
  `src/render.mjs` records it with Playwright and encodes with ffmpeg
  (`node src/render.mjs all`, or `stills <story> <size> <lang> <t1,t2,...>` to look at moments).
- The same files are served from `public/marketing/ads/lw49/` so Meta can fetch them by URL.

## Where every ad lands

- English ad set → `https://levelworks.org/annual?utm_source=meta&utm_medium=paid&utm_campaign=lw49&utm_content=<story>`
- Spanish ad set → `https://levelworks.org/es/annual?…` same tags.
- `utm_content` is `estimate`, `invoice` or `recurring`, so each purchase in `annual_purchases`
  says which story sold it.

## Ad copy

**Primary text (EN)**
> I'm Eric, I'm a contractor. I built LevelWorks because every other app wanted $30 a month and still had me doing estimates at the kitchen table at 10pm. Estimate on your phone, client signs it, you get paid, in English or Spanish. A full year for $49. First 500 contractors, then it goes back to monthly.

**Headline:** A year of LevelWorks for $49 · **Description:** Estimates · Invoices · Recurring billing · **Button:** Sign up

**Primary text (ES)**
> Soy Eric y soy contratista. Hice LevelWorks porque todas las demás apps querían $30 al mes y aun así me tenían haciendo presupuestos en la mesa de la cocina a las 10 de la noche. Haces el presupuesto en tu teléfono, el cliente lo firma, te pagan, en español o en inglés. Un año completo por $49. Solo los primeros 500 contratistas; después vuelve a ser mensual.

**Headline:** Un año de LevelWorks por $49 · **Description:** Presupuestos · Facturas · Cobros recurrentes · **Button:** Regístrate

## Campaign shape

- Campaign `LW49-Annual-Launch-Sep2026`, objective Sales, lifetime budget **$200 over 7 days**,
  campaign budget (Advantage) on so Meta moves money to the ad set that sells.
- Ad set `LW49-EN`: US, 25–60, interests Home improvement + Construction, employer General
  contractor (from Level-Works-Signups-Test1), Advantage+ audience on, automatic placements,
  optimised for the pixel **Purchase** event. English.
- Ad set `LW49-ES`: same, Spanish language, lands on `/es/annual`.
- Three ads per set, one per story. 9:16 file on Stories/Reels, 1:1 on feed.

## Operating rules once it is live

1. **Do not touch budgets or targeting for the first 72 hours.** Meta is learning. Every change resets it.
2. **After 72 hours**, if one ad has twice the purchases of the others, pause the weakest one. Never pause everything at once.
3. **Raising a budget:** at most 20% at a time, no more than once every 2 days.
4. **Daily check** (pull through Windsor.ai, ask in chat): spend, purchases, cost per purchase, activation rate (people who made a first estimate ÷ purchases; `activated_at` in `profiles`).
5. **What $200 tells us.** This is a test of the price of a customer, not the launch. Realistic outcome is 3–8 purchases plus a handful of free-trial signups through the second door.
   - Cost per purchase **≤ $12**: scale immediately (rule 3 still applies).
   - **≤ $25**: the offer works; every $25 in comes back as $49. Keep scaling within rule 3.
   - **> $40**: stop, fix the page or the hook, do not add money.
   - 175 purchases at $25 each is roughly $4,000–5,000 of spend that pays for itself as it goes. Plan for that once the number is known.
6. **The counter is real.** Never seed it. To make it move honestly: the CREW promo code (100% off, 15 uses) for contractors Eric knows; each one is a real claim.
7. Old campaign `Level-Works-Signups-Test1` was still running at $10/day when this was built ($313 spent, 13 signups at ~$24). Decide whether it stays on.

## Emailing everyone who signed up (Sep 10 2026)

Every user is kept in two Resend audiences, **"LevelWorks users · English"** and **"LevelWorks
users · Español"**, by `api/_lib/audience.js`. The daily cron adds new sign-ups; a first load or a
check is `GET /api/sync-audience?key=<CRON_SECRET>` (`&dry=1` counts without adding). Demo and test
accounts at `@levelworks.org` are left out, and a contact Resend already has is never touched, so an
unsubscribe sticks. **Sending a blast.** Copy lives in `EMAILS` (`api/_lib/emails.js`) and the list of broadcasts in
`api/_lib/broadcasts.js`. The daily cron **drafts** each one in Resend once; Eric opens Resend →
Broadcasts, reads it, presses Send. No key needed. `GET /api/blast?key=<CRON_SECRET>&which=<name>`
reports, `&lang=en` shows the email, `&send=1` sends straight away. A broadcast's name is the lock,
so nothing goes twice. Resend adds the unsubscribe link. The footer carries Eric's email instead of
a street address by his choice (it is his home); US law technically wants a postal address, a PO box
would satisfy it.

## Go-live switch list (Eric does these by hand)

1. Supabase → SQL Editor → paste `supabase/sql/annual_launch.sql` → Run.
2. Vercel → Settings → Environment Variables (Production and Preview): the list in `LAUNCH-CHECKLIST.md`.
3. Merge the branch to `main` (Vercel deploys levelworks.org).
4. Meta Ads Manager → campaign `LW49-Annual-Launch-Sep2026` → **ACTIVE**. Fund the ad account first.
