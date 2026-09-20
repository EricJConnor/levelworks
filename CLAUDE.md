# levelworks.org — project brief

LevelWorks is Eric Connor's estimating and invoicing app for contractors. Eric owns it and decides
everything; he is a novice technically, so keep answers plain and direct, and never hand him errands.
He reviews on a laptop and on his phone.

## Stack and shipping

- React 18 + Vite + TypeScript, Tailwind and a partial shadcn/ui layer, Supabase (auth, data, edge
  functions), Stripe for payments, Resend for mail.
- Deploys from `main` on Vercel to levelworks.org. Pushing to `main` from the Claude environment is
  blocked — work on a branch, open a PR with the GitHub tools, merge it.
- `npm run build` must pass before anything ships. Two pre-existing type errors in `src/lib/pixel.ts`
  and `src/lib/pushNotifications.ts` are unrelated to the UI and are not yours to chase.
- **`index.html` clears every cache and force-updates the service worker on each load.** A stale
  screen on Eric's phone is usually the old worker; a hard refresh settles it.

## The design system — read this before touching any UI

There is now **one** system for the whole product, and both halves already use it:

- **`src/pages/landing.css`** — the marketing page (`/`), prefixed `lw-`.
- **`src/app-ui.css`** — the app interior, prefixed `lv-`, loaded globally from `src/main.tsx`.

Same tokens in both: white ground `#ffffff` on a `#f5f7fb` page, ink `#0b1220`, muted `#5b6472`,
hairline `#e6e9ef`, blue `#2563eb` as the single accent, Inter, 8–18px radii, soft shadows.

**Colour has meaning and must keep it.** Blue is the product's accent and the primary action. Green
means money in — paid, balance due, a successful send. Amber means attention. Red means destructive.
A green "Send" button next to a blue "Save" was the old app's habit; it read as two competing
primaries. Don't reintroduce it.

Component classes live in `app-ui.css`: `.lv-btn` (`.pri` `.go` `.dark` `.sec` `.quiet` `.danger`,
sizes `.sm` `.lg` `.wide`), `.lv-card`, `.lv-row`, `.lv-input`, `.lv-field`, `.lv-label`, `.lv-pill`,
`.lv-seg`, `.lv-search`, `.lv-pop`, `.lv-empty`, `.lv-stat`, `.lv-page-head`, and the modal shell
`.lv-scrim > .lv-modal > .lv-modal-head/-body/-foot`. **Use them instead of inline styles.** The app
was previously a dark shell (`#0a0a0a`, `#1c1c1e`) wrapping light Tailwind modals, and it read as two
different products; that is what this system exists to prevent.

Two rules that will bite:

- `.lv-input` sets **16px** deliberately. Anything smaller makes iOS zoom the page on focus.
- Disabled inputs set `-webkit-text-fill-color` as well as `color`. Without it iOS renders disabled
  text almost invisible, which is exactly what happened in the read-only estimate view.

## The estimate builder (`src/components/EstimateBuilder.tsx`)

The most important screen in the product, rebuilt Sep 2026 at Eric's direction: *"done, save, send
and convert to invoice can be neatly placed next to each other at the bottom of the page. The overall
feel and UX on that page just needs to be way better."*

It is a **full-screen workbench**, not a modal: header bar (mode eyebrow, project name, running
total, close), a scrolling body, and a pinned action bar. On desktop the body is two columns — the
form left, a **sticky totals rail** right — so the total never scrolls out of sight while you price
work. Under 900px the rail collapses inline above the action bar. Classes are prefixed `eb-`.

**The action bar is the whole point of the rework.** It carries every way to finish an estimate, side
by side, always reachable:

| Button | Does | Weight |
|---|---|---|
| Cancel | closes without saving (desktop only — the header X serves phones) | quiet |
| Preview | saves, then shows the document exactly as the client receives it | secondary |
| Convert to invoice | hands the data to the invoice builder | secondary |
| Save | saves and closes | dark |
| Send to client | saves, then opens the send modal | **primary blue** |

**"Done" was renamed "Preview".** The old button said Done but actually saved and opened a preview,
while "Save" saved and closed — two buttons that both looked final and did different things. The
behaviour is unchanged; only the label tells the truth now. If Eric wants "Done" back, it is one
string, but keep the two actions distinguishable.

Other decisions worth keeping:

- Line items are cards: number chip, optional section tag, live line total and delete on one row,
  then the description, then Qty / Rate / Line total. Line total is **displayed, not editable** — it
  is derived, and an editable field there invited contradictory numbers.
- The section-title picker is a dashed pill that fills solid blue once a section is set, so an item
  with a section reads differently from one without at a glance. It still saves new titles to
  `line_titles` for reuse.
- The preview is the **client's document** — business block, prepared-for block, items with section
  labels, totals, deposit and balance, photos. It is what gets sent, so it should look like a
  finished estimate, not a form in read-only mode.
- `document.body.overflow` is locked while the builder is open, or the page scrolls behind it on iOS.
- Validation toasts say what is missing and what to do ("Client name needed"), never "Error".

`src/components/InvoiceBuilder.tsx` is the deliberate twin of this screen — same shell, same section
cards, same line-item shape, same action bar. **Change one and change the other**, or they drift back
into looking like two products.

## Interior screens

Every list screen follows the same shape: `.lv-page-head` (title, one-line description, primary
action), a `.lv-seg` segmented filter, a `.lv-search` box, then rows inside **one** `.lv-card` rather
than a stack of separate boxes. Empty states are `.lv-empty`: icon, short heading, one sentence, one
action. Money always carries `.lv-num` for tabular figures so columns line up.

The shell (`src/components/AppLayout.tsx`) is a light sticky header with the mark, six section links,
and the primary "New estimate" action; on phones it drops to a five-item bottom tab bar plus a More
sheet. `src/components/Mark.tsx` is the shared spirit-level mark, `currentColor` so it inherits.

## Spanish (Sep 2026)

The whole product speaks Spanish, for the trades. Eric's ask: *"a toggle somewhere on
the page eng/span, and its as simple as that. same thing in the estimates."*

- **`src/i18n/`** — a hand-rolled provider (no dependency; the need is one flat dictionary
  and a `t()`). `en/` and `es/` each hold six files: common, estimates, lists, modals,
  pages, landing. **956 keys, in exact parity.**
- **`<LanguageToggle />`** is a flag, its abbreviation and a chevron; opening it puts the
  other language one tap away. It sits in the app header and the landing header **on every
  size, phones included** — Eric's note was that it must not hide in the menu, and a Spanish
  speaker should never have to read English to find it. The choice is stored in
  `localStorage` under `lw-lang` and read synchronously in the provider's `useState`
  initializer, so the first paint is already in the right language. First-time visitors get
  their browser's language.
- **The flags are drawn as SVG, not emoji.** Flag emoji do not render as flags on Windows —
  Chrome there shows the two letters — so a laptop user would see "US" where a Mac user sees
  a flag. They are simplified deliberately: at 21px the stars and the eagle are invisible.
- **Which flag stands for Spanish is a judgment call, not a fact.** Language is not country.
  Mexico is used because it is by far the largest share of Spanish-speaking trades in the US
  and reads instantly to them; a Salvadoran or Dominican contractor may not see themselves in
  it, which is why the abbreviation carries the meaning and the flag only makes it findable.
  It is one line in `LANGS` to change.
