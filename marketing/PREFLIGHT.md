# Before you spend a dollar, and in the first hour after

Every expensive mistake LevelWorks has made on ads was findable before the money went, or within
an hour of it going. None of them were found that way. They were found days later in a spend
report, or by Eric looking at his own phone.

The pattern is not ignorance. It is **not verifying what was actually created**. A call that
returns 200 means Meta accepted the request, not that the thing will work.

Work top to bottom. Nothing here takes more than a minute.

---

## Before launch

**0. List every campaign on the account, not the ones you remember.**
`get_data` with no campaign filter returns all of them. On 22 September this turned up an
August campaign worth $77.41 that had never been recorded anywhere — and it was the best
campaign the account has ever run, at $12.90 a sign-up. A read built from notes repeats the
notes' blind spots.

**1. Can it deliver at all?**
`GET /<adset_id>/delivery_estimate?fields=estimate_dau,estimate_mau_lower_bound,estimate_mau_upper_bound,estimate_ready`

`estimate_ready: false` that stays false, or an audience in the low thousands, means it will not
serve. A whole day was lost in September to a campaign that was active, approved and reaching
nobody. `estimate_dau` is returned but is no longer in Meta's documentation, so read the
membership bounds as well rather than trusting it alone.

**2. Is the optimised event one that actually happens?**
Count what that event did last week. If it is under 50, the ad set will never leave the learning
phase, and Meta will buy the cheapest inventory it can find rather than customers. Move up a
rung: purchase, sign-up, a mid-funnel event, link clicks. Bidding for purchases on a pixel that
has never seen one cost $152.73 and produced nothing.

**3. Does every creative rule name its positions?**
`GET /<ad_id>?fields=creative{asset_feed_spec}` and read `asset_customization_rules`. **A rule
with no positions is not a catch-all.** Meta matches nothing to it and silently skips that
format. This is why the feed was never served for three days at a cost per thousand of $79.

**3b. Name the placements you want; never exclude the ones you don't.**
An exclusion is a request and Meta may ignore most of it. Measured here: Quote Check excluded
Audience Network and it still took **80% of all views**, while the LevelWorks ad set used a
named include list the same week and nothing served outside it. Build placements as an include
list, and read the breakdown afterwards either way.

**4. One budget, one audience.**
Never two languages, two countries or two audiences under one shared campaign budget. The
cheaper one wins the money and the better one starves. English got $1.75 in four days that way.

**5. Is there money in the account?**
`GET /act_<id>?fields=balance,amount_spent,spend_cap,account_status`
Prepaid funds stop delivery with no error anywhere else. A spend cap that has been met looks
identical to an ad that is not working.

---

## Within the first hour

**6. Is anything blocking it?**
`GET /<ad_id>?fields=effective_status,ad_review_feedback,issues_info,failed_delivery_checks`

`failed_delivery_checks` is the field almost nobody reads and it is the most direct answer to
"why is nothing happening". One flagged ad can hold back a whole ad set.

**7. Did the edit you made actually take?**
Read the object back. `update_adset` **replaces the whole targeting spec**, so an edit sent
without the existing settings wipes the geography and the age range.

---

## At 24 hours, and before believing any number

**8. Where did the money actually go?**
`GET /<campaign_id>/insights?breakdowns=publisher_platform,platform_position&fields=spend,impressions,cpm,inline_link_clicks,actions`

Do this **before** drawing any conclusion about cost. Both of the expensive September mistakes
were invisible in the headline figures and obvious here.

Look for: everything in one placement; a placement missing entirely; spend appearing somewhere
you excluded, which is the 5%-per-exclusion default Meta turned on in October 2025 and means
your exclusion is not doing what you think; a cost per thousand three to five times the norm.

**9. Judge on something that exists.**
At a small budget the conversion count will be zero or one either way, and arguing about it is
arguing about noise. Judge on cost per click, cost per landing page view and the placement mix.
Reserve cost-per-sign-up for when there are enough sign-ups to divide by.

---

## Then leave it alone

**Seven days, no edits.** Every significant edit restarts the learning clock, and cost per
result then gets measured across the reset, which makes every week look worse than it is. An
account edited every few days never leaves learning at all. This is the commonest way a small
advertiser destroys their own data.

Significant means: the optimised event, the audience or geography, **placements**, the creative,
the destination, the bid strategy, switching daily to lifetime, or pausing for a while. A
placement change is significant, because placements live inside the targeting.

"It is a flake" is not a diagnosis. Re-run a job only to confirm a failure that is not yours, or
when it died before anything ran.

---

## After it stops

**Write the row in `marketing/LEDGER.md`.** Spend, clicks, sign-ups, sales, and the lesson in
plain words. A campaign that failed is the most useful row in that file, and the reason this
checklist exists is that those lessons used to live in one session's memory and die there.

---

## The one that is not about ads

**A change with a code half and a database half must work on both sides of the gap.** The code
deploys in minutes; SQL that has to be run by hand might not be run for hours. On 20 September a
security fix shipped code calling a database function that did not exist yet, which would have
shown a broken page to every customer holding an estimate link. Caught before anyone hit it,
by checking production rather than assuming.

Same discipline as the rest of this file: **verify what is actually there, not what you asked
for.**

**And two things the database taught on 21 September.**

Switching on row level security does not start from nothing. It **wakes up policies that were
already there and asleep**, because a policy on a table with security off does nothing at all.
Turning it on activated four old ones and the tables stayed wide open. Always list the policies
after enabling it, never assume the state you just created is the whole state.

**Read what a rule does, not what it is called.** The one that leaked everything was named
"Public can view estimates by token" and its actual condition was `view_token IS NOT NULL`. That
checks the row *has* a token, not that the caller *knows* it, and every sent estimate has one.
The name described an intention nobody had implemented.

**And say "the rule looks wrong", not "I proved it".** The test used to demonstrate that a
stranger could write aimed at a row that does not exist, so it returned success either way and
proved nothing. The policy text was damning on its own. Overstating the evidence is its own
failure even when the conclusion turns out right.
