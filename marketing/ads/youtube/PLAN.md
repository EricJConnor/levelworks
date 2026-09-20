# YouTube test for LevelWorks — plan, ready to run

Status Sep 20 2026: **planned, not running.** Waits on Eric creating a Google Ads account and on
the ad account having money in it (Meta's balance is down to about $27). Nothing here has been spent.

Revised Sep 20 2026 against measured benchmark data. The original cost assumptions were roughly
**twice as optimistic** as the evidence supports; the corrected numbers are below.

## What it is

The LW49 video (`marketing/ads/lw49/`, the ~32s cut with the "Close Up" music) run as a skippable
in-stream ad before videos on contractor channels. Same ad, same offer, same `/annual` landing
page, new audience.

Why this and not a creator deal: a mid-size channel wants $2,000 to $10,000 for one mention. A
placement test costs a tenth of that and tells us whether contractors on YouTube respond at all.

## Why YouTube at all — the one argument that matters

**On skippable in-stream you are charged only when someone watches 30 seconds, or the whole ad if
it is shorter, or clicks.** The viewer can skip after 5 seconds. That is Google's documented
billing rule and it did not change when the metric was renamed to TrueView views in October 2025.

The first five seconds of our ad are Eric's face and "I'm a contractor". Everyone who is not a
contractor skips, and **those impressions cost nothing**. On Meta we pay full price to show the
same five seconds to the same wrong people: the September English set ran at roughly **$80 per
thousand impressions**, every one of them paid for.

So the case for YouTube is **reach, not cheaper clicks**. Measured cost per click for business
software on YouTube is about $3.56, which is slightly *worse* than the $2.90 Meta actually
charged us. But the effective cost per thousand impressions for a self-selecting creative should
land near $6 to $15 against Meta's $80. Same money, several times the audience, and the wrong
people are free.

## Numbers to expect — corrected

The old version of this file said 2 to 4 cents a view and 10,000 views for $300. That is too
optimistic for placement-targeted business software in the US.

| | Pessimistic | Central | Optimistic |
|---|---|---|---|
| Cost per view | $0.10 | $0.06 | $0.04 |
| Paid views for $300 | 3,000 | 5,000 | 7,500 |
| Clicks to the site | 30 | 90 | 250 |
| Implied cost per click | $10.00 | $3.33 | $1.20 |

Measured benchmark for business software on YouTube: **$0.05 cost per view on average**, ranging
$0.01 to $0.19, from about $1M of spend. View rate averages 29% of impressions, click-through
0.51% of impressions. Narrowing to a short placement list pushes cost per view **up**, not down,
because the cheap long-tail inventory is gone.

**Expect roughly 90 clicks and 4 to 9 sign-ups for $300.** That is a signal-detection budget, not
a growth budget. It can tell us whether contractors on YouTube move at all. It cannot give a
reliable cost per sign-up, because at four to nine events the error bars swallow the answer.
**Agree what counts as a pass before spending anything**, or the result gets argued either way.

## The trap that would waste the whole test

**Video Action Campaigns were retired through April 2026 and folded into Demand Gen, which is
billed per impression.** If the campaign is built around a conversion goal, Google routes it into
Demand Gen and **the skip economics disappear entirely** — we go back to paying for every
impression, which is the only reason to be on YouTube in the first place.

The setting, exactly: **Video campaign → "Video views" subtype → Target CPV bidding → in-stream
only.** Nothing else.

## Campaign shape

- **In-stream only.** A Video views campaign will also serve in-feed and Shorts if allowed, and
  both of those bill a view at **10 seconds**, not 30. That dilutes the self-selection we came
  for. Turn them off explicitly.
- **English placements only for the first test.** The earlier version of this plan ran English on
  placements and Spanish on topics and keywords at the same time. That is two experiments inside
  one $280 budget and neither gets a clean read. It is also the September mistake in a new
  costume: **never put two languages under one budget.** Spanish gets its own campaign and its own
  money once there is something to scale.
- Bid: **target CPV $0.06 to $0.08**, not $0.03. A bid that is too low is the single most common
  reason a placement-targeted video campaign shows zero impressions. If delivery is comfortable
  after two days, lower it.
- Daily budget $40, one week, so $280 total.
- Networks: **YouTube only.** Turn off video partners and the Display Network.
- Devices: all, but check the mobile share after two days; contractors watch on phones.
- Frequency cap: 3 per user per week.
- Location: United States. Language: English.
- Landing page: `https://www.levelworks.org/annual?utm_source=youtube&utm_medium=video&utm_campaign=lw49&utm_content=en`
  — `utm_content` on the Stripe session is how purchases get attributed, same as email.
- Conversion: add the Google Ads conversion tag on `/annual/success` **before launch**, or the
  report is views only and the test teaches us nothing.

## English placements (channels to target)

Verify each in the Google Ads placement picker before saving; names and sizes move.
Pick by fit, not size. Contractor and trade content, not DIY homeowners.

| Channel | Why |
|---|---|
| The Build Show (Matt Risinger) | Builders and remodelers, high trust, ~900k subscribers |
| Essential Craftsman | Working contractors, older audience that buys tools and software |
| Stud Pack | Framing and remodel crew, exactly the buyer |
| Perkins Builder Brothers | Small residential builders |
| RR Buildings | Post-frame and barn contractors |
| The Honest Carpenter | Carpenters and handymen |
| Finish Carpentry TV | Trim carpenters |
| Vancouver Carpenter | Drywall and finish trades |
| Home RenoVision DIY | Large; skews homeowner, so cap its share |
| The Contractor Fight (Tom Reber) | Contractor business content; the audience wants to run a better business |
| Project Farm | Tool tests; big, mixed audience, add only if cost per view stays low |

**Do not stack keyword or audience targeting on top of the placement list.** Google names
"combining different types of targeting" as a documented cause of a campaign not delivering. If
day one shows zero impressions, **raise the bid before broadening the targeting.**

## Spanish — later, and separately

Not in this test. When it runs it gets its own campaign and its own budget, with topics and
keywords rather than named channels: "presupuesto de construcción", "cómo cotizar un trabajo",
"contratista", "remodelación", "negocio de construcción", "handyman en español".

Two things make this worth doing eventually. Spanish inventory is materially cheaper; a published
Google study found Spanish search clicks at $0.79 against $2.65 for the same English term. And the
Meta ad library shows **Jobber, Housecall Pro, Workiz and Joist run zero Spanish ads** — confirmed
empty, not merely unobserved.

## Read it like this

- **Day 1:** is it delivering at all. Zero impressions means the bid is too low or the targeting is
  stacked. Fix the bid first.
- **Day 2:** view rate above 20%, mobile share, cost per view against the $0.06 target.
- **Day 7:** clicks, cost per click, sign-ups by `utm_content`. Compare against Meta's $2.90 a
  click and, more importantly, against Meta's $80 per thousand impressions.

## Google Search is the other candidate for the same $300

Worth saying plainly: **search may be the better use of the money, and it is the one channel
LevelWorks has never tested.** Documented average cost per click in the Technology category is
$3.80, from a study of 13,000 US campaigns. Terms like "contractor invoice app" sit in that band,
probably $3 to $8. The expensive auction is homeowners searching for contractors at $8.33 a click,
and that is not the auction we would enter.

$300 buys around 60 clicks from people who typed the problem into Google, against 90 from people
who were watching something else. It also stacks with the guides already shipped.

Two conditions. **Exact and phrase match only, with a hard negative list**, or broad match burns
the budget on junk. And check the real volume in Keyword Planner first, which is free inside the
account Eric needs anyway: no credible per-keyword cost for these terms is published anywhere.

## What Eric does (ten minutes)

1. Create a Google Ads account at ads.google.com with the LevelWorks Google login. Skip the
   "smart campaign" wizard: choose **Switch to expert mode**.
2. Add a payment method.
3. Connect it in Windsor (`google_ads` connector) so it can be read and run from here.
4. Upload the video to the LevelWorks YouTube channel as **unlisted**, and **link that channel to
   the Google Ads account**. Ads need a YouTube URL, not a file. Unlisted is allowed; **private is
   not**, and switching a running ad's video to private gets it disapproved.
