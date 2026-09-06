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
- **`<LanguageToggle />`** shows EN | ES with both words always visible, so a Spanish
  speaker can find it without reading English first. It sits in the app header, the phone
  sheet, and the landing header. The choice is stored in `localStorage` under `lw-lang`
  and read synchronously in the provider's `useState` initializer, so the first paint is
  already in the right language. First-time visitors get their browser's language.
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

**Still open:** the four `Public*View.tsx` pages are what the *client* sees. They
translate, but follow the viewer's own browser setting, not the contractor's. Whether a
client link should carry the sender's language is a product decision Eric has not made.

**One caveat to keep in mind:** the Spanish was written by Claude, not a native
speaker in the trades. It is good, and every word sits in one file per area so any
single term is a one-line fix. When a real Spanish-speaking contractor uses it, ask
which words they would have said differently.

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
