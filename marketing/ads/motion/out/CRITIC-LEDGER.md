# Critic ledger — LevelWorks motion video (Sep 30 2026)

The builder never judges its own work. Each round: render, measure (`src/critic.sh`), send the
sheets and the brief to a fresh critic that has seen none of the building, fix the biggest
problem first, render again.

## Round 1 — first full render (all three sizes)

**Measured before the critic**
- Loudness: -19.7 LUFS integrated, peak -4.7 dBFS, LRA 1.7 LU (target: steady and comfortable
  for web, no clipping). Pass.
- Frozen screen (freezedetect, 0.5 s threshold, noise 0.001): about **14 s of the 30** still,
  in every hold after a shot landed. Fail (bar: about 1 s per 30 s).

**Critic's ranked findings and what changed**
1. Wrong typeface: every frame was DejaVu, the Linux fallback. Cause: the copied `fonts/inter.css`
   was Google's remote stylesheet, unreachable offline. Fixed: local `inter.css` with the five
   woff2 files; the renderer now refuses to run unless Inter reports loaded.
2. Header total contradicted the line items ($7,892 with four lines showing). Fixed: the total is
   the sum of landed items, tweened only with each item's own 0.3 s landing.
3. Invented phone number and town for EC Home Improvement. Fixed: company name only. `#1042`
   added to FACTS.md as the sample number.
4. "Deposit received" implied a payment never shown. Fixed: no deposit anywhere; the invoice is
   for $8,200 and $8,200 is paid on screen.
5. Five phone scenes at one size and position. Fixed: per-beat framing (push in on the pricing,
   pull back and tilt on the client, push in on the pay in 16:9), eased over 0.7 s from each cut.
6. Dead holds. Fixed: slow push-in inside every shot, float on the phone, drifting glow, tap
   ripples, the counter, the card typing.
7. Signature moments missing. Fixed: the phone itself lifts toward the viewer on Send while the
   builder flies off; the pill snaps green and the button turns green on Approve; Paid lands on
   the invoice (pill, row, button) with no replacement screen; the paid invoice card shrinks into
   the $5 chip over 1.1 s with the price fading in during the shrink.
8. Phone text too small. Fixed: rows 16 px, titles 26 px, plus the push-ins; the phone is a crop.
9. Collisions at 20.68 and 25.81. Fixed: phones enter after the type has left; the corner mark
   leaves before the card drops.
10. Every transition the same fade. Improved by 7; captions still fade, objects now move.
11. "Level Works" vs "LevelWorks": an artefact of the fallback font's spacing. Gone with 1.
12. Hook read as a loading state. Fixed: a legal pad with ruled lines and ink.
13. 9:16 safe zones. Fixed: everything inside y 250–1650; phone in the middle band; the two
    phones stacked diagonally.
14. Offer repeated on the close. Fixed: the end line is "30 days free · No card to start".
15. "standard card fee" after bank transfer was named. Fixed: "Only Stripe's standard fee."

## Round 2 — second full render

**Measured before the critic**
- Loudness: unchanged, -19.7 LUFS, peak -4.7 dBFS. Pass.
- Frozen screen: 1:1 none; 9:16 one hold of 0.52 s at 28.45 s; 16:9 0.55 s at 28.47 s and
  0.50 s at 29.02 s. All on the end card, which sits outside the push-in layer. Pass on the
  total (about 1 s per 30 s); the end card is the one place it still sits.

