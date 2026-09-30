#!/bin/bash
# Measures a finished render the way the critic wants it: a contact sheet every 0.2 s,
# a dense sheet (20 fps) for one second around every cut, frozen time, and loudness.
set -e
V=$1; N=$(basename "$V" .mp4); O=$(dirname "$V")/critic; mkdir -p "$O"
ffmpeg -y -v error -i "$V" -vf "fps=5,scale=-2:180,tile=10x15:padding=4:margin=4:color=black" "$O/${N}_sheet.png"
for c in 2.44 4.72 8.14 9.28 12.13 14.41 17.83 20.68 23.53 25.81 27.52; do
  s=$(python3 -c "print(max(0,$c-0.5))")
  ffmpeg -y -v error -ss $s -t 1 -i "$V" -vf "fps=20,scale=-2:150,tile=10x2:padding=3:margin=3:color=black" "$O/${N}_cut_${c}.png"
done
echo "-- frozen (freezedetect, >0.5s, noise 0.001):"
ffmpeg -v info -i "$V" -vf "freezedetect=n=0.001:d=0.5" -an -f null - 2>&1 | grep -E "freeze_(start|duration)" | sed 's/.*lavfi.//' || true
echo "-- loudness:"
ffmpeg -i "$V" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" || echo "(no audio)"
