# Quote Check — where it stands (Sep 20 2026, read this first)

**Eric's instruction for this track, in his words (Sep 19):** "I have to start generating some
money from this. Somehow." And: when he asks for X, build X; an opinion gets one line, then the
work. **Do not steer him back to LevelWorks.** Quote Check is a money-first product test and he
decides everything. Keep answers plain; he is a novice technically.

## What it is

A homeowner uploads a photo or PDF of a contractor's **estimate** (his word; homeowners say
estimate, contractors say quote or bid; the name stays Quote Check), adds a ZIP and a line about
the job, and gets a contractor's report for **$79**. Nobody reads anything by hand; Claude writes
the whole report in about a minute. Eric's framing: Liquid Death for a boring category; sell to
people with money and fear; the credibility is a real contractor (him).

Live at **https://www.levelworks.org/quote-check**. No separate site: it rides on the LevelWorks
repo, Vercel, Stripe, Resend and the Claude key already in Vercel. When it sells, buy
**quotecheck.io** (looked free Sep 19; quotecheck.com and .org are taken) and point it here.

## The flow

1. Upload → `api/quotecheck-upload.js` runs the review immediately (Claude `claude-opus-5`,
   structured output, `api/_lib/quotecheck.js`), stores the file and `review.json` in one private
   Supabase Storage bucket **`quotecheck`** (`<id>/quote.<ext>`, `<id>/review.json`; created on
   first use; no migration). Answers a **teaser**: verdict, trade, total, counts (flags, missing,
   red flags, questions). Unreadable uploads say so and cannot be paid for.
2. The page shows the verdict and a blurred locked preview (the conversion screen), takes an
   email, and `api/quotecheck-checkout.js` opens Stripe Checkout with an **inline $79 price**
   (no Stripe product or env var), metadata `plan=quotecheck, review=<id>`, UTMs carried.
3. `/quote-check/result?id&session_id` → `api/quotecheck-result.js` confirms the session with
   Stripe, marks paid once, emails the report once (Resend, from "Eric at Quote Check"), returns
   the full report. 402 + teaser when unpaid. The id is 96 random bits; the link is the key.
4. `api/quotecheck-stats.js` is public, counts only (uploads, paid, revenue, 24h/7d, verdicts,
   trades) for the morning report.

