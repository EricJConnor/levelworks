// Renders src/ad.html frame by frame at 60 fps through headless Chromium and pipes the
// PNGs into ffmpeg. Usage:
//   node src/render.mjs stills m169 0,2.4,5,8.5,10.5,13,16,19,22,24.5,26.5,29   (frames to look at)
//   node src/render.mjs video m169 [seconds]                                     (silent mp4)
import { chromium } from 'playwright-core';   // npm install in this folder (src/package.json)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'out');
fs.mkdirSync(OUT, { recursive: true });
const SIZES = { m169: [1920, 1080], m916: [1080, 1920], m11: [1080, 1080] };
const FPS = 60;
const [cmd, mode = 'm169', arg] = process.argv.slice(2);
const [W, H] = SIZES[mode];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--font-render-hinting=none', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(here, 'ad.html'));
await page.evaluate((m) => { setMode(m); return document.fonts.ready; }, mode);
// The film is not the film in a fallback font: refuse to render unless Inter is really loaded.
const fontOk = await page.evaluate(() => [400, 500, 600, 700, 800].every((w) => document.fonts.check(`${w} 20px Inter`)) && [...document.fonts].filter((f) => f.family === 'Inter' && f.status === 'loaded').length >= 5);
if (!fontOk) { console.error('Inter did not load; check src/inter.css and src/fonts/*.woff2'); await browser.close(); process.exit(1); }
const shot = async (t) => { await page.evaluate((t) => render(t), t); return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } }); };

if (cmd === 'stills') {
  for (const t of arg.split(',').map(Number)) fs.writeFileSync(path.join(OUT, `still_${mode}_${t.toFixed(2)}.png`), await shot(t));
} else {
  const secs = Number(arg) || 30;
  const n = Math.round(secs * FPS);
  const file = path.join(OUT, `video_${mode}${secs < 30 ? '_test' : ''}_silent.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const png = await shot(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${mode} ${i}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('wrote', file);
}
await browser.close();
