# LevelWorks ad creative generator

Builds the 1080x1920 Facebook/Instagram Stories ad image from `generate_ad.py`.

## Setup

```
pip install pillow
```

## Generate

```
python3 generate_ad.py
```

Writes `output/ad_1080x1920.png`.

## Making a variation

Edit the `CONFIG` block at the top of `generate_ad.py`:
- `HEADLINE_LINES`, `URL_TEXT`, `FEATURES`, `BOTTOM_LINE` — copy
- `BG_COLOR`, `BLUE`, `MUTED_TEXT` — colors
- `DASHBOARD_SCREENSHOT` / `CROP_BOX` — swap in a new phone screenshot

Then re-run the script.

## Re-deriving CROP_BOX for a new screenshot

`CROP_BOX` isolates the 4 stat tiles + the estimate card below them, cutting
out the status bar, nav bar, and any buttons above. To find it for a new
screenshot: the page background sits at very low brightness (~10,10,10 RGB),
while card backgrounds sit noticeably lighter (~25-33). Scan down a vertical
strip of pixels and note where the average row brightness jumps from ~10 to
~25+ (top of the crop) and back down to ~10 (bottom of the crop):

```python
from PIL import Image
im = Image.open("assets/dashboard_screenshot.webp")
px = im.load()
w, h = im.size
for y in range(0, h, 4):
    vals = [px[x, y] for x in range(0, w, 6)]
    avg = sum(sum(v) // 3 for v in vals) // len(vals)
    print(y, avg)
```

## Assets

- `assets/fonts/Inter-*.ttf` — Inter (SIL Open Font License), converted from
  the `@fontsource/inter` npm package's woff2 files so the script has no
  network dependency at generation time.
- `assets/dashboard_screenshot.webp` — source phone screenshot for the phone
  mockup. Not committed by default if it contains real client data; see repo
  history / ask before adding a new one with real customer info.
