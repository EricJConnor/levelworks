#!/bin/bash
# Rebuilds out/audio from the music track: tempo read, the two synthesized effects, the bed
# and the mix. Run once per video; then src/finish.sh muxes.
set -e
cd "$(dirname "$0")/.."; mkdir -p out/audio; cd out/audio
M=../../../lw49/src/intro/music-1167.mp3
# tempo and first strong hit, so the storyboard can snap cuts to the beat grid
ffmpeg -v error -i "$M" -ac 1 -ar 8000 -f s16le - | node -e "
let bufs=[];process.stdin.on('data',d=>bufs.push(d));process.stdin.on('end',()=>{const b=Buffer.concat(bufs);const sr=8000,hop=80;const n=Math.floor(b.length/2/hop);const e=new Float64Array(n);
for(let i=0;i<n;i++){let s=0;for(let j=0;j<hop;j++){const v=b.readInt16LE((i*hop+j)*2)/32768;s+=v*v}e[i]=Math.sqrt(s/hop)}
const on=new Float64Array(n);for(let i=1;i<n;i++)on[i]=Math.max(0,e[i]-e[i-1]);
let best=0,bl=0;for(let lag=Math.round(60/200*sr/hop);lag<=Math.round(60/60*sr/hop);lag++){let s=0;for(let i=lag;i<n;i++)s+=on[i]*on[i-lag];if(s>best){best=s;bl=lag}}
const bpm=60/(bl*hop/sr);console.log('bpm~',bpm.toFixed(1),'beat',(60/bpm).toFixed(4));
let mx=0;for(let i=0;i<n;i++)mx=Math.max(mx,on[i]);for(let i=0;i<n;i++){if(on[i]>mx*0.5){console.log('first strong onset at',(i*hop/sr).toFixed(3));break}}})"
# a soft whoosh (filtered pink noise, fast swell, slow tail) and a small click
ffmpeg -y -v error -f lavfi -i "anoisesrc=d=0.5:c=pink:r=48000:a=0.6" -af "bandpass=f=900:w=600,afade=t=in:st=0:d=0.08:curve=esin,afade=t=out:st=0.10:d=0.40:curve=esin,volume=0.9" whoosh.wav
ffmpeg -y -v error -f lavfi -i "sine=f=1800:d=0.06:r=48000" -af "afade=t=out:st=0:d=0.06:curve=exp,volume=0.5" click.wav
# the bed: first 30 s, fades, normalised to about -20 LUFS
ffmpeg -y -v error -i "$M" -t 30 -af "afade=t=in:st=0:d=0.3,afade=t=out:st=28.5:d=1.5,loudnorm=I=-20:TP=-2:LRA=9" -ar 48000 -ac 2 music.wav
# effects at the cut points and taps (edit these two lists to match the storyboard), then the mix
python3 - <<'PY'
import subprocess
cuts=[2.44,4.72,8.14,9.28,12.13,14.41,17.83,20.68,23.53,25.81,27.52]
clicks=[7.54,10.18,14.56,16.31]
inputs=[]; filt=[]; n=0
for i,c in enumerate(cuts):
    inputs+=['-i','whoosh.wav']; filt.append(f'[{n}]adelay={int((c-0.08)*1000)}|{int((c-0.08)*1000)}[w{i}]'); n+=1
for i,c in enumerate(clicks):
    inputs+=['-i','click.wav']; filt.append(f'[{n}]adelay={int(c*1000)}|{int(c*1000)}[c{i}]'); n+=1
labels=''.join(f'[w{i}]' for i in range(len(cuts)))+''.join(f'[c{i}]' for i in range(len(clicks)))
filt.append(f'{labels}amix=inputs={n}:normalize=0,apad=whole_dur=30[sfx]')
subprocess.run(['ffmpeg','-y','-v','error']+inputs+['-filter_complex',';'.join(filt),'-map','[sfx]','-ar','48000','-ac','2','sfx.wav'],check=True)
subprocess.run(['ffmpeg','-y','-v','error','-i','music.wav','-i','sfx.wav','-filter_complex','[1]volume=6.0[s];[0][s]amix=inputs=2:normalize=0,alimiter=limit=0.7:level=false[m]','-map','[m]','-t','30','-ar','48000','-ac','2','mix.wav'],check=True)
PY
for f in music.wav sfx.wav mix.wav; do echo "== $f"; ffmpeg -i $f -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"; done
