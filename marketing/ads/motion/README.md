# LevelWorks — "From the driveway to the bank" (motion video, Sep 30 2026)

A 30-second product video built entirely in code, from the prompt Eric sent (the X post
by @everestchris6). The kit it references could not be cloned from this environment, so the
method is followed from the prompt itself with the tools here: headless Chromium, ffmpeg.

## Files
- `FACTS.md` — the only source for anything on screen. Read it before changing copy.
- `STORYBOARD.md` — brief, the one carried object, three signature moments, the 13-shot
  table with cut times on the music's beat grid, layout per size.
- `src/ad.html` — the video. One page, every element positioned by `render(t)` from a single
  time value, no CSS animation, no timers, no randomness. Three layouts: `m169`, `m916`, `m11`.
  Open it in a browser and call `setMode('m916'); render(12.5)` in the console to look at any frame.
- `src/render.mjs` — `node src/render.mjs stills m169 0,2.4,8.5` writes PNGs of those moments;
  `node src/render.mjs video m169` renders the full 30 s at 60 fps through ffmpeg.
  Uses the Chromium at `/opt/pw-browsers/chromium` and `playwright-core` from the scratchpad;
  point the import at a local `node_modules` if that path is gone.
- `src/critic.sh <mp4>` — contact sheet every 0.2 s, dense sheets around every cut, frozen time,
  loudness. The critic reads these, never the builder's opinion.
- `out/` — renders. `levelworks_<size>.mp4` with sound, `levelworks_<size>_music-only.mp4`,
  `levelworks_<size>_silent.mp4`, `critic/` sheets and `CRITIC-LEDGER.md`.
- Sound: "Close Up" (Mixkit 1167, free licence, the track Eric picked for the LW49 ads), one
  soft synthesized whoosh on each cut, a small click on each on-screen tap. Music-only export too.

## Sizes
16:9 (1920×1080), 9:16 (1080×1920) and 1:1 (1080×1080). The live sign-up ad set is feed only,
so 1:1 is the one that will actually run; 9:16 is ready if Reels or Stories come back.

## Rules kept
- $5 a month, 30 days free, no card to start: the only pricing anywhere.
- Money timing is honest: "Straight to your bank through Stripe", never "instant" or "same day".
- No customer counts, ratings, or invented results. The sample estimate is fictional and says so
  in FACTS.md.
- Blue is the accent and the primary action, green means money in.