- **The header brand drops to the mark alone under 460px** so the switcher and the primary
  action both fit without covering the wordmark.
- **A missing Spanish key falls back to English, never to a raw key.** Two scripts guard
  this — regenerate them if needed: one checks en/es key parity, one checks that every
  `t('...')` in the source is defined.

**Rules for the Spanish itself.** Neutral Latin American Spanish, "tú" not "usted",
written for a working contractor. Fixed terms: estimate = **presupuesto** (never
"estimado"), invoice = **factura**, deposit = **anticipo**, line item = **partida**,
job site = **obra**. Client-facing public views use "usted" — the client is a stranger.
Phone install instructions deliberately keep the ENGLISH button names ("Add to Home
Screen") in quotes, because that is what an English-language phone actually shows.

**Layout, not just words.** Spanish runs about a fifth longer than English and it broke
two things that are now guarded in `app-ui.css` and `landing.css`: the landing header CTA
uses a short label under 880px (the full one pushed the menu button off a 390px screen),
and the builder's action bar drops icons and shrinks type under 430px so "Convertir en
factura" is not clipped. **Check both languages on a 390px screen after touching either
file.** The Spanish hero headline is deliberately shorter than a literal translation —
headlines get written for the language, not carried across from it.

## Translating what the contractor typed

The dictionaries handle the interface. `api/translate.js` handles the part that cannot be
known ahead of time: the line items he writes himself. He taps **Traducir al inglés** in
the estimate builder, reviews the original beside the translation, and applies it — or
cancels, and nothing changes. **Never translate and send in one step.**

- Claude (`claude-opus-5`) through the official SDK, structured output via `zodOutputFormat`
  so line items come back keyed by id; ids not in the request are dropped, so a
  hallucinated id can never overwrite a line the contractor didn't submit. Effort is
  `medium` — translation is a transformation, not a reasoning problem, and he is standing
  in a driveway.
- The system prompt forbids adding or removing scope, and freezes numbers, measurements
  and brand names. That matters: this text becomes a contract.
- **Needs `ANTHROPIC_API_KEY` in Vercel.** Without it the route returns 503 with a plain
  reason and the UI shows it — the same failure mode the Resend key taught us. Roughly
  1.5 cents per estimate translated.
- Direction is guessed from what he has already written (`looksSpanish` in
  `src/lib/translate.ts`); on an empty estimate it falls back to the app's language.

**One flow, three screens (Sep 7 2026).** The button, the side-by-side review and the
apply step live in `src/components/Translate.tsx` as `useTranslator({ pieces, projectName,
onApply })`; the estimate builder, the invoice builder (line items **and** the client note)
and a job update (`CreateUpdateModal`: title, message, every photo caption) each pass their
own pieces and place `translator.button` and `translator.panel`. Keeping it in one place is
what stops the estimate and the invoice from drifting into two different features. Two
details: invoice line items have no id, so the index is the id (`item-0`); and the panel is
rendered through a **portal into `<body>`**, because it opens on top of screens that are
themselves modals with `overflow: hidden`, and its backdrop click calls `stopPropagation` so
it cannot close the screen underneath. Photo captions save on blur, so applying a translated
caption saves it too. Private notes (`Notes.tsx`) deliberately have no button — nobody but
the contractor reads them.

**His words are the source; the client's copy is derived (Sep 7 2026).** Translating used to
overwrite what the contractor typed, so a Spanish-speaking contractor whose client phoned about
a line came back to an estimate he could not read. Each line item now keeps `sourceText` /
`sourceLang` / `sourceStale` alongside `description` (the client's copy, and the only thing that
prints or sends). Once a line has an original the builder **opens on his words**, a `.lv-seg`
switches to the client's copy — read-only there, with no translate button, because it is
derived — and editing his original flags the line `sourceStale` ("Sin traducir"). Translating
from his side sends **only** the stale and untranslated lines: rerunning the rest would silently
reword work the client has already read and charge for it; when nothing has changed the button
says "Everything is up to date" instead. The fields are plain strings inside the existing
`line_items` JSONB — no migration — but both contexts whitelist fields when they read and write,
so `cleanLineItem` (DataContext) and the two mappers in InvoiceContext each had to carry them or
the original would vanish on save. `patchItem` exists because `updateItem` maps over the current
render's array, so writing the text and the flag in two calls lost the first.

**Still open:** the four `Public*View.tsx` pages are what the *client* sees. They
translate, but follow the viewer's own browser setting, not the contractor's. Whether a
client link should carry the sender's language is a product decision Eric has not made.

**On regional wording, in proportion.** Interface words — Guardar, Enviar, Cliente,
Presupuesto, Factura — are the same in every Spanish-speaking country, so there is
almost no risk in the dictionaries. Regional variation lives in TRADE vocabulary
(*tablaroca* vs *panel de yeso*), and that sits almost entirely in what the contractor
types into his own line items, which he words however he likes. Keep the app's own
copy free of any one country's slang: "Manitas" (Spain) and "troca" (Mexican-American)
were both used on the landing page once and replaced with neutral wording. If a real
Spanish-speaking contractor later flags a word, it is a one-line fix in one file.

## Line prices on the client's copy (Sep 14 2026)

The first real feedback from the member note: a contractor who quotes lump sum wanted to hide
the per-line amounts and show one total, because the only way to do it was $0 on every line but
one, and the document printed "$0.00" beside each. Two things now, both in `src/lib/linePrices.ts`:

- **A line at $0 never prints an amount**, anywhere the client sees it. No setting; a rule.
- **"Show line prices"**, a switch (`src/components/Switch.tsx`, `.lv-switch`) at the bottom of
  the totals rail in both builders, default on, remembered in `localStorage` (`lw-line-prices`) so
  the next estimate opens the way he left the last. Off: the client's copy shows descriptions,
  then Total (tax, deposit and balance still show; subtotal and qty × rate do not). It carries
  through the preview, `/view-estimate`, `/view-invoice`, `/estimate/:id` and the invoice made
  from the estimate. The email only ever carried the total, so it needed nothing.

**The setting lives on the document, not in a column:** it is stamped as `hidePrice: true` on
every line item inside the existing `line_items` JSONB (`withLinePrices`), and read back as
"prices hidden if any line says so" (`linePricesShown`). No migration, the public link reads it
off the row, and converting to an invoice carries it for free. Every line-item whitelist has to
carry it — `cleanLineItem` in DataContext, the builder's own `cleanLineItem`, and both mappers in
InvoiceContext — or it vanishes on save, the same trap `sourceText` taught. The contractor always
sees every price on his own side; only the client's copy changes.

## Address, duplicate, and the card payment that never worked (Sep 16 2026)

Second round of feedback from the roofer who asked for the line-prices switch. Three things:

- **Client address on the document.** There is no address column on `estimates` or `invoices`
  and no way to run a migration from here, so it rides inside `line_items` exactly like
  `hidePrice`: `withClientAddress` / `clientAddressOf` in `src/lib/clientAddress.ts`, stamped on
  every line, read from the first line that has one. Every line-item whitelist carries
  `clientAddress` (DataContext, both InvoiceContext mappers, both builders' cleaners). It prints
  under the client on the preview, `/view-estimate`, `/view-invoice`, `/estimate/:id` and the
  invoice detail, converts to the invoice for free, and prefills from the client record.
- **Duplicate** on every estimate row (`handleDuplicate` in EstimatesList): opens the builder
  editable with the same lines, prices, tax and deposit, **no id, client, link or status**, so
  saving creates a new estimate. `EstimateBuilder` takes `duplicate` to skip the read-only
  preview it normally opens existing estimates in. Templates were considered and held: duplicate
  is what a roofer would use a template for.
- **Card payments on a public invoice were broken for everyone.** `InvoicePaymentForm` called a
  Supabase edge function `create-invoice-payment` that was never deployed (404), so every "Pay
  now" failed. Replaced by **`api/invoice-payment.js`** on Vercel (needs only the existing
  `STRIPE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`). Two actions: `create` makes a
  PaymentIntent **on the contractor's connected account** (`stripeAccount`, like recurring
  billing) for the amount the row says is due; `confirm` re-reads the intent from Stripe, marks
  the invoice paid / partially_paid and appends to `payment_history`, then stamps
  `metadata.recorded` on the intent so a retry never double-counts. The public page loads
  Stripe.js scoped to that account (`getStripePromiseForAccount`), because a connected-account
  secret cannot be confirmed with the platform instance. A contractor with no Stripe connected
  gets a plain "not taking card payments yet" line instead of a form. LevelWorks takes no fee.
  Not yet verified with a real card: needs a contractor with Stripe connected and a live invoice.