**The report** (`Report` component in `src/pages/QuoteCheck.tsx`, same component renders the
sample on the landing page so the sample is exactly what a buyer gets): verdict headline; a
highlighted **"For your area"** box (region, cost index vs US average, what the job typically runs
there, labor rate assumed); what the job should cost; **how that number is built** (materials,
labor, permits/disposal, the trade's normal overhead-and-profit range, and the margin the
estimate implies — Eric's ask); every line judged (fair / watch / high / missing detail) "priced
for ZIP"; **what could justify a higher price / what could explain a lower one** (Eric's ask);
what's missing; red flags; questions to ask; a "say this" script; bottom line; ticket number.
Prompt rules: never "padded" or "padding" (Eric dislikes the word on the page; "padding" stays
only in his own note); say "report" not "review"; say "estimate".

**Page decisions:** upload card is the call to action above the fold; verdict free, pay to
unlock; stakes math ($2,000–$6,000 overcharge on a roof vs $79); "Priced for your ZIP, not a
national average" section; full sample report; Eric's note ("I've written more estimates than I
can count… if the report doesn't earn its $79, reply and I'll refund it" — **the refund promise
is on the page; honoring it is his call, by replying to the email**); FAQ says honestly that it
is software built and trained by a contractor and that a person answers replies. No fake
testimonials or counts. Laptop (≥760px): content on a bordered white sheet over a faint blueprint
grid, and a **3D coat-check claim ticket** turning at the top right of the hero (CSS only; static
under reduced motion). Phone keeps the plain layout Eric liked, with a small turning tag in the
header. The coat-check idea is used lightly on purpose (ticket number, tag mark, "check your
estimate in"); scared buyers want authority, not a theme.

**Whitelists / traps:** `sendMail` in `api/_lib/annual.js` now takes an optional `from`.
Vercel functions with long work set `maxDuration: 120`. The upload body is JSON with base64
(client compresses photos to ~2200px JPEG; PDFs pass through up to 3.5 MB).

## Save the page, and the every-three-days emails

"Estimate coming next week? Save this page" sits directly under the upload card. One email field.
`api/quotecheck-save.js` adds the address to the Resend audience **"Quote Check · leads"**,
sends the link plus five red flags (marketing mail: unsubscribe link and headers), and records
the lead at `leads/<sha1(email)>.json` in the same bucket (`recordLead`).

Then **one email every three days**, eight in all, from "Eric at Quote Check"
(`api/_lib/quotecheckDrip.js`, `DRIPS`; append only, never reorder): how a contractor prices a
job; the word "allowance"; **LevelWorks** for people who send estimates themselves ($5/month, 30
days free — the only pricing allowed); why the low bid isn't safe; **Eric Connor Web Design**
(ecwd1.com, described exactly as its site does: websites, apps, branding, Philadelphia area, no
prices); the deposit; LevelWorks payments and recurring billing; a personal "what happened with
the estimate?" from Eric. Tips stop short of what the report does (Eric: "don't give away too
much"). Sent by **`/api/cron-quotecheck`**, daily 14:00 UTC (10am ET) in `vercel.json`; skips
unsubscribed contacts; stops at the end of the list. Preview each in a browser, no login:
`/api/quotecheck-drip-preview?n=0` … `n=7`.

## Meta ads — LIVE since Sep 19 2026 ~6:55pm ET (Eric: "go for it. lets sell some reports")

- Ad account `3071713068446` (business portfolio "What's Next"), Page id **`1109311048926616`**
  (the LevelWorks Page: Eric had no time to make a Quote Check Page, so the ad shows
  "LevelWorks" as advertiser — flagged to him, accepted for the test).
- Campaign **`52550071722537`** QuoteCheck-Sep2026-Affluent-Uploads, OUTCOME_LEADS, CBO
  **$10/day**, lowest cost. (A first campaign `52550071376137` with OUTCOME_SALES is renamed
  "UNUSED…" and paused: Meta refused the Lead event under that objective. Ignore it.)
- Ad set **`52550071734737`**: optimises `OFFSITE_CONVERSIONS` on pixel `2017000758930909`
  event **LEAD** (= a readable upload; purchases have no history yet, the exact trap the $49
  launch hit). Ages 30–65, `advantage_audience: 0`, **~230 of the highest-income ZIP codes in
  ~30 metros** (Main Line and Bucks County, Westchester/Fairfield, North Shore Chicago, Buckhead,
  Highland Park TX, Bellevue, Palo Alto, Newport Beach, Scottsdale, Boca/Naples, etc.), keyed
  `US:xxxxx`. The ZIP list lives only in Meta; a call with more than ~250 ZIPs failed to send
  from here, so keep any edit to that size.
- Ad **`52550072405137`** "QC-estimate-fair-area-feed+stories": ONE ad with both images via
  `asset_feed_spec` + `asset_customization_rules` (square `public/marketing/quotecheck/ad-feed-1x1.png`
  to feeds/marketplace/search, tall `ad-story-9x16.png` to Stories/Reels; every rule names its
  positions). Windsor `create_ad` accepted image `url`s inside `asset_feed_spec`, so no image
  upload was needed. Two earlier single-image ads (`52550071831537`, `52550071837937`) stay
  PAUSED as spares. Link: `/quote-check?utm_source=meta&utm_medium=paid&utm_campaign=quotecheck&utm_content=dual1`.
- Pixel events on the page: `Lead` (readable upload, eventID = review id), `InitiateCheckout`
  (pay click), `Purchase` value 79 (unlock, eventID = session id), `Subscribe` (save the page).
- First two hours: approved and delivering; ~66 views, 34 people, 1 click, ~$1.44. Normal.
- **Day-1 read (Sep 20, 9:30am ET): Audience Network was eating the budget.** $5.00 total,
  1,466 views, 8 clicks, 0 uploads, 0 paid. The placement breakdown showed 1,353 of those views
  and 6 of the 8 clicks came from Audience Network (banner slots inside random apps, where
  clicks are mostly accidental taps) for 85 cents; the real placements (Facebook feed, Instagram
  feed, Reels, Stories) had 111 views and 2 clicks for about $4. **Audience Network is now
  excluded** (`publisher_platforms: facebook, instagram, messenger` on the ad set). Learning had
  zero events, so the reset cost nothing. Same lesson as LW49: read the placement breakdown
  (`publisher_platform`, `platform_position` in Windsor) before believing any number, and never
  let `audience_network` into a rule again.
- **Day-3 read (Sep 22, 9:30am ET).** Since the fix: $34.24, 483 views, ~370 people, 14 clicks,
  0 uploads, 0 saves, 0 paid. All-time: $37.69, 21 clicks, 0 uploads. Placements are now
  Facebook feed (most of it), Reels, Instagram feed/Reels/Stories; Audience Network gone.
  **The problem is the CPM: about $71 per thousand views.** The ~230 affluent-ZIP audience is
  tiny, so Meta charges LW49-launch prices for it; $10/day buys ~140 views and ~5 clicks. Cost
  per click ~$2.45 is fine; the volume is not. 0 of 14 clicks uploading is too few to judge the
  page. Recommendation put to Eric (not done, his call): open geography to the whole US, keep
  30–65, so the CPM drops to normal (~$10–15) and the same $10 buys 4–6x the clicks; income
  targeting through ZIPs costs more than it is worth at this budget.
- **Day-5 read (Sep 24, 9:30am ET): Meta numbers unavailable.** Windsor's free plan paused
  reads: "3 accounts connected and your Free plan includes 1 account". Eric has to disconnect
  two at https://onboard.windsor.ai/app/ and keep only the Meta ad account `3071713068446` (drop
  the personal Meta account "Eric Connor" `1357024962671524` and the Google Business Profile
  "EC Home Improvement"). Until then nothing here can read or change the ads. The site itself:
  still 1 upload (the Sep 19 test), 0 paid, 0 saves, so the ad has produced no upload in five
  days on ~$60. Eric had not answered the day-3 recommendation (open geography to the whole US).
  The page answered fine (one transient 30s timeout, then 200s in under half a second).
