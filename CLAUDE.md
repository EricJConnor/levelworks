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
crawlers and link previews. So `/es` is **prerendered at build time**: `src/entry-es.tsx`
renders the landing page through `react-dom/server` with `LanguageProvider initial="es"`, and
`scripts/prerender-es.mjs` takes the built `dist/index.html` (so the hashed asset links are
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
- `robots.txt` and `sitemap.xml` live in **`public/`**; stale duplicates at the repo root were
  deleted because Vite never copied them and editing them would have done nothing.
- Only the English `index.html` is hand-maintained. Adding a page-specific `<meta>` to it
  affects every SPA route, which is why `/es` gets its head from the prerender script instead.

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

Eric's brief: sell "a year of LevelWorks for $49" with $200 of Meta ads, English and Spanish.
Everything is built and **merged to `main`, live on levelworks.org** (PRs #27, #28). Full
operating notes in `marketing/ads/lw49/README.md`, status table in
`marketing/ads/lw49/LAUNCH-CHECKLIST.md`. Read both before touching anything.

**Decisions Eric made (do not reopen):** no $31 second-year offer; the counter shows real
purchases only (never seeded; the honest lever is the CREW promo code for contractors he knows,
which still has to be created in Stripe by hand since this environment was blocked from creating a
100% coupon); the third feature word is **Recurring billing**, not Scheduling (the app has no
scheduling); the ad is Concept A, "the ad is his phone" (the 9:47pm text, the estimate building
itself, the reply, the signature), then a 3s Spanish hold, then "what LevelWorks is", then the
offer, 26s, `levelworks.org` on screen throughout, bottom band clear for Facebook's button. He
said "much better" to the final cut; explicit upload approval still pending. Budget is a $200 test
of cost-per-purchase; 175 purchases is the goal for the scaled run, not for $200.

**What exists.** Stripe (live mode): product `prod_VDyfIRzZOz2Dfz`, price
`price_1UDWi6CrlMKmuUj4z7Whuzoh`, webhook endpoint `we_1UDX36CrlMKmuUj4vyfcsWwm` →
`https://levelworks.org/api/stripe-annual-webhook`. Supabase: `supabase/sql/annual_launch.sql`
has been run in production (counter RPC answers 0). Meta: campaign `52547713746537`
`LW49-Annual-Launch-Sep2026` PAUSED, $200 lifetime, ad sets `LW49-EN` `52547713777737` and
`LW49-ES` `52547713784537` PAUSED, Purchase-optimised on pixel 2017000758930909; **no ads
created yet**. The twelve videos are at `https://levelworks.org/marketing/ads/lw49/…mp4` (public,
so Meta can fetch them). Facebook page id 1109311048926616 (LevelWorks.org); the bot token cannot
read the page, so ads go through Windsor (`create_ad_video` + `create_ad` with a creative spec)
or Eric assigns the page to the levelworksadbot system user.

**Vercel env vars** (Eric pasted them Sep 8): `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ANNUAL_49`,
`STRIPE_ANNUAL_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `META_CAPI_TOKEN`, `CRON_SECRET`.
`/api/annual-env-check?key=<CRON_SECRET>` fingerprints them without revealing them. **As of
bedtime Sep 8 the two Stripe values carry a non-ASCII character and Stripe rejects them**
(checkout answers "connection to Stripe"); Eric was asked to clear and re-paste both and
redeploy. Correct fingerprints: STRIPE_SECRET_KEY `330931fa` (107 chars),
STRIPE_ANNUAL_WEBHOOK_SECRET `c331559a` (38 chars). The other four already match.
Secrets themselves are not in the repo; Eric has them (they were exchanged in the Sep 8 chat;
the webhook secret can be rotated from the Stripe endpoint if lost).

**Gotchas learned.** levelworks.org 307-redirects, so `curl -L` drops the Authorization header:
test the cron with the query-param check endpoint or hit the final host directly. Vercel preview
deployments are behind Vercel Authentication, so nothing external can reach a preview; that is
why the branch was merged before the purchase test. The auto-mode classifier blocks reading
customer rows with the service key and blocked creating a 100% coupon; verify database state
through the anon RPC, a test login, or ask Eric. `pkill -f render.mjs` kills the shell that runs
it (exit 144); kill by pid.

**Next, in order.** (1) Eric re-pastes the two Stripe values, redeploys; confirm with the env
check, then `POST /api/annual-checkout` must return a Stripe URL. (2) Eric buys a year on his own
card from levelworks.org/annual; confirm the account, plan, `annual_claimed_count()` = 1, the
welcome email; refund from the Stripe dashboard, confirm the counter drops to 0. (3) Pixel test
with `META_TEST_EVENT_CODE`. (4) Upload the six videos and create six ads (paused) under the two
ad sets: 1:1 on feed, 9:16 on Stories/Reels, copy in the README. (5) Lighthouse on the live
page, sold-out test, domain verification check. (6) Hand Eric the switch list: campaign →
ACTIVE, reset its dates to the day he flips it. Eric has not yet answered whether to pause the
old campaign `Level-Works-Signups-Test1` ($10/day, still running).

**Separate, important:** row-level security is not enforcing on `estimates` (and likely
`invoices`, `clients`): any logged-in user can read every user's rows. Found while screenshotting.
Needs its own fix after the launch (enable RLS with per-user policies plus a policy for the
public view-by-token pages). The demo account `demo.lw49@levelworks.org` exists in production for
screenshots (`node scripts/lw49-demo.mjs delete` removes it).