## Send after converting, and the Stripe connection that never saved (Sep 16 2026)

- **Convert to invoice now offers Send.** The converted invoice's action bar has Save (dark,
  saves and closes) and Send to client (blue, saves then opens `SendInvoiceModal`, the invoice
  twin of `SendEstimateModal`: email, text from his phone, copy link). Closing the modal closes
  the builder, so a second press can never create a second invoice.
- **Connecting Stripe ended on Stripe's success screen but the account id never reached the
  profile**, so the dashboard kept offering Set up payments. The Supabase edge function
  `connect-stripe-account` is no longer called. `api/stripe-connect.js` on Vercel does the
  exchange: identifies the user by **session token, never by `state`**, refuses the platform's
  own account, upserts `profiles.stripe_account_id`, reads it back before saying ok. The
  authorize URL lives once in `src/lib/stripeConnect.ts`; the redirect URI
  `https://levelworks.org/stripe-connect-callback` is registered with Stripe as written and the
  bare domain 307s to www with the query intact. Once connected the dashboard card turns green
  ("You take card payments", Open Stripe). Eric connected his own account this way, Sep 16.
- **Stripe requires two-step login on every full account (since 2024)**, which is what Eric hit.
  Contractors connect as Standard accounts today; switching new connections to **Express** would
  make onboarding a short Stripe-hosted form with a text code. Discussed, not built.

**Scheduled notes from Eric (Sep 16 2026).** `api/_lib/notes.js`: a one-off email to every
member with a `sendAt`; the daily cron (step 4a) sends any due note once per member, recorded in
auth `app_metadata.notes_sent`, and skips their tip that morning. English and Spanish by the
member's language, unsubscribe link and headers on every one. Preview without sending:
`/api/note-preview?which=stripeTutorial&lang=es`. First note: **stripeTutorial**, the card-payments
walkthrough (Eric's own Stripe run: basic info, last four of SSN or EIN, pick the bank, choose the
account, Connect; it failed once for him and the note says so), three screenshots in
`public/email/` rendered from the app's own CSS and strings, $49 P.S. Sends Sep 17 2026, 9am ET.
Adding a note: one entry in `NOTES`, both languages, a future `sendAt`.

## English and Spanish on the landing page (Sep 17 2026)

Eric: the Spanish work was never shown off; "it should be one of the first things you see, on
laptop or on the phone, at the top, maybe in english AND spanish". Now, on both `/` and `/es`:
a bilingual **English · Español** chip with the two SVG flags beside the price chip in the hero
(scrolls to `#spanish`), a fourth hero fine-print item, the third hero float is **"Sent in
Spanish / Written in English, translated in one tap"** (was "Viewed"; flipped on `/es`), a fifth
proof-strip item, a seventh feature tab (**`TranslateMock`**, the side-by-side review with prices
locked), and a full section `#spanish` between features and payments: copy left, **`TwoPhones`**
right, the same estimate in the page's language and the other (`EstimateDoc` takes `lang`;
`translateIn(lang)` in `src/i18n` pins a translator; `FlagUS`/`FlagMX` are exported). The pitch on
the English page is the English-speaking contractor with Spanish-speaking clients; on `/es` it is
flipped. No competitor claims. Under 560px the two phones are scaled inside 172px boxes because a
grid track grows to fit its content and clipped the headline; the translate card drops its
sub-lines under 980px. Checked at 390 and 1366 in both languages, no horizontal scroll.

## Quote Check (Sep 19–20 2026) — read `QUOTECHECK.md` first

A second product, live at `/quote-check`: a homeowner uploads a contractor's estimate and buys a
contractor's report for $79. Built, tested live and advertised on Meta in one day at Eric's
direction. **Everything about it is in `QUOTECHECK.md`**, including Eric's standing instruction
for that track: it is a money-first test, he decides, build what he asks and do not steer him back
to LevelWorks. Keep this file's LevelWorks notes and that file's Quote Check notes separate.

## Where everything stands at the end of Sep 16 2026 (read this first in a new session)

Eric has **applied for funding** and expects the reviewers to look at the product and the list
closely. Treat every visible detail as something a stranger with money will judge.

- **Shipped today, all live and verified on the site:** Send to client after converting an
  estimate to an invoice (`SendInvoiceModal`); the Stripe connection saved through
  `api/stripe-connect.js` on Vercel with the green "You take card payments" card (Eric's own
  account is connected); the scheduled-notes system with the Stripe tutorial going out
  **Sep 17, 9am ET** to every member. Check the Vercel log line `cron-annual {...}` for
  `notes.sent` that morning; a `notes.errors` entry names any address that failed.
- **Eric's concern about Stripe onboarding:** contractors connect as Standard accounts, so Stripe
  makes them create a full account with two-step login and identity checks. Eric: "its really
  gonna make people leave". The fix is **Stripe Express** for new connections (short Stripe-hosted
  form, text code, no dashboard): a new route creates the Express account and account link, the
  callback changes, existing connected contractors stay as they are. Discussed twice, agreed in
  principle, **not built**. It is the next thing he is likely to ask for.
- **Not yet proven with real money:** a card payment on a public invoice
  (`api/invoice-payment.js`). Suggested to Eric: send himself a test invoice, pay a dollar with a
  real card, refund it in Stripe. He has not done it. A funder may ask.
- **Next note** is one entry in `NOTES` (`api/_lib/notes.js`) with a future `sendAt`; the cron
  does the rest. Preview at `/api/note-preview?which=<key>&lang=en|es`. Eric never needs a secret.
- **Ads:** the Wednesday Sep 16 read of campaign `52548965992137` was not done in this session;
  nothing touched. Rules unchanged: leave it until Sep 21, judge by cost per sign-up.
- Row-level security on `estimates` / `invoices` / `clients` is still not enforcing (see the LW49
  section). With funding due diligence coming, this moves up the list.

