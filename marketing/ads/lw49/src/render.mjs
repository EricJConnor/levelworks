// Renders the LW49 ad (ad.html) to stills or to an MP4.
//
//   node render.mjs stills  <story> <size> <lang> <t1,t2,...>   → out/stills/<name>_<t>.png
//   node render.mjs video   <story> <size> <lang>               → ../lw49_<story>_<size>[_es].mp4 + .png (first frame)
//   node render.mjs all                                          → every story × size × lang
//
// Frame-by-frame: the page exposes render(t); we seek and screenshot at 30fps,
// then ffmpeg encodes H.264 yuv420p (iPhone-safe), faststart, ≤ 4MB target.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, 'base');   // intermediate renders; build.py adds the intro and music
const FFMPEG = process.env.FFMPEG || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const DIMS = { '1x1': [1080, 1080], '9x16': [1080, 1920] };
const FPS = 30;
const DUR_OF = story => story === 'ripoff' ? 20 : 27;       // ripoff.html is the 20s second-run ad
const FILE_OF = story => story === 'ripoff' ? 'ripoff.html' : 'ad.html';

const [, , mode, ...rest] = process.argv;

async function open(browser, story, size, lang) {
  const [w, h] = DIMS[size];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`file://${here}/${FILE_OF(story)}?story=${story}&size=${size}&lang=${lang}`);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

const name = (story, size, lang) => `lw49_${story}_${size}${lang === 'es' ? '_es' : ''}`;

async function stills(browser, story, size, lang, times) {
  const page = await open(browser, story, size, lang);
  mkdirSync(`${here}/out/stills`, { recursive: true });
  for (const t of times) {
    await page.evaluate(t => window.render(t), t);
    const f = `${here}/out/stills/${name(story, size, lang)}_${t.toFixed(2)}.png`;
    await page.screenshot({ path: f });
    console.log('still', f);
  }
  await page.close();
}

async function video(browser, story, size, lang) {
  const page = await open(browser, story, size, lang);
  const n = name(story, size, lang);
  const dir = `${here}/out/frames/${n}`;
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const frames = FPS * DUR_OF(story);
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    await page.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.png`, type: 'png' });
  }
  await page.close();
  const mp4 = `${OUT}/${n}.mp4`, png = `${OUT}/${n}.png`;
  // First frame as the static fallback.
  execFileSync('cp', [`${dir}/f0000.png`, png]);
  const encode = crf => execFileSync(FFMPEG, ['-y', '-framerate', String(FPS), '-i', `${dir}/f%04d.png`,
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', String(crf), '-preset', 'slow',
    '-movflags', '+faststart', '-r', String(FPS), mp4], { stdio: 'ignore' });
  // Near-lossless: this file is re-encoded twice more (intro+music, then Meta's own transcode), and
  // the phone's UI text is 11-15px; every lossy generation below this made it mush on Stories.
  const crf = 16; encode(crf);
  console.log('video', mp4, (statSync(mp4).size / 1024 / 1024).toFixed(2) + 'MB', 'crf', crf);
  rmSync(dir, { recursive: true, force: true });
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
try {
  if (mode === 'stills') {
    const [story, size, lang, ts] = rest;
    await stills(browser, story, size, lang, ts.split(',').map(Number));
  } else if (mode === 'video') {
    const [story, size, lang] = rest;
    await video(browser, story, size, lang);
  } else if (mode === 'all') {
    for (const story of ['estimate', 'invoice', 'recurring'])
      for (const size of ['1x1', '9x16'])
        for (const lang of ['en', 'es'])
          await video(browser, story, size, lang);
  } else {
    console.error('usage: render.mjs stills|video|all ...'); process.exit(1);
  }
} finally { await browser.close(); }
