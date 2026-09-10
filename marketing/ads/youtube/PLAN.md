# YouTube test for LevelWorks — plan, ready to run

Status Sep 10 2026: **planned, not running.** Waits on the Meta week being read (Sep 16) and on
Eric creating a Google Ads account. Nothing here has been spent.

## What it is

The LW49 video (`marketing/ads/lw49/`, the ~32s cut with the "Close Up" music) run as a skippable
in-stream ad before videos on contractor channels. Same ad, same offer, same `/annual` landing
page, new audience. Cost-per-purchase test, same as Meta: $200 to $300, then read it.

Why this and not a creator deal: a mid-size channel wants $2,000 to $10,000 for one mention. A
placement test costs a tenth of that and tells us whether contractors on YouTube buy at all.

## Numbers to expect

- Skippable in-stream on chosen placements: roughly **2 to 4 cents per view** (a view is 30s or
  the whole ad, or a click). $300 buys around 10,000 views from people who chose to watch
  contractor content.
- Skip rate is high and that is fine: we pay for the ones who watch. The first 5 seconds are
  Eric's face and "I'm a contractor" — that is the hook, keep it.
- Judge on **purchases per dollar**, never on views. Read it at 7 days, same as Meta.

## Campaign shape

- Google Ads → Video campaign → goal "Sales", subtype "Drive conversions" is fine, but for a
  first test use **"Video views"** with placement targeting so the money actually lands on the
  channels we picked. Conversion-optimised video needs history we do not have yet.
- Two ad groups, one per language, each with its own video:
  - EN: the English cut, English placements.
  - ES: the Spanish cut, **topic + keyword** targeting in Spanish (see below).
- Bid: target CPV $0.03. Daily budget $40, one week, so $280 total.
- Networks: YouTube only. Turn **off** video partners / Display Network.
- Devices: all, but check the mobile share after two days; contractors watch on phones.
- Frequency cap: 3 per user per week. The same guy seeing it ten times is waste.
- Location: United States. Language: English for EN, Spanish for ES.
- Landing page: `https://www.levelworks.org/annual?utm_source=youtube&utm_medium=video&utm_campaign=lw49&utm_content=<en|es>`
  — `utm_content` on the Stripe session is how purchases get attributed, same as email.
- Conversion: import the Purchase from the site. The pixel is Meta's; for Google, add the
  Google Ads conversion tag on `/annual/success` (one snippet, one env var for the ID). Do it
  before launch or the report is views only.

## English placements (channels to target)

Verify each in the Google Ads placement picker before saving; names and sizes move.
Pick by fit, not size. The list is contractor and trade content, not DIY homeowners.

| Channel | Why |
|---|---|
| The Build Show (Matt Risinger) | Builders and remodelers, high trust |
| Essential Craftsman | Working contractors, older audience that buys tools and software |
| Stud Pack | Framing and remodel crew, exactly the buyer |
| Perkins Builder Brothers | Small residential builders |
| RR Buildings | Post-frame and barn contractors |
| The Honest Carpenter | Carpenters and handymen |
| Finish Carpentry TV | Trim carpenters |
| Vancouver Carpenter | Drywall and finish trades |
| Home RenoVision DIY | Large; skews homeowner, so cap its share |
| The Contractor Fight (Tom Reber) | Contractor business content; the audience wants to run a better business |
| Project Farm | Tool tests; big, mixed audience, add only if CPV stays low |

Also add **topics**: Home Improvement, Construction, Business & Industrial → Construction &
Maintenance. And **keywords**: "contractor estimate", "how to bid a job", "contractor invoice",
"handyman business", "start a contracting business".

## Spanish targeting

Do not guess channel names. Use topics and keywords and let Google find the videos:
keywords "presupuesto de construcción", "cómo cotizar un trabajo", "contratista", "remodelación",
"negocio de construcción", "handyman en español"; topics as above; language Spanish; location
United States. After three days, open the placement report and move budget toward the channels
that actually showed the ad.

## Read it like this

- Day 2: is it spending, is the view rate above 20 percent, is the ES group getting impressions.
- Day 7: purchases per dollar per language, next to Meta's. Whichever is cheaper gets the
  scaled budget. If neither buys, YouTube is not the channel yet, and the list and the guides
  are.

## What Eric does (ten minutes)

1. Create a Google Ads account at ads.google.com with the LevelWorks Google login. Skip the
   "smart campaign" wizard: choose "Switch to expert mode".
2. Add a payment method.
3. Connect it in Windsor (`google_ads` connector) so it can be read and run from here.
4. Upload the two videos to the LevelWorks YouTube channel as **unlisted**. Ads need a YouTube
   URL, not a file.