## Estimate and invoice emails from the contractor, by name (Sep 18 2026)

The roofer's third round: the invoice email never said who sent it, "which makes it a challenge
to get them to click the link". The old path was the `send-email` edge function's fixed
`invoice_sent` / `estimate_sent` templates, which were never even given the company name.
**`api/send-document.js`** on Vercel (Resend) replaces both: sender **"<Company>" `<documents@levelworks.org>`** (was "via LevelWorks"; Eric,
Sep 18: "the less we use our name, and the more we use theirs the better"), subject "<Company> sent you an invoice for <project> ($x due)" /
"... an estimate for <project> ($x)", `reply_to` the contractor's business email (else his login
email), body = his company block (logo, phone, address), the amount and due date, one button to
`/view-invoice` or `/view-estimate`, in the contractor's language (`profiles.lang`). Auth by
session token; the row must be his; `to` from the send screen is allowed (he corrects addresses
there) and is written back to the row; `sent_at` is stamped and a draft estimate becomes `sent`.
Transactional, so no unsubscribe link, on purpose. `sendEstimateEmail` / `sendInvoiceEmail` in
`src/lib/edgeFunctions.ts` call it (signatures unchanged), and `SendEstimateModal` no longer
invokes the edge function directly. Verified live Sep 18 with the demo account's invoice and
estimate sent to Eric's Gmail (demo rows restored afterwards). The public invoice now closes on
**"Thank you for your business."** (`pg.pub.thanksInvoice`); the estimate keeps "thanks for
considering us". Still on the edge function: job updates and the fixed app mail.

**Next from the same customer, agreed with Eric for later Sep 18: ACH.** Stripe bank debit
(`us_bank_account`, 0.8% capped at $5) on `api/invoice-payment.js`: per-invoice choice of card,
bank, or both, bank-only allowed; Financial Connections for instant verification; the invoice
shows "payment pending" until it settles (~4 business days, webhook needed); the platform has to
enable the payment method once in the Stripe dashboard. **Later still: an AI phone-answering
add-on**, which the roofer already paid for elsewhere and lost; a separate paid product ($30-50
a month), prototype on a test number when Eric says go.

## Texting a client (no Twilio)

The estimate goes out from **the contractor's own phone**, not from a LevelWorks
number. On the Send screen's "Text it" path, `src/lib/smsLink.ts` opens his Messages
app with the client already addressed and the message written; he taps Send.

This is a deliberate decision, taken after pricing Twilio out:

- Twilio's A2P 10DLC registration is **per end customer** — each contractor needs his
  own brand and campaign, at roughly **$4 + $15 one-time and $2+/month each**, plus a
  number and per-message fees. On a $5/month plan that does not work.
- A single shared LevelWorks number would be cheap but is one-way in practice: replies
  need routing, and a STOP from one client blocks that number for every other
  contractor's messages to them.
- Sending from his own number costs nothing, needs no registration, and means the
  **client can reply normally** — it lands in the thread she already has with him.

Mechanics worth keeping: iOS wants `sms:<number>&body=`, Android wants `?body=`, so
`separator()` sniffs the platform (including iPadOS, which reports itself as a Mac with
touch). `canOpenMessagesApp()` gates the whole thing — on a laptop an `sms:` link
usually does nothing, so desktop keeps copy-the-link. The handoff uses a real anchor
click rather than `location.href`, which iOS Safari blocks for some schemes. A phone
number that is not a phone number normalizes to empty, which opens Messages with the
To field blank rather than with garbage in it.

**If automated sending is ever wanted** (a payment reminder at 9am while he is on a
roof), that is the one case for a shared LevelWorks number: one brand, one campaign,
one-way, with his own number printed in the message body for the client to call.

## Staying signed in, and adding the app to a phone (Sep 7 2026)

**Sign-in already persisted and still does.** `src/lib/supabase.ts` sets `persistSession: true`,
`storageKey: 'level-app-auth'`, `storage: localStorage`, `autoRefreshToken: true`, and nothing in
the app signs anyone out except the user's own Sign out and account deletion. The service worker
clears Cache Storage only, never localStorage. The one real defect was the **"Keep me signed in"
checkbox: it wrote `levelworks-remember-me` and nothing ever read it** — a control that did
nothing. It is gone, replaced by a line stating what actually happens. The remaining risk is
platform-level: iOS Safari caps script-writable storage for a site you only *visit* at about
seven days, which is exactly why installing to the home screen matters — an installed app is not
subject to it.

**One tap where the browser allows it, and nowhere else.** `src/lib/installPrompt.ts` captures
`beforeinstallprompt` **at module scope** (imported for its side effect from `main.tsx`) because
the event fires before React mounts; a listener inside a component misses it. On Android and
desktop Chrome "Add to phone" now installs in one tap with no dialog. **iOS has no equivalent API
and this is not a gap we can close** — Apple exposes no way to add to the home screen from script,
so the iPhone path is instructions or nothing. The dialog now shows only the platform it is on
(the two tabs are gone), warns when the visitor is in Chrome/Firefox/Edge on iOS where Add to Home
Screen does not exist at all, and the whole button hides once `isStandalone()` is true. Do not
"add" an iOS one-tap install later; if one ever appears it will be a new Safari API, not a trick.

## Spanish SEO: /es is a real page (Sep 7 2026)

The site is a Vite SPA — Vercel rewrites every URL to one `index.html` — so a Spanish *route*
would only ever have been a client-side state flip, with English HTML still going out to
crawlers and link previews. So `/es` is **prerendered at build time**: `src/entry-ssr.tsx`
renders the landing page through `react-dom/server` with `LanguageProvider initial="es"`, and
`scripts/prerender.mjs` (formerly `prerender-es.mjs`) takes the built `dist/index.html` (so the hashed asset links are
always current), swaps the head for Spanish, sets `lang="es"` and injects the markup into
`#root`. `npm run build` = client build → SSR build → prerender. The script throws if the
canonical, the hreflang trio, `og:locale` or the markup itself is missing, so it cannot ship a
silently English page. `vercel.json` maps `/es` to that file before the catch-all.

- **The URL decides the language, not localStorage.** `langFromPath()` in `src/i18n/index.tsx`
  means a shared `/es` link opens in Spanish on a phone that remembers English — otherwise the
  link is broken for exactly the people it is for. Conversely a Spanish reader who lands on `/`
  is sent to `/es`, so the URL, the head and `<html lang>` always agree.
- **The toggle navigates on the marketing homepage and only there.** Inside the app it stays a
  state change: throwing a contractor out of a half-written estimate would be worse than useless.
- **Search phrases, once each, in sentences a person would write**: "app para hacer estimados"
  (hero), "programa de estimados para contratistas" (features), "aplicación de facturas para
  contratistas" (payments), "software para contratistas en español" (closing). Everywhere else
  the product's word is still **presupuesto** — "estimado" is what they type into Google, not
  what an estimate is called on the document. Keep that split.
- `robots.txt` lives in **`public/`**; `sitemap.xml` is generated by `scripts/prerender.mjs`
  (see the guides section). Stale duplicates at the repo root were deleted because Vite never
  copied them.
- Only the English `index.html` is hand-maintained. Adding a page-specific `<meta>` to it
  affects every SPA route, which is why `/es` gets its head from the prerender script instead.

