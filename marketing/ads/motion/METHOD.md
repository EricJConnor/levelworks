# How we make a LevelWorks video — the house method

Trimmed from the X prompt (`PROMPT-ORIGINAL.md`) to the parts that did the work on the first
video (Sep 30 2026). Use this as the prompt for the next one. Everything here is a lesson paid
for once; the ledger in `out/CRITIC-LEDGER.md` shows why each rule exists.

## 1. Before anything is drawn

- **Facts file first.** `FACTS.md`: the only source for any number, name or claim on screen.
  Pricing is $5 a month, 30 days free, no card. Money timing is "straight to your bank through
  Stripe", never "instant". No counts, ratings, competitor prices, invented people or results.
  The sample estimate is fictional and says so. A real business gets its name only: never invent
  a phone number or address for it.
- **Brief, then storyboard.** Who is watching (a contractor, on a phone, sound off), what they
  should do (start free at levelworks.org), sizes (1:1 first, it is what the feed ad set serves;
  9:16 and 16:9 after). One table: time, what is on screen, why, how it leaves, and **which
  object carries into the next shot**. 12 to 15 compositions per 30 s, 1.4 to 3.5 s each.
- **One carried object.** The document: born as the estimate, signed, flipped into the invoice,
  paid, shrunk into the $5 chip. It is what makes it one film and not a slideshow.
- **Three signature moments** you can describe without effect names. Build those first.
- **Frame one is a finished picture.** Never a word halfway in.
- **Cuts on the beat.** Measure the music's tempo (`ffmpeg` to raw PCM, autocorrelate the onset
  envelope; the command is in `src/audio.sh`) and snap every cut to the grid.

## 2. Build

- One HTML page, every element positioned by `render(t)` from a single time value. No CSS
  animation, no transitions, no timers, no randomness. Any frame renders the same every time.
- The phone is a **crop, not a device on a shelf**: each beat frames a different part of the
  screen (push in on the pricing, pull back and tilt for the client, push in on the pay). Line
  text must be 16 px or more at 1080 or it is 4 px on a phone feed.
- **The frame never stops.** A slow push-in inside every shot, a float on the phone, a drifting
  glow, tap ripples, a counter, a caret. The first render had 14 s of still frame out of 30 and
  looked fine on a contact sheet. The number caught it; the eye did not.
- Things land slowly enough to read and leave fast. Nothing linear.
- **The numbers on screen must always add up.** Tie every displayed amount to the same progress
  value as the thing that creates it.
- Done states in full colour. A white tap-fill left on a button reads as disabled.
- **Local fonts, and assert them.** The renderer refuses to run unless Inter reports loaded.
  Round one shipped in DejaVu because a copied `inter.css` pointed at Google's servers.
- Render a 5 s test before the real thing.

## 3. Sound

- "Close Up" (Mixkit 1167) under everything at about -20 LUFS, one soft whoosh per cut, a click
  per on-screen tap, both synthesized (`src/audio.sh`), effects peaking under the music.
- Always export a music-only version and a silent one.

## 4. The critic loop (the part that mattered most)

The builder never judges its own work.

1. After each full render, run `src/critic.sh <mp4>`: a contact sheet every 0.2 s, a dense
   sheet around every cut, frozen time (`freezedetect`, 0.5 s), loudness (`ebur128`).
2. Send the sheets, the storyboard and the facts file to a **fresh reviewer that has seen none
   of the building** (a new subagent with no context). Never tell it what you think you fixed.
   Ask for a ranked list with timestamps and a concrete fix each, and a verdict: ship or one
   more pass.
3. Fix the biggest problem first, render again, send to a **new** critic that checks every
   previous item as fixed / partly / still, then hunts for what broke.
4. Keep the ledger: what was found, what changed, the numbers before and after.
5. Expect four rounds. Round one found the font, an invented phone number and a wrong total.
   Round three found the invoice flashing back to unpaid for a quarter second. None were visible
   to the person who built it.

## 5. Quality bar, measured

- Frozen screen: about 1 s per 30 s at most, no still longer than about half a second (the end
  card is the one allowed hold).
- Frame one complete. Text 4.5:1 contrast. Nothing collides with or flies through other text.
- Loudness steady, no clipping, effects never louder than the music.
- A first-time viewer understands it with the sound off.
- Every claim on screen is in the facts file.
- 9:16: keep content inside y 250 to 1650; the platform's own overlays live outside that.

## 6. Deliver

Final mp4s at 1080p 60 fps, crf 20 (5 to 9 MB; never cap at 4 MB, it blurs UI text), a
music-only version, a contact sheet, the ledger, and a short note on what a human should still
check. Then it is Eric's call whether it runs. Read `marketing/PREFLIGHT.md` before it does.

## What to skip from the original prompt

The 3D section (nothing in this product is physical), the external kit (unreachable from here and
not needed), generated footage (we build every shot in code). Anything that makes the process
longer without producing a measurement or a fresh pair of eyes.

## Next time, with Eric on camera

The one thing this video lacks is the thing every ad note since June says works: ten seconds of
Eric saying the opening line. When the clip arrives: it goes first, the animated story follows,
the music never plays under his voice (his rule from LW49), and the facts file gains one line for
whatever he says on camera.
