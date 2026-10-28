# The Facebook-group post for LevelWorks

Written in Eric's voice: a contractor who did the work, no marketing words, no emojis, no
hashtags, under 120 words each. Pain first, the fix second, the link third. Facebook hides the
same text posted in several groups, so there are four versions; rotate them and never post the
same one twice in a day.

Every claim below is true of the app today: estimate on the phone, text it, the client signs on
theirs, convert to an invoice, the client pays by card or bank transfer (ACH) through Stripe from
the link, works in English and translates to or from Spanish, $5 a month, 30 days free, no card
needed to try it. Do not add claims (no "scheduling", no "AI", no numbers of users).

**The group only ever sees `levelworks.org`** (Eric, Oct 28: "i'd rather the groups not actually
see /go/groupcode"). The trick is Facebook's own: paste the tracked link
`https://levelworks.org/go/<groupcode>` into the post box first, wait for the preview card to
appear, then **delete the pasted URL from the text**. The card stays, it shows only
"LEVELWORKS.ORG" and the page title, and a tap on it opens the tracked link, so the visit still
carries `utm_campaign=<groupcode>`. The body of the post says `levelworks.org` in plain words, as
written below. Never leave a `/go/` URL visible. Spanish posts build the card from
`https://levelworks.org/es/go/<groupcode>`.

## The tracked link

    levelworks.org/go/<groupcode>      →  https://www.levelworks.org/?utm_source=fb&utm_campaign=<groupcode>
    levelworks.org/es/go/<groupcode>   →  the Spanish page, same tags

`<groupcode>` is the short code from the tracker (lowercase letters, digits and dashes, e.g.
`pa-contractors`, `nj-roofers`, `handyman-usa`). One code per group, forever. The redirect lives
in `vercel.json`. The tracked link is only ever pasted to build the preview card and then removed
from the text; see above.

**What the site records today:** nothing about a visitor's link on the homepage. The `/annual`
checkout and Quote Check keep their UTMs, the landing page does not, and there is no analytics on
the site. So until that changes we can see sign-ups per day, not visits per group. Two fixes, both
small, both need Eric's go: (1) switch on Vercel Web Analytics for the project (a toggle in the
Vercel dashboard plus one package in the app), which reads `utm_campaign` out of the box and gives
visits per group like isms has; (2) stamp the UTM onto the account at sign-up (`user_metadata`),
so every new member carries the group that sent them. Both together take about an hour.

## 1. General contractor (the main post)

Been a contractor a long time. Estimates meant the kitchen table at 10 at night, then chasing a
signature, then chasing the check. I got tired of paying $50 a month for software that still made
me do most of it, so I built my own.

levelworks.org

Write the estimate on your phone in a minute, text it, the customer signs on theirs. One tap
makes it an invoice and they pay from the link, card or bank transfer through Stripe, to your
account. Works in English and translates to or from Spanish.

$5 a month. First 30 days free, no card to try it. I'm a contractor, not a software company. Tell
me what's missing and I'll build it.

## 2. Roofer / exterior

Roofers, you know the drill. Customer wants a number before you've been on the roof, you need a
signature before the shingles get ordered, then you wait on the check.

I got sick of paying $50 a month for estimating software, so I built my own.
levelworks.org

Estimate on your phone from the driveway, text it, they sign on theirs. Convert it to an invoice
when you're done and they pay from the link, card or bank transfer through Stripe. Bank transfer
on a $10,000 roof costs $5 instead of $300. Works in English and translates to or from Spanish.

$5 a month, first 30 days free, no card to try it. Tell me what you'd change.

## 3. Handyman / small jobs

Small jobs are the worst for paperwork. Twenty estimates a week, half of them under $500, and
every one still needs a price, a yes and a payment.

I built levelworks.org because I wasn't paying $50 a month to write a $300 estimate.

Type it on your phone in a minute, text it, the customer signs on theirs. Convert it to an invoice
and they pay from the link, card or bank transfer, through Stripe. Works in English and translates
to or from Spanish.

$5 a month, first 30 days free, no card to try it. If it doesn't do something you need, message
me and I'll build it.

## 4. Spanish-speaking crews (for bilingual or Spanish groups)

Para los que trabajan en español y cotizan en inglés, o al revés. levelworks.org

Escribes el presupuesto en tu teléfono en un minuto, lo mandas por mensaje, el cliente lo firma
desde el suyo. Un toque lo convierte en factura y te pagan desde el enlace, con tarjeta o
transferencia bancaria, por Stripe, directo a tu cuenta. Toda la app en español e inglés, y un
botón que traduce lo que escribiste en cualquier dirección.

$5 al mes, los primeros 30 días gratis, sin tarjeta para probarla. La hice yo, soy contratista.
Si falta algo, dime.

## Replies (Cowork answers these as Eric; anything else, ask Eric)

- "How much?" — $5 a month after 30 days free. No card to start. There's also a full year for $49.
- "Does it do invoices?" — Yes. Convert the signed estimate in one tap; they pay by card or bank transfer (ACH) through Stripe from the link. LevelWorks takes no cut.
- "Spanish?" — The whole app, and a button that translates your line items both ways.
- "Is it an app?" — It's a website that works like an app. Add it to your home screen from the More menu.
- "What about QuickBooks?" — No sync yet. Everything you need for the estimate-to-paid part is in it.
- "Who are you?" — Eric Connor, contractor in the Philly suburbs (EC Home Improvement). I built it for my own jobs first.
