"""
Puts Eric's 7-second intro in front of every rendered ad.

  python3 build.py            → all twelve
  python3 build.py estimate 1x1 en   → one

Inputs:  ../base/lw49_<story>_<size>[_es].mp4   (the 26s renders from render.mjs, no audio)
         eric-intro.mov                          (iPhone, HDR HLG, portrait, with sound)
Outputs: ../../lw49_<story>_<size>[_es].mp4      (the files that go to Meta)

The intro is tone-mapped to SDR, cropped to the ad's frame, captioned with his words
(feeds play silent) in the ad's language, and cross-faded into the phone story.
Audio: his voice, normalised, then silence under the story.
"""
import subprocess, sys, os, pathlib
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).parent
FF = '/usr/local/bin/ffmpeg'
FONT = str(HERE / 'inter-bold.ttf')
SRC = str(HERE / 'eric-intro.mov')
BASE = HERE.parent / 'base'
OUT = HERE.parent.parent
INTRO_END = 5.9          # after ".org"
XF = 0.35                # crossfade into the story

CAPS = {
    'en': [(0.0, 1.8, "Hey, my name is Eric,"), (1.8, 3.0, "I'm a contractor,"), (3.0, 5.9, "and my app is levelworks.org")],
    'es': [(0.0, 1.8, "Hola, soy Eric,"), (1.8, 3.0, "soy contratista,"), (3.0, 5.9, "y mi app es levelworks.org")],
}
LAYOUT = {  # crop of the 1080x1920 upright source, caption y, url label y/size
    '1x1':  dict(crop='1080:1080:0:230', cap_y=830, cap_size=54, url_y=34, url_size=30),
    '9x16': dict(crop='1080:1920:0:0',   cap_y=1440, cap_size=62, url_y=268, url_size=36),
}

def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-1500:]); raise SystemExit(1)

def intro(size, lang):
    L = LAYOUT[size]
    out = HERE / f'intro_{size}_{lang}.mp4'
    if out.exists(): return out
    W = 1080; H = 1080 if size == '1x1' else 1920
    def png(text, size_px, color, y, name, boxed):
        font = ImageFont.truetype(FONT, size_px)
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        l, t, r, b = d.textbbox((0, 0), text, font=font); tw, th = r - l, b - t
        x = (W - tw) // 2
        if boxed: d.rounded_rectangle((x - 22, y - 16, x + tw + 22, y + th + 22), radius=16, fill=(0, 0, 0, 105))
        d.text((x - l, y - t), text, font=font, fill=color, stroke_width=2 if not boxed else 0, stroke_fill=(0, 0, 0, 140))
        path = HERE / name; im.save(path); return path
    overlays = [(png('levelworks.org', L['url_size'], (199, 211, 236, 255), L['url_y'], f'url_{size}.png', False), 0, INTRO_END)]
    for i, (a, b, t) in enumerate(CAPS[lang]):
        overlays.append((png(t, L['cap_size'], (255, 255, 255, 255), L['cap_y'], f'cap_{size}_{lang}_{i}.png', True), a, b))
    inputs = []; chain = ''
    for i, (path, a, b) in enumerate(overlays):
        inputs += ['-i', str(path)]
        src = '[v0]' if i == 0 else f'[v{i}]'
        chain += f"{src}[{i+1}:v]overlay=0:0:enable='between(t,{a},{b})'[v{i+1}];"
    chain = chain.rstrip(';').replace('[v0]', '[base]', 1)
    vf = ("zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
          f"scale=1080:1920,crop={L['crop']},eq=contrast=1.04:saturation=1.08")
    last = f'[v{len(overlays)}]'
    run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', SRC, *inputs, '-t', str(INTRO_END),
         '-filter_complex', f"[0:v]{vf}[base];{chain};[0:a:0]loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st={INTRO_END-0.3}:d=0.3[a]",
         '-map', last, '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
         '-r', '30', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', str(out)])
    return out

def final(story, size, lang):
    suf = '' if lang == 'en' else '_es'
    base = BASE / f'lw49_{story}_{size}{suf}.mp4'
    out = OUT / f'lw49_{story}_{size}{suf}.mp4'
    ip = intro(size, lang)
    run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(ip), '-i', str(base),
         '-f', 'lavfi', '-t', '26', '-i', 'anullsrc=r=48000:cl=stereo',
         '-filter_complex', f"[0:v][1:v]xfade=transition=fade:duration={XF}:offset={INTRO_END-XF}[v];[0:a][2:a]acrossfade=d={XF}[a]",
         '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
         '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', str(out)])
    # first frame as the static fallback
    run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(out), '-frames:v', '1', str(OUT / f'lw49_{story}_{size}{suf}.png')])
    print('final', out.name, round(out.stat().st_size / 1e6, 2), 'MB')

if __name__ == '__main__':
    if len(sys.argv) == 4: final(*sys.argv[1:4])
    else:
        for story in ('estimate', 'invoice', 'recurring'):
            for size in ('1x1', '9x16'):
                for lang in ('en', 'es'): final(story, size, lang)
