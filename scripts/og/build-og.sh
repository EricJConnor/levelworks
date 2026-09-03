#!/bin/sh
# Renders scripts/og/og.html to public/og.png (1200x630) with headless Chromium.
# Re-run after editing og.html. Any Chromium works; the path below is this
# environment's preinstalled one.
set -e
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
"$CHROME" --headless --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --screenshot="$PWD/public/og.png" "file://$PWD/scripts/og/og.html" 2>/dev/null
ls -la public/og.png