- **Day-7 read (Sep 26, 9:30am ET).** Windsor still paused (same message); Eric has not
  disconnected the two extra accounts and has not answered since Sep 20. Site: still 1 upload
  (the test), 0 paid, 0 saves. A week of ads (~$70 if it kept pacing at $10/day) and no upload.
  Recommendation restated: open geography to the whole US, or pause the campaign until the $79
  purchase has been tested. Neither done: no word from Eric, and nothing here can touch the
  ads until Windsor is reconnected. Next read Sep 29.
- **Rules:** nothing touched before day five unless rejected or zero delivery. Judge by cost per
  upload (under $5 working) and uploads → purchases. Short pauses cost nothing; a pause of a week
  or edits to budget/targeting reset Meta's learning. Do not daypart (not available on daily
  budgets and Meta paces the day itself; the ZIPs span four time zones). Switch bidding to
  Purchase once there are ~20 purchases. Next creative when Eric has ten seconds on camera:
  him holding an estimate, "Before you sign this, let me look at it." Google search ads were the
  recommended first channel (intent, no Page shown) but need a Google Ads account Eric hasn't
  created.

## Check-ins and reports

- **Routine "Quote Check morning report"** (`trig_01Qe1JsaM3AXPPVCPx6Rp3yW`): every day
  12:00 UTC (8am ET), fresh session, reads `/api/quotecheck-stats`, four plain lines, push +
  email to Eric. It has no Meta connector, so it cannot read ad spend.
- Two one-off check-ins were scheduled inside the Sep 19 session (1-hour check, done; day-1 read
  Sep 20 13:30 UTC) and fire only there. A new session should read Meta via Windsor
  (`facebook`, account `3071713068446`, fields ad_id/effective_status/spend/impressions/reach/
  clicks, filter ad_id) plus the stats route, and schedule its own.

## Still Eric's / open

- **Not proven with real money:** the unlock-and-email step after Stripe says paid. Every step
  before it was tested live Sep 19 (upload read a real sample roofing estimate; checkout opened a
  live Stripe page; result stayed 402 unpaid). Ask him once to pay $79 to himself and refund it
  in Stripe. If a stranger pays first and anything misbehaves, the report is already saved under
  its id; unlock by hand is one edit to `review.json` (`paid: true`).
- Buy quotecheck.io (~$40) when it sells; create a Quote Check Facebook Page (2 minutes) so ads
  stop showing "LevelWorks".
- Ideas held for later: a free "5 red flags" checklist as a lead magnet on its own; a $149 tier
  for estimates over $30,000; a contractor version for checking subcontractor bids; homeowner
  Reddit/Facebook groups.
- Other money ideas discussed and not built: AI phone answering for contractors (~$79/month; a
  customer already paid a competitor for it), selling leads to contractors.
