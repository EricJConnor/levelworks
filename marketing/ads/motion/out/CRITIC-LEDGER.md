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

**Second critic's read of the 15 items:** fixed 1, 4, 8, 14, 15; partly 2, 5, 6, 7, 9, 10, 12,
13; still there 11 (a word space in the mark, caused by the flex gap between "Level" and the
blue "Works", not by the font).

**New findings, ranked, and what changed for round 3**
1. 1:1 push-in put line four below the frame while the total counted past it. Fixed: gentler
   push-ins (1.18 in 1:1, 1.2 in 9:16) framed so all four lines land in view.
2. Caption-to-phone collisions: 9:16 at 7.0 and 16.5, 16:9 at 22.0. Fixed: 9:16 phone lowered
   (top clear of the caption's descender), 16:9 phone pair moved right.
3. "Maria Alvarez" and a full 16-digit test card on the pay form. Fixed: "M. Alvarez",
   "•••• •••• •••• 4242".
4. The send was a ghosted dissolve with two documents readable at once. Fixed: hard cut on the
   beat, the phone lifting through it, whoosh on the cut.
5. The card did not become the chip. Fixed: it drops in at full size first, then its box
   animates to the chip's rectangle and radius while the content fades and the price fades in.
6. 1.2 s hold on the client phone before the signature. Fixed: the Sent pill lands at the cut,
   the stroke starts 0.15 s later.
7. Hook held static. Fixed: the last line on the pad draws itself over the first second.
8. Done buttons read washed out. Fixed: the white tap fill resets when the state flips.
9. 16:9 pay crop hid the Paid pill. Fixed: crop pulled up 80 px.
10. Flip rotated the screen inside a still bezel. Fixed: the whole phone flips (and the back view
    is un-mirrored, because the screen layer is flat).
11. Word space in the mark. Fixed: the wordmark is one flex item.
- "Only Stripe's standard fees." (plural, as in FACTS).

Weakest size in round 2: 9:16; strongest: 1:1, which is the one the live ad set serves.

## Round 3 — third full render
**Measured:** loudness -19.7 LUFS, peak -4.7 dBFS; frozen 1:1 none, 9:16 0.50 s at 28.47,
16:9 0.53 s and 0.52 s at 28.48 and 29.02 (end card).

**Third critic's read of round 2's list:** fixed 1, 2, 3, 4, 7, 8, 10, 11, 12; partly 5 (the
chip was still a crossfade of two objects), 9 (16:9 pay crop hid the pill); still 6 (the
signature now started 1.7 s after the cut, because the cut had moved earlier and the stroke
had not).

**New, ranked, and what changed for round 4**
1. The invoice flashed back to "Balance due" with a washed button for 0.25 s between the form
   leaving and Paid landing. Fixed: Paid lands before the form starts to leave.
2. Signature 1.7 s after the cut. Fixed: the stroke starts 0.45 s after the 8.14 cut, the tap,
   fill and Approved follow, and the beat holds on the approved state.
3. Header lagged the lines by up to 0.3 s at each landing. Fixed: each line's amount counts up
   with the header, so the screen always adds up.
4. "Only Stripe's standard fees." orphaned "fees." in 1:1. Fixed: 70 px in the square and tall
   sizes, one line.
5. 9:16 phone bottom sat inside the platform overlay band. Fixed: bottom now at about 1550.
6. Chip morph still two objects. Fixed: one box; its fill turns blue and only the text crossfades.
7. 16:9 pay push-in hid the Paid pill. Fixed: crop moved up.
- Also: a visible press on Send (fill and a 5% squeeze) and a bigger lift through the cut.

Verdict on round 3 was "one more pass, a short one"; the 1:1 was called shippable on facts and
layout with the flash-back as the one blocker.

## Round 4 — final render
**Measured:** loudness -19.7 LUFS integrated, peak -4.7 dBFS, LRA 1.7 LU on all three; frozen
frames over 0.5 s: 1:1 none; 9:16 one 0.50 s hold at 28.47 s; 16:9 three holds of about 0.5 s
between 28.3 and 29.9 s. All on the end card, by design; total still about 1 s per 30 s.

**Quality bar, final**
- Frozen screen: pass (1:1 zero; the others about 1 s, all on the closing card).
- Frame one is a finished composition: pass (headline, pad, wordmark).
- Text contrast: ink #0b1220 and blue #2563eb on #f5f7fb, both well over 4.5:1; muted #5b6472
  on the page ground is about 6:1. Pass.
- Brand colours: no 3D renders; the blue is the CSS token itself. Pass.
- Loudness steady, no clipping, effects under the music. Pass.
- Sound-off comprehension (per the third critic): phone, estimate, sent, signed, invoice, paid,
  English or Spanish, $5. Pass.
- Facts: every claim on screen is in FACTS.md (third critic's audit). Pass.

**What a human should still check**
- Watch the 1:1 with sound once: the whoosh and click levels were set by measurement, not by ear.
- The 9:16 and 16:9 were checked for layout, but the ad set that runs today is feed only, so
  1:1 is the one that goes up first.
- The music is "Close Up" (Mixkit 1167) under a free licence already used on the LW49 ads.
- The Spanish line "Retiro y desecho del techo viejo" adds "viejo" to "Tear-off and disposal";
  harmless, change if a Spanish-speaking contractor prefers the literal.