## Search pages: the guides and structured data (Sep 10 2026)

Eric asked what more could be done on search. A homepage never ranks for what a contractor types
("how to write an estimate", "cuánto anticipo pedir"), so the site now has **guides**: six long-form
pages, each in English and Spanish, prerendered at build time the same way `/es` is.

- **`src/guides/content.ts`** is the writing. One entry per guide, `en` and `es` side by side,
  each with its own slug (a translated URL ranks for the translated search). Interface strings for
  the guide pages live in `GUIDE_UI` in the same file, not in the dictionaries.
- **`src/pages/GuidePage.tsx`** renders the index and the article for both languages; the four
  routes come from `guideRoutes()`, used by `App.tsx` and the SSR entry so they cannot drift.
  The language comes from the URL, never from localStorage: `langFromPath` now returns `en` for
  `/guides` and `es` for anything under `/es/`. `LanguageToggle` takes `siblingHref` so the
  switcher on a guide goes to its translated twin.
- **`src/entry-ssr.tsx`** (was `entry-es.tsx`) renders the Spanish homepage and every guide;
  **`scripts/prerender.mjs`** (was `prerender-es.mjs`) writes them into `dist/`, adds each page's
  JSON-LD (Article + BreadcrumbList; SoftwareApplication + Organization on the homepages) and
  **generates `dist/sitemap.xml`**. `public/sitemap.xml` is gone; do not recreate it by hand.
  `vercel.json` maps `/guides`, `/guides/:slug`, `/es/guias`, `/es/guias/:slug` to those files.
- **`index.html`** carries the English SoftwareApplication and Organization JSON-LD ($5 a month,
  30 days free, nothing else) and points `og:image` at **`public/og.png`**, a real 1200×630
  preview card. It was the 180px app icon before, so a shared link showed a tiny logo. The card
  is rendered from an HTML file with Chromium; regenerate the same way if the offer changes.
- Adding a guide: one entry in `GUIDES`, both languages, `updated` date, done — routes, head,
  sitemap and hreflang follow. Descriptions over 165 characters get a build warning.
- **Facts in the guides are dated.** Deposit caps (California, Maryland, Massachusetts) and the
  code sources are stated "as of September 2026" with "check your state". If a contractor
  disputes one, fix the entry and bump `updated`.
- FAQ schema was left out on purpose: Google stopped showing FAQ rich results for ordinary sites
  in 2023.

**Still Eric's (ten minutes each):** verify the site in Google Search Console (a DNS record in
GoDaddy, same move as the email fix) and submit `https://levelworks.org/sitemap.xml`; a Google
Ads account if the YouTube test in `marketing/ads/youtube/PLAN.md` is to run. Google Business
Profile was considered and rejected: it needs a street address and suspends software companies.

## The weekly email and affiliates (Sep 10 2026) — decided, not built

Eric's ask: warm the list with useful weekly email (LevelWorks tips, real tools, codes), then
affiliate offers. Agreed shape: **once a week, same day, three items, the app tip first**; a
single sponsor block after the first item, filled with affiliate links until the list can be
sold (sponsors price per thousand readers; nothing sells under about 1,000). High-paying
affiliate categories for this audience are services, not tools: business insurance quotes,
business cards and banking, payroll, equipment financing and rental, fleet tracking. Tools pay
1 to 4 percent; vans and heavy equipment pay nothing. **Never buy a list**: Resend suspends the
account and Gmail punishes the whole domain. Eric said no to lead ads for now. Not built yet:
a newsletter audience separate from account mail, a state field on the profile for local code
links, the sponsor block template.

## Copy rules

Sentence case. Plain contractor language. No exclamation marks. Errors say what went wrong and how to
fix it. Never invent product claims — pricing is $5/month with a 30-day free trial, and that is the
only pricing that may appear anywhere.

## Standing context

- Landing page (`src/pages/LandingPage.tsx`) was rebuilt Sep 2026 in the register of Joist and Houzz
  Pro: light, product-led, with in-code product mockups rather than screenshots. Eric approved it and
  asked that the opening line say only "All of it for $5 a month" — **no competitor price in the
  hero.** The pricing section further down still compares against $19–$149 plans; he has not objected.
- No fake testimonials, customer counts or star ratings anywhere. When Eric has real ones, they can
  go in.
- Other repos in the same sessions: `ec-home-improvement` (ec-homes.com) and `ecwd1` (ecwd1.com),
  each with its own CLAUDE.md.

## The $49 annual launch (LW49), Sep 8–9 2026 — WHERE IT STANDS

Everything is built, live on levelworks.org, and verified with real money. Notes in
`marketing/ads/lw49/README.md` (operating rules), status in `marketing/ads/lw49/LAUNCH-CHECKLIST.md`.

**Decisions Eric made (do not reopen):** no $31 second-year offer; the counter shows real purchases
only, never seeded (CREW is the honest lever: 100% off, 15 uses, for contractors he knows); the third
feature word is **Recurring billing** (there is no scheduling in the app); the ad is his shop selfie
("My name is Eric, I'm a contractor, and I made an app called levelworks.org. Check it out.") then the
phone story, a 3s Spanish hold, "what LevelWorks is" (Unlimited estimates / Unlimited invoices /
Recurring billing, English · Español block), the offer; ~32s; approved. **Music (Sep 10):** "Close Up" (Mixkit 1167, free licence) under the phone story only, never under his voice, playing to the last frame; Eric picked it from six options and asked for it to run to the end. Rocky and the NFL themes are copyrighted and Meta mutes or rejects them; `build.py` takes `LW49_MUSIC` to swap the track. **Sharp cut (Sep 11):** Eric saw the Stories ad and the phone's text was blurry. Three lossy encodes each capped at 4MB (a limit Meta never had) plus Meta's transcode killed 11-15px UI text. Now base crf 16, final crf 18, Meta copy crf 20 (5-7MB), and the 9:16 phone is scale 2.05 with its height trimmed so the bottom stays clear of the Stories UI. Never cap these files at 4MB again. Ads recreated (ids in the checklist), old ones deleted. $200 is a cost-per-purchase
test; 175 purchases is the goal for the scaled run.

