#!/bin/bash
# After the three silent renders exist in out/: put the sound on, make music-only and silent
# copies, and run the critic measurements on each finished file.
set -e
cd "$(dirname "$0")/../out"
for m in m11 m916 m169; do
  ffmpeg -y -v error -i video_${m}_silent.mp4 -i audio/mix.wav   -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart levelworks_${m}.mp4
  ffmpeg -y -v error -i video_${m}_silent.mp4 -i audio/music.wav -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart levelworks_${m}_music-only.mp4
  cp video_${m}_silent.mp4 levelworks_${m}_silent.mp4
  echo "=== $m"; bash ../src/critic.sh levelworks_${m}.mp4
done
ls -la levelworks_*
