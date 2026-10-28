# The Facebook-group post for LevelWorks

Written in Eric's voice: a contractor who did the work, no marketing words, no emojis, no
hashtags, under 120 words each. Pain first, the fix second, the link third. Facebook hides the
same text posted in several groups, so there are four versions; rotate them and never post the
same one twice in a day.

Every claim below is true of the app today: estimate on the phone, text it, the client signs on
theirs, convert to an invoice, the client pays by card or bank transfer (ACH) through Stripe from
the link, works in English and translates to or from Spanish, $5 a month, 30 days free, no card
needed to try it. Do not add claims (no "scheduling", no "AI", no numbers of users).

**The link goes in the text as `levelworks.org/go/<groupcode>`** (Eric, Oct 28: the link in the
post is what gets the visits and the sign-ups). It is short enough to read as the site's name,
Facebook unfurls it into a preview card, and it forwards to the homepage carrying
`utm_source=fb&utm_campaign=<groupcode>`, so the visit is still tracked. Spanish posts use
`levelworks.org/es/go/<groupcode>`. Write it once in the body, plain, no "click here".

## The tracked link

    levelworks.org/go/<groupcode>      →  https://www.levelworks.org/?utm_source=fb&utm_campaign=<groupcode>
    levelworks.org/es/go/<groupcode>   →  the Spanish page, same tags

`<groupcode>` is the short code from the tracker (lowercase letters, digits and dashes, e.g.
`pa-contractors`, `nj-roofers`, `handyman-usa`). One code per group, forever. The redirect lives
in `vercel.json`; the long form with the tags written out also works if ever needed.

**What the site records today:** nothing about a visitor's link on the homepage. The `/annual`
checkout and Quote Check keep their UTMs, the landing page does not, and there is no analytics on
the site. So until that changes we can see sign-ups per day, not visits per group. Two fixes, both
small, both need Eric's go: (1) switch on Vercel Web Analytics for the project (a toggle in the
Vercel dashboard plus one package in the app), which reads `utm_campaign` out of the box and gives
visits per group like isms has; (2) stamp the UTM onto the account at sign-up (`user_metadata`),
so every new member carries the group that sent them. Both together take about an hour.

## 1. General contractor (the main post)

Been a contractor a long time. Estimates used to mean the kitchen table at 10 at night, then
chasing a signature, then chasing the check. I got tired of paying $50 a month for software that
still made me do most of it, so I built my own.

levelworks.org/go/GROUPCODE

Write the estimate on your phone in about a minute, text it, the customer signs it on theirs. One
tap turns it into an invoice and they pay from the link, card or bank transfer, through Stripe,
straight to your account. Works in English and translates to or from Spanish.

$5 a month. First 30 days free, no card to try it. If something's missing, tell me. I'm a
contractor, not a software company, and I fix things fast.

## 2. Roofer / exterior

Roofers, you know the drill. Customer wants a number before you've been on the roof, you need a
signature before the shingles get ordered, then you wait on the check.

I got sick of paying $50 a month for estimating software, so I built one that does the job and
nothing else. levelworks.org/go/GROUPCODE

Estimate on your phone from the driveway, text it, they sign on their phone. When you're done,
convert it to an invoice and they pay from the link, card or bank transfer through Stripe. Bank
transfer on a $10,000 roof costs $5 instead of $300. Works in English and translates to or from
Spanish.

$5 a month, first 30 days free, no card to try it. Built by a contractor. Tell me what you'd change.

## 3. Handyman / small jobs

Small jobs are the worst for paperwork. Twenty estimates a week, half of them under $500, and
every one still needs a price, a yes and a payment.

I built levelworks.org/go/GROUPCODE because I wasn't paying $50 a month to write a $300 estimate.

Type it on your phone in a minute, text it, the customer signs on theirs. Convert it to an invoice
and they pay from the link, card or bank transfer, through Stripe. Works in English and translates
to or from Spanish.

$5 a month, first 30 days free, no card to try it. If it doesn't do something you need, message
me and I'll build it.

## 4. Spanish-speaking crews (for bilingual or Spanish groups)

Para los que trabajan en español y cotizan en inglés, o al revés. levelworks.org/es/go/GROUPCODE

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
