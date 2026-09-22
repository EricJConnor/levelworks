# Isms — the clothing brand (Sep 22 2026)

Eric's idea, held since his son started talking: the words his son made up ("isms"), on hoodies
and tees in a colorful seventies font. He already made three "Yestertime" hoodies for the family
one Christmas. Agreed direction: **his son's isms are the brand and the launch line; "your kid's
word in our font" is the custom product that makes it a business.** Print on demand, no inventory.
Start on Etsy (free buyers), Shopify later if it sells. Checked Sep 21: no clothing brand called
Yestertime exists, and no brand is built on kids' invented words (Yesteryear Wear is nostalgia
tees, unrelated). Brand name still to check: "Isms".

Eric's note: this is the fun one. It is not the thing that fixes the money problem; the contract-
check list (IDEAS.md) is.

## The full list, from his notes (Sep 13 2026 and earlier)

Yestertime · Happy ever again · Funkshun · Worker · Done it · Doing it · Brought it · In it · What ·
Deal · Iffy · Watchin · I win you · Trifficult · Me did · Hear this · I know somethin · Gooder and
gooder · Good plan · Wibbalin' · I likeded it · Awesomer · Sidewards · Hayo · Scrapple eggs ·
3 o.m. (time) · I won you · Oh yea? Say what · O mama Mia · Bam it (outta there) · Wam that ball! ·
You would have to give your whole wallet · High score · Buckets of rain · Show your real face ·
Chicken patio sandwich · Lifety guard · I'm doing plenty of good here · Gymnapstix · Seventy
finals · Pooinyapanz / peainyapanz · Wanna watch that giant screen right there? · Doin stink
(Washington is doin stink with those penalties) · Learn true love of mine

## Launch set (single invented words print best: they read as a real word with a twist)

1. **Yestertime** — the flagship, the origin story, already proven on three hoodies
2. **Awesomer**
3. **Trifficult**
4. **Gooder and Gooder**
5. **Sidewards**
6. **Happy Ever Again**

Second wave: Funkshun, Wibbalin', Gymnapstix, Lifety Guard, Me did, I likeded it, Hayo, Scrapple
Eggs, Buckets of Rain.

