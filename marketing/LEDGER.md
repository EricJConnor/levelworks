# The advertising ledger

Every dollar LevelWorks has spent on ads, what it bought, and what it taught us.

**Why this file exists.** Until now the only record lived inside Meta. When a campaign is
deleted or an account is closed, that history goes with it, and we have been re-deriving the
same numbers over and over by querying the platform. Worse, a lesson learned in one session was
lost by the next. This is our own copy. Every number here was read from the platform and is
dated.

**Rules for keeping it.** Add a row when a campaign starts. Fill in the result when it stops or
when it is read. Write the lesson in plain words, even when the lesson is embarrassing,
especially then. Never delete a row: a campaign that failed is the most useful row in the file.

Last verified against the platform: **20 September 2026**.

---

## The money

| Campaign | Ran | Bid for | Spent | Clicks | Sign-ups | Sales |
|---|---|---|---|---|---|---|
| `52532618280737` Level-Works-Signups-Test1 | Jun 2026 | Registration | $315.00 | ~194 | 13 | 0 |
| `52547713746537` LW49-Annual-Launch | Sep 9–14 | **Purchase** | $152.73 | 43 | 3 | 0 |
| `52548403713537` LW49-LPV | Sep 11–12 | Landing page view | $0.00 | 0 | 0 | 0 |
| `52548965992137` LW-Signups-Sep2026-Broad | Sep 14– | Registration | $84.20 | 29 | 0 | 0 |
| `52550071722537` QuoteCheck-Affluent-Uploads | Sep 19– | Lead (upload) | $15.27 | 10 | 0 uploads | 0 |

**Total spent: about $567. Total sign-ups: 16. Total revenue from advertising: $0.**

Account `3071713068446`, owned by the "What's Next" business portfolio (`1245227667768739`).
Balance on 20 Sep: **$26.82**, which is a day or two. Prepaid, so delivery simply stops.

### What each one actually taught us

**June, $315 for 13 sign-ups (~$24 each).** The only campaign that ever produced anything. It
bid for **registrations**, an event the pixel could actually see. This is the baseline every
later campaign should have been measured against and was not.

**September annual launch, $152.73 for 0 purchases.** Bid for **purchase** on a pixel that had
never seen one. Meta had nothing to learn from, so it bought the cheapest attention available
and the cost per thousand views ran near $79. The mistake is not subtle in hindsight: we already
had proof that registrations worked and chose a rarer event anyway.

**The landing-page-view campaign that never delivered, $0.** Built, activated, approved, and
nine hours later it had zero impressions with `estimate_dau: 0`. A full day lost. Checking the
delivery estimate at launch would have caught it in one minute. It is now step 1 of the
pre-flight.

**The sign-up campaign, $84.20 for 29 clicks and nothing.** Two separate faults. Budget was
shared across English and Spanish, so Meta starved the set that converted in favour of cheaper
Spanish Reels views. And at $12 a day it was producing about three registration events a week
against the fifty Meta needs, so it never left the learning phase at all.

**Quote Check, $15.27 for 10 clicks.** Six of those ten came from Audience Network, in-app
banner inventory where clicks are mostly accidents. So the real number is about four visitors,
and nothing can be concluded from it. Audience Network was excluded on day one, which was right.

---

## What we now know, with the evidence

**A campaign cannot learn on an event that rarely fires.** Meta needs roughly **50 of the
optimised event per week per ad set**. At $12 a day and $24 a sign-up we were producing about
three and a half, which is 7% of the threshold. Below it the system stops trying to find buyers
and buys the cheapest impressions it can reach. Documented by Meta under "learning limited",
where their own first suggested fix is to change to an event that happens more often.

**So the ladder is: link clicks, then a mid-funnel event, then sign-up, then purchase.** Go down
a rung only when the rung above is producing 50 a week. A `Lead` event now fires when somebody
starts the sign-up form, which is the rung that was missing.

**Never put two languages under one budget.** English got $1.75 in four days while Spanish spent
$47 for 20 clicks and no sign-ups. Campaign budget optimisation chases the cheaper impressions,
not the better customer. If Spanish comes back it gets its own campaign and its own money.

**Every rule in an `asset_customization_rules` list must name its positions.** A rule with no
positions is not a catch-all: Meta matches nothing to it and skips that format entirely. This is
why every impression between 9 and 12 September was Reels or Stories and the feed was never
served once, at a cost per thousand of about $79. The inverse is harmless: a rule whose
placements are no longer eligible simply never serves.

**Read the placement breakdown before believing any cost figure.** `breakdowns=publisher_platform,platform_position`.
Both of the expensive mistakes above were invisible in the headline numbers and obvious in the
breakdown.

**Excluding a placement no longer fully excludes it.** Since October 2025 Meta ships a setting,
on by default, that spends around 5% of budget on *each* excluded placement, on sales and leads
campaigns. Exclude four and up to a fifth of the budget can still land there. Check the
breakdown after any placement change rather than assuming the change took.

**Audience Network is not worth buying for this product.** In-app and in-game inventory where
taps are largely accidental. It took six of Quote Check's first ten clicks and produced nothing.

**`update_adset` replaces the entire targeting spec.** Read the current one back and resend it
with your additions, or the geography and age targeting are silently wiped.

**Ad review and the learning phase are different clocks.** A placement edit puts the ad back
into review, which cleared in under twenty minutes, and separately restarts learning, which
takes days. Clearing review tells you nothing about the second.

**A change with a code half and a database half has to work on both sides of the gap.** Learned
on 20 September outside advertising, but it belongs here: the security fix shipped code that
called a database function which did not exist yet, which would have broken every shared
estimate link until the SQL was run. Caught before anyone hit it. Same shape of error as
launching an ad set that cannot deliver.

---

## What has never been tried

- **Google Search.** The one channel with no history at all. Documented average cost per click
  in the technology category is $3.80. Terms like "contractor invoice app" sit in that band.
  Someone typing that has the problem right now, which no Meta audience can match.
- **YouTube in-stream.** Plan and corrected costs in `marketing/ads/youtube/PLAN.md`. The
  argument is the skip rule: a viewer who skips at five seconds costs nothing, so a creative
  that opens with "I'm a contractor" filters the audience for free.
- **Organic.** Eric on camera, contractor Facebook groups, supply-house counters. Slow, free,
  and the only channel whose cost does not rise with volume.

Both paid options need a Google Ads account, which does not exist yet.

---

## The product numbers the ads should be judged against

Read live at `https://www.levelworks.org/api/levelworks-stats`. On 20 September:

| | Signed up | Built an estimate | Sent one | Got paid |
|---|---|---|---|---|
| Last 7 days | 5 | 4 | 3 | 1 |
| Last 30 days | 24 | 7 | 5 | 1 |
| All time | 53 | 13 | 9 | 1 |

41 estimates exist, 27 of them sent, 14 invoices, and **$376 has moved through the app**. Two
contractors have connected Stripe.

**The finding that matters most.** The recent cohort activates at four in five, and Meta
attributed none of those sign-ups. People who find LevelWorks on their own use it. People we
interrupt on Reels do not. That is an argument about traffic, not about the product, and it is
the single best reason to try search before spending another dollar on social.