**The flow after paying** (Eric's design): `/annual/success` confirms the session with Stripe,
fulfils the purchase itself (`fulfilSession` in `api/_lib/annual.js`, idempotent with the webhook via
the unique `stripe_session_id`), then a brand-new buyer picks a password on that screen and lands in
the app with a four-step tour (`src/components/Tour.tsx`, `/app?tour=1`, once); an existing account
is told the year is on it and signs in as usual. "Brand new" is judged by creation time and never
having signed in, because Supabase's `generateLink` creates a missing user on the fly with no
metadata (that mistake shipped once and was caught by the $0 test).

**Ids.** Stripe live: product `prod_VDyfIRzZOz2Dfz`, price `price_1UDWi6CrlMKmuUj4z7Whuzoh`, webhook
`we_1UDX36CrlMKmuUj4vyfcsWwm` → `https://www.levelworks.org/api/stripe-annual-webhook` (**www**: the
bare domain 307-redirects and Stripe does not follow redirects; the first purchase bounced on that),
promo `CREW`. Meta: campaign `52547713746537` (ACTIVE since Sep 9), ad sets `52547713777737` EN / `52547713784537`
ES, six ads (ids in the checklist; recreated Sep 10 with the music cut, the originals deleted, because the bot token can upload videos but cannot create a creative that names the Page, so new ads go through Windsor `create_ad`), old campaign `Level-Works-Signups-Test1` paused. Vercel env vars
all verified by fingerprint (`/api/annual-env-check?key=<CRON_SECRET>`); copying a secret out of the
chat window corrupted one character twice, a plain text file fixed it.

**LIVE since Sep 9 2026, 6:28pm PT (Eric: "we can roll").** Campaign `52547713746537`, ad sets
`52547713777737` EN / `52547713784537` ES and all six ads ACTIVE, approved, first cents spent at the
one-hour check. Schedule is Sep 9 3pm PT through **Sep 16 6:30pm PT** (Meta would not let the start
move once it was in the past; `+` in a Graph timestamp must be URL-encoded or it reads as a space),
$200 lifetime, CBO. Rules for the week are in `marketing/ads/lw49/README.md`: nothing touched for the
first 48h, then read cost per purchase.

**Switched to landing-page-view optimisation, Sep 11 6:50am PT (Eric: "do it now").** Day 1.5 read:
$63.54, 646 reached, 24 link clicks, 19 landing page views, 0 purchases, CPM ~$79: Meta was bidding
for purchases on a pixel with no purchase history. The change cannot be made inside a CBO campaign
(error 1885760, "duplicate the campaign"), so the live campaign is now **`52548403713537`
LW49-Annual-Launch-Sep2026-LPV** (OUTCOME_TRAFFIC, lifetime $136.46 = the unspent remainder, CBO),
ad sets **`52548403738937` LW49-EN-LPV / `52548403747337` LW49-ES-LPV** (LANDING_PAGE_VIEWS, same
targeting, no promoted_object and no attribution_spec: Meta rejects both for this goal, and the
`+` in timestamps must be URL-encoded), six ads reusing the sharp creatives by `creative_id`
(EN estimate `52548403760537`, invoice `52548403763737`, recurring `52548403770737`; ES estimate
`52548403783737`, invoice `52548403790137`, recurring `52548403801937`). **The LPV campaign never delivered**: nine hours after activation, everything ACTIVE and approved,
zero impressions, `delivery_estimate` reporting `estimate_dau: 0`. So at 4pm PT Sep 11 the original
campaign `52547713746537` was switched back ON (its $136.46 remaining budget is still there) so the
evening was not lost; the LPV campaign was still at zero on Sep 12 morning and is now PAUSED; stop chasing it.
The purchase-optimised campaign is the one running. Do not
delete either campaign. Runs to Sep 16 6:30pm PT.

**Second run live, Sep 12 ~2pm PT (Eric: "I love it").** The "ripped off" ad (`ripoff.html`, 24s,
text and music, cut 2) is on the original campaign as two ads, one per ad set: EN `52548598910537`
in `52547713777737`, ES `52548598938537` in `52547713784537`, each carrying feed 1:1 and Stories
9:16 by placement. The six phone-story ads are PAUSED, not deleted. Primary text leads with the
same line ("If you're paying more than $5 a month for estimates, you're getting ripped off"),
headline "Estimates and invoices for $5 a month", link `/annual?...utm_content=rippedoff`. Next run:
Eric on camera saying the opening line (he is away with family this weekend; ask for a 10s clip).

**The feed was never served, and this is the biggest finding of the launch (Sep 12, 6pm PT).** Eric
sent a screenshot of the Ads Manager app: "Ad Asset Feed Invalid Target Rule Count For Format: 0
target rules for MOBILE_FEED_STANDARD, exactly 1 expected". The placement breakdown confirmed it:
**every impression since Sep 9, on every ad, was Reels or Stories; zero in the Facebook or
Instagram feed.** The square video's rule had no positions listed (meant as a catch-all) and Meta
matched nothing to the feed, so it skipped the feed and bought only the most expensive placements
(CPM ~$79). Fixed by giving the square rule explicit positions: facebook `feed, video_feeds,
marketplace, search, instream_video`, instagram `stream, explore, explore_home, profile_feed,
ig_search`, messenger `messenger_home`, audience_network `classic, rewarded_video`; the tall rule
keeps `story, facebook_reels` / `story, reels` / messenger `story`. Live ads are now EN
`52548679697337` and ES `52548679701337` (v2); the v1 pair is paused. **Every rule in an
`asset_customization_rules` list must name positions; a rule without positions is not a
catch-all.** Read the placement breakdown (`breakdowns=publisher_platform,platform_position`)
before believing any CPM.

**Member note sent, Sep 14 2026 ~4am PT (Eric: "looks great, send it").** A thank-you from Eric to
every account: what the app does, "what would make you use it every day?", reply to answer, P.S.
with the $49 year and a "reply stop" opt-out. 48 of 48 delivered (Eric's two addresses got the test
copies first). It goes through **`POST /api/annual-broadcast`** with the CRON_SECRET bearer
(`{"mode":"dry"|"test"|"send"}`), which runs on Vercel where `RESEND_API_KEY` lives, so it is from
"Eric at LevelWorks" with replies to ejc1273@gmail.com. Copy and recipient logic in
`api/_lib/broadcast.js`. **The `send-email` edge function only accepts fixed templates
(`templateType`) and cannot carry a free-form message**; `sendMail`'s edge fallback would fail for
any custom note, so the Vercel key is required for these. Anyone who replies "stop" must be
skipped by hand next time: add them to `SKIP` in broadcast.js. Do not resend this note.

**Sep 14 2026: cut 3, and the money moved to a sign-up campaign (Eric: "run it the best way you think", "act as if this is your business").** The ripped-off ad now has the app running behind the words (an estimate, an invoice, recurring billing, dimmed under a veil, filling the tall version too); v3 ads on the old campaign are EN `52548965703337` / ES `52548965752537`, v2 paused. Then the read that decides everything: the June campaign bid for **sign-ups** (`COMPLETE_REGISTRATION`) and got 13 at ~$24 each on $315; the September one bid for **purchases** on a pixel with none and got 0 on $151. So the old campaign `52547713746537` is PAUSED (not deleted, ~$15 unspent) and the live one is **`52548965992137` LW-Signups-Sep2026-Broad**: OUTCOME_SALES, CBO **$12/day**, lowest cost, ad sets `52548966017337` EN (locales en) / `52548966037937` ES (locales es), both `OFFSITE_CONVERSIONS` on `COMPLETE_REGISTRATION`, US 25-60, Advantage+ audience, **no interest targeting** (the ad's first two seconds filter for contractors better than Meta's lists; audience estimates 167-197M / 34-40M), ads `52548966081137` / `52548966118937` reusing the v3 creatives by id (`1699073781182047` / `1104760702419012`, link utm_content=rippedoff3). Rules: **nothing touched for seven days** (every edit restarts learning), judge by cost per sign-up with the placement breakdown (under $10 working, over $20 change the ad not the budget), the $49 year closes on the page and in the app. Eric added $100 of prepaid funds and will top up; prepaid means delivery simply stops when it runs out. Next creative: Eric on camera for the first ten seconds. The Ads Manager "set up a pixel" card is about the optimised event having no history; it should clear now that the event is sign-ups. Retargeting (June + September clickers) is ~250 people, too small for Meta to deliver; revisit when it passes ~1,000. The `degrees_of_freedom_spec` must list every feature individually; `standard_enhancements` is rejected as deprecated.

**Unsubscribe on every marketing email (Sep 14 2026, Eric: "make sure there is an unsubscribe
button at the bottom of all of our email").** The member note had only "reply stop". Now every
marketing mail carries a real link and the `List-Unsubscribe` / `List-Unsubscribe-Post` headers,
which is what makes Gmail and Apple Mail show their own Unsubscribe button at the top. The link is
`/api/unsubscribe?e=<base64url email>&t=<hmac>&l=<lang>` (`unsubscribeUrl` in `annual.js`, signed
with `CRON_SECRET`), no login; it marks the contact `unsubscribed` in **both Resend audiences**,
creating the contact if needed, and every sender reads that set before mailing:
`recipients()` in broadcast.js, the nudges in cron-annual.js (`unsubscribedEmails()` in
audience.js), and Resend itself for dashboard broadcasts. `layout({ unsubscribe: true })` prints
the placeholder; `sendMail({ unsubscribe: lang })` fills it per recipient and adds the headers.
Marketing = the note, nudge1/3/7, day30, trialOffer, blasts. **Transactional mail (login link,
receipt, an estimate to a client) deliberately has no unsubscribe link**; do not add one.

**The feature tips (Sep 14 2026, Eric: "an email every other morning with a very simple, but
detailed instruction on how to use a particular feature").** `api/_lib/tips.js`: eight tips so
far (first estimate, send and sign, invoice and card payment, one total, logo, photo updates,
Spanish and translate, recurring billing), English and Spanish, numbered steps using the app's
exact button labels (taken from the dictionaries, not from memory; two claims were corrected
against the code before shipping: signing does **not** email the contractor, and recurring
billing takes the card on the contractor's phone, not by a link to the client). Sent by the
daily cron (step 4b): the next tip to anyone whose last was 40+ hours ago, so every other
morning per member, everyone from tip 1 at their own pace, progress in auth
`app_metadata.tip_stage` / `tip_at` (no migration). Skips unsubscribed members, anyone nudged
in the same run, and `@levelworks.org`; stops at the end of the list. **Adding a tip: append
to `TIPS`, both languages, never reorder.** Test one to Eric with
`POST /api/annual-broadcast {"mode":"tiptest","n":3}`. First send: Sep 15 2026, 9am ET, ~50
members. Eric wants to work later on "additional value for all of our subscribers" (not
started).

**Sep 17 2026: Spanish paused, English runs alone (Eric: "just pause the spanish, i can't waste any
money", then "let it run as is").** The read that forced it: in the old campaign (Sep 9-13) English
spent $91 for 28 clicks and 2 attributed sign-ups, Spanish $60 for 16 clicks and 1. In the new CBO
campaign Meta gave English **$1.75 in four days** and Spanish $47 for 20 clicks and 0 sign-ups: shared
budget chased the cheaper Spanish Reels views and starved the set that converted. Eric spotted it
("when the english ads got scaled down so did the action"). Ad set `52548966037937` (ES) is PAUSED;
`52548966017337` (EN) runs alone on the full $12/day. Member count 54, unchanged since Sep 15. Monday
Sep 21 read is scheduled in this session. **Lesson: never put the two languages under one shared
budget again**; if Spanish comes back it gets its own campaign with its own budget.

**Where everything stands at the end of Sep 14 2026 (read this first in a new session).**

- **Live campaign:** `52548965992137` LW-Signups-Sep2026-Broad, $12/day, bidding for free-trial
  sign-ups, cut-3 ads EN `52548966081137` / ES `52548966118937`. First day: ~$7, 78 reached, 5
  clicks, Meta leaning Spanish (9 dollars in 10), feed and Reels splitting views. **Do not touch
  until Sep 21.** Eric expects a proper two-day read on **Wednesday Sep 16 morning**: cost per
  sign-up, placement mix, runway. Under $10 a sign-up is working; over $20, change the ad, not the
  budget. Funds ~$130 after Eric's $100 top-up. Check-ins were scheduled inside the old session
  (send_later) and will not reach a new one; schedule fresh.
- **The ad landing page** (`/annual`, `/es/annual`) was reworked Sep 14 evening (Eric: "crazy
  easy for people to sign up"): one ask, "Start free — no card needed", the sign-up form opens on
  the page itself with **two fields** (email, password; name and confirm removed in
  `AuthModal.tsx`, the welcome screen asks for the business), the $5 and $49 options under "After
  your free 30 days", Eric's "Why $49?" note moved up. Baseline before the change: about one in
  seven page loads signed up. Next lever if trials climb: "Continue with Google" (needs Eric to
  create a Google OAuth client; not done).
- **Line prices switch** shipped (see its section). **Eric still owes the customer a reply**: it
  is in the app; ask them for a testimonial once they've used it.
- **Feature tips** start Sep 15, 9am ET (see the tips note). Eric got tip 1 as a test copy
  Sep 14 evening; no feedback yet.
- **Unsubscribe** on every marketing mail (see its note). Anyone who replied "stop" to the Sep 14
  member note must be added to `SKIP` in broadcast.js by hand; none seen yet.
- **Discussed, not started (Eric: "just curious", do only when he asks):** upload a public-records
  list of local licensed contractors to Meta as a custom audience + lookalike (cheap, no spam
  risk); ten hand-sent contractor-to-contractor emails a day from Eric's own address (never
  automated, never from levelworks.org in bulk); a tip email about the referral program already in
  the app. **No cold email from the domain, ever, and no meetings for a $5 product.** Eric also
  wants, "when I have time", to work on additional value for all subscribers (not started).
- Eric may share social posts to get an opinion; read them (the twitter oembed / syndication
  endpoints work through the proxy) and answer plainly. Next creative for the ads: ten seconds of
  Eric on camera saying the ripped-off line.

**Observers on the list (Sep 18 2026).** Eric asked to add `info@broadstreetangels.com` (the
funding application) to the email list and "send them one each day to catch them up". They are an
auth user with `app_metadata.observer: true` (created with the service key, email confirmed, no
password, no welcome mail), so every sender that walks `auth.users` includes them: the scheduled
notes send any due note on the next run, the tips walk from tip 1 **one a day** while an observer is
behind the members (`CATCHUP_HOURS` in tips.js), then every other day like everyone; the audience
sync puts them in the Resend audience for dashboard broadcasts. **Observers never get nudges**
(cron-annual skips them) and are not contractors: exclude `app_metadata.observer` from any member
count. The Sep 14 member note was sent to them by hand via `POST /api/annual-broadcast
{"mode":"one","to":"…","lang":"en"}`. Catch-up order for them: member note (Sep 18), Stripe
tutorial (Sep 19 9am), tip 1 (Sep 20), tip 2 (Sep 21), then level with everyone.

**Where the campaign actually lives, because it cost an hour:** the ad account `3071713068446` is
owned by Eric's business portfolio **"What's Next"** (`1245227667768739`). His personal login also
has an empty personal ad account `2227206028141508`, and Ads Manager opens on that one by default,
showing "Get set up to run ads" and a $100 limit that belong to it, not to ours. The link that works:
`https://adsmanager.facebook.com/adsmanager/manage/campaigns?global_scope_id=1245227667768739&business_id=1245227667768739&act=3071713068446`.
Billing for the right account: `https://business.facebook.com/billing_hub/payment_settings?asset_id=3071713068446&business_id=1245227667768739`.
On it: MasterCard ····3292, **prepaid funds** (Eric added $200 on Sep 9), a leftover $34.16 bill from
the June campaign that Meta settles out of the funds (so ~$166 for ads unless he tops up $35, which
was offered and left to him), and the $100/month account spending limit, which he was told to
remove (`spend_cap` read 0 afterwards, so it is gone).

**The pixel** (`2017000758930909`, "LevelWorks Web Pixel") is on the site, fires, and both ad sets
optimise for Purchase on it. Meta's "set up a pixel, 14% lower cost" card shows because there are no
Purchase events yet; it clears itself. The June campaign `52532618280737` (paused) spent $315 and got
13 sign-ups on the same pixel; that history is on the pixel and the account and Advantage+ uses it.
A retargeting audience of its 194 clickers is worth $20 to $30 **after** this week, not now.

**Checking on it from a new session.** The Meta bot token and every other secret lived in the old
session's scratchpad `.env`, which is gone. Ask Eric by name for what is needed (Meta system-user
token for `levelworksadbot`, or use Windsor's `facebook` connector, account `3071713068446`, which
needs no token). Read: campaign/ad set/ad `effective_status` and `ad_review_feedback`, insights
(impressions, reach, spend, link clicks, purchases), `act_…?fields=balance,amount_spent,spend_cap`,
and `https://www.levelworks.org/api/annual-count` (real purchases; 0 at go-live). The Graph token
can read all of that and delete ads, but **cannot create a creative that names the Page** ("No
permission to access this profile"): new ads go through Windsor `create_ad` with the full
`creative` spec (`asset_feed_spec` videos use `thumbnail_url`, not `image_url`). A morning check-in
was scheduled for Sep 10 9am PT inside the old session only; it will not reach a new one.

**Still Eric's:** confirm levelworks.org is Verified under Business Settings → Brand Safety →
Domains (the bot token cannot read it); glance at Events Manager once for the three events.

**Separate, important:** row-level security is not enforcing on `estimates` (and likely `invoices`,
`clients`): any logged-in user can read every user's rows. Needs its own fix after the launch. The
demo account `demo.lw49@levelworks.org` exists in production for screenshots
(`node scripts/lw49-demo.mjs delete` removes it).

## Email list and blasts through Resend (Sep 10 2026) — WHERE IT STANDS

Eric asked how to email everyone who ever signed up. Built and live the same day, first blast sent.

**How it works.** `api/_lib/audience.js` keeps two Resend audiences in step with `auth.users`:
"LevelWorks users · English" and "LevelWorks users · Español", by `profiles.lang` then sign-up
metadata. `@levelworks.org` (demo, test) is skipped; a contact Resend already has is never touched,
so an unsubscribe sticks. `api/_lib/broadcasts.js` turns copy in `EMAILS` (`api/_lib/emails.js`)
into one Resend broadcast per language, named `<which> · <lang>`; **the name is the lock**, nothing
is created or sent twice. The daily cron (`/api/cron-annual`, 13:00 UTC = 9am ET) syncs the
audiences, **drafts** each broadcast listed in `BROADCASTS`, and turns on open/click tracking for
the domain. Eric then opens Resend → Broadcasts, reads the draft, presses Send. That is the whole
flow and it is the one he understands: **no secret, no URL, just the Resend dashboard.**

- `GET /api/audience-status` is **public, read-only, counts and names only** (Resend key present,
  contacts per audience, broadcasts with status, domain tracking flags). It exists because Eric
  **cannot copy and paste secrets** and this session holds none. Read it before saying anything is
  wrong. `/api/sync-audience?key=` and `/api/blast?key=&which=&send=1` exist but need `CRON_SECRET`.
- **To run the cron now** (no secret): Vercel → project → Settings → Cron Jobs → **Run** next to
  `/api/cron-annual`. Eric knows this move now. The run prints its report as a `console.log` line in
  Vercel logs (`cron-annual {...}`), so it can be read in the dashboard.
- **The red `DEP0169 url.parse()` line in Vercel logs on every cron run is Node noise, not an
  error.** It counts under the "Error" filter. Silence it some time; do not chase it as a failure.
- **What shipped Sep 10:** `RESEND_API_KEY` was **not** in Vercel until Eric added it that morning
  (the "optional" note in the checklist was misleading; the fallback mail path is a Supabase
  function that does not exist, so every nudge had been failing with a 400). After the key:
  English audience 45 contacts, `annualBlast · en` **sent 10:24am ET to 45**, subject "You hear
  about the deals first. A year for $49", link tagged `utm_campaign=lw49&utm_content=blast1`. No
  Spanish audience yet because no user has `lang=es`; it creates itself when one does. Domain
  `levelworks.org` verified, open + click tracking on (applies to sends after 10:27am ET, so the
  first blast shows delivered/bounced only).
- **Copy rules Eric set:** open with "Thank you for signing up for levelworks.org. As a member, you
  hear about the deals first…". Footer carries **his email, not a street address**: the address is
  his home and he will not print it. US law wants a postal address on marketing mail; a PO box would
  satisfy it. Raised once, his call, do not nag.
- **Nudges** (`cron-annual`) now go only to accounts created on or after Sep 9 2026 and never to
  `@levelworks.org`. A March sign-up getting "a week in and no estimate yet" was wrong.
- **Next blast:** add an entry to `EMAILS` (en + es, no arguments) and its key to `BROADCASTS`;
  the next cron drafts it; Eric sends. Measure by clicks in Resend and by `utm_content` on the
  Stripe session, never by opens (Apple Mail inflates them).

**LW49 ads, morning of Sep 10** (Windsor `facebook`, account `3071713068446`): all ACTIVE, ~$14 of
$200 spent in the first 18h, ~230 reach, 5 link clicks, 0 purchases, spend cap 0, CBO leaning to the
Spanish set early. Normal. Nothing to touch before Friday evening (48h rule). The two Supabase users
created Sep 8 (`…in@getapservices.com`, `y.m.moore@gmail.com`) are organic sign-ups from before the
ads went live, not ad results.

**Deliverability, Sep 10 (afternoon).** The first blast went to Eric's own Gmail spam with the
button dead (Gmail disables links inside the spam folder). Cause was DNS, not the copy: the Resend
SPF record had been pasted under `resend._domainkey` instead of `send`, so `send.levelworks.org`
had no SPF and the DKIM selector carried a stray second TXT; with `_dmarc` at `p=quarantine` that
is a guaranteed spam folder. Eric fixed both records in GoDaddy the same day (TXT `send` =
`v=spf1 include:amazonses.com ~all`; the stray one deleted), verified from here by DNS lookup.
Broadcasts now also carry a plain-text part (`toText` in `broadcasts.js`). **Write off the Sep 10
blast as a cold start** and send a second one with a fresh opening a few days later, as a new
`EMAILS` entry (the name lock will not resend the first). Check `_dmarc`, `send` and
`resend._domainkey` with a DNS lookup before any future blast; `dig` is not installed here,
`node -e "require('node:dns').promises.resolveTxt(...)"` works.