Parent-side pieces (for the grown-up's hoodie): "I'm doing plenty of good here", "Learn true love
of mine", "You would have to give your whole wallet".

Philly line (Eric is Philadelphia area): **Doin Stink** as an Eagles-fan tee about Washington;
Scrapple Eggs.

## The look

Seventies: fat rounded display type (free-for-commercial candidates: Shrikhand, Chicle, Bowlby
One, Righteous; Cooper Black is the reference), slight arch, three-stripe shadow in mustard /
burnt orange / brown on cream or heather. Under each word, small and plain, a dictionary line:
"yestertime (n.) any time before right now." Inside label or back neck: "An ism. A word a kid
made up. Wear it before they grow out of it."

Custom product, one listing: type the word, pick the color, same font, so a stranger's word
looks like it belongs to the brand.

**Domain: wearisms.com**, bought by Eric at GoDaddy Sep 22 2026, one year (Eric preferred it over
shopisms; shopisms.com and isms.com are taken). A Routine "wearisms.com renewal reminder" fires
Aug 22 2027 with email and push so he renews in time.

## Next steps
1. Check "Isms" at USPTO under clothing.
2. Open one print-on-demand account (Printful or Printify; free; plugs into Etsy and Shopify).
3. Six designs, mocked up here first, then the Etsy shop.
4. One Meta ad: Eric on camera telling the Yestertime story, $50, parents 28 to 45, judge by
   cost per sale. Christmas is fourteen weeks out.

## The look, decided Sep 22 2026 (six rounds of mockups in the session)
Shrikhand (free for commercial use), a **very slight curve** (path `M-40 150 Q270 105 580 150`
on a 540-wide box), a stacked drop shadow stepped 3px per layer. **Dark shirts** (navy, forest,
rust, heather): cream `#f4e9d2` lettering over gold `#ffc43d`, orange `#ff7a1a`, red `#e0392b`,
brown `#6b2e15`. **Soft mid-tone shirts** (sage `#8fb59a`, dusty blue `#9fb4c9`, like the
original Christmas hoodies): yellow `#ffd23f` lettering over a dark edge `#2b1d12`, then red,
orange, brown. Yellow on cream or sand gets lost; do not do it. Eric did not love black as a
primary. Master file: the session scratchpad `isms/mock.html` (rebuild from these notes if lost).

## The site, decided Sep 22 2026
Eric: "the more options the better" inside the shop page, not on the landing. Landing stays
simple (story, hero shots, one button). **The shop page**: pick any ism from the FULL list (all
of them, with definitions, scattered as browseable cards), pick a product (tee, hoodie,
crewneck, beanie, dad hat, scarf, tote, and whatever else the printer offers) and a color, and a
**live preview** updates in the middle: the same SVG lettering drawn over the product photo, so
it is instant and matches what ships. **Your ism**: the same screen with an empty word box.
This is a real site on wearisms.com (Etsy cannot do a live custom preview): our stack plus
Stripe checkout, orders sent to the print-on-demand company automatically. **Printful** is the
pick (free, no minimums, API for mockups and orders). Eric opens the account; the site is a
couple of days of build.
- **Text styles (Eric, Sep 22):** the buyer also picks from 10 to 12 lettering styles that print
  well on clothing (the seventies stack is one of them). Each style is a font plus a treatment
  (stack, outline, plain, varsity, script), all free-for-commercial fonts, all previewed live.
- **Print-on-demand partner: to be chosen on research, not by default.** Criteria from Eric:
  best for new brands, sales and marketing help, turnaround, product quality, reachable customer
  service, speed of payment, plus what we are not thinking of yet.

## Print-on-demand partner: the research (Sep 22 2026, 35+ sources)

**Recommendation: start on Printful; pair with Apliiq for hats/beanies and custom neck labels.**
Printful is the only one with all four: a real documented REST API for one-off custom orders
from our own site (v2, async mockups, webhooks for status and tracking, no minimums, no monthly
fee); in-house US production (Charlotte NC x2, Los Angeles, Coppell TX); name-brand blanks
(Bella+Canvas, Gildan, Independent Trading, Comfort Colors, Stanley/Stella) with consistent
print; a documented 30-day free-reprint policy with photo evidence. It costs 15 to 30% more per
unit than Printify's cheapest shops; for a one-person brand launching into Christmas with no way
to QA a rotating cast of third-party printers, consistency is worth it.

Numbers (Printful, Sep 2026): Bella+Canvas 3001 tee $11.69 to $11.92; Gildan 18500 hoodie
from $26; embroidered beanie from $15.43 plus a one-time $2.95 to $6.50 digitizing fee; dad hat
$11.72 to $36 by style; US shipping from ~$4.75 first item; inside neck label $0.99, outside
label $2.49. Printify ranges: tee $8.50 to $13, Independent hoodie $22.95 to $25.56, shipping
$5.35 to $6.95 first item plus $2 to $3.50 each extra; Printify Premium went $29 to $39 in Feb
2026 and adds a $0.40/order holiday surcharge Oct 15 to Jan 17.

Ruled out: **Teespring/Spring is shutting down (stages from Sep 15 2026)**; Redbubble-style
marketplaces (their traffic, their checkout, not a brand); SPOD (fast and cheap but ~200
products, no hats/scarves depth); CustomCat (dropped embroidered hats); Gooten (routes across
partners, quality less consistent); Teelaunch (no 2025-26 presence); Fourthwall (well built but
hosts the checkout itself, so not our Stripe); Gelato (API-first, 140 hubs in 32 countries, the
best story for overseas or Spanish-speaking buyers later, but blanks depth and branded-label
mockups are thinner: a second-stage add-on, not the launch partner).

Risks and what to do: no sandbox in Printful's API, so test with real small orders in October;
undelivered-order and slow-support complaints exist (BBB 2025-26), so track every order by hand
the first month; set our Christmas cutoff 5 to 7 business days before Printful's; we are the
merchant of record so **sales tax is ours** (Stripe Tax from day one); Apliiq's API for a
non-Shopify site is unconfirmed, so email them before building on them, or run hats through
Printful; pull base costs live from the API rather than hardcoding them. The custom-word product
needs the print file generated on our server (the fixed template with the buyer's word) before
the order is sent; Printful expects a finished file per line.

Not verified (pages blocked the fetch): Apliiq's exact beanie/hat/tee prices, Gelato's exact
tee price, Fourthwall's per-item costs. Check in a browser before committing.

First week for Eric: create the Printful account and an API-store, generate a key; order one
sample each of tee, hoodie, crewneck at the new-seller sample discount and wash-test one; create
an Apliiq account, email the API question, order one beanie sample; turn on Stripe Tax; then the
full pipeline test with a real small order.

## The mark (Sep 22 2026)
Nine directions rendered (stack, in quotes, speech bubble, dictionary lockup, crayon, round
badge, chunky one-color, smiley dot, neck-label lockup) and then six "…isms" versions at Eric's
suggestion (plain dots, red dots, three colored beads, the stack with dots, dots rising, dots in
a typing bubble). Files in the session scratchpad `isms/logo.html`, `logo2.html`. Decision
pending.
