// Headless deterministic renderer: seeks the promo reel frame-by-frame and
// writes a PNG sequence, then you encode it with ffmpeg.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FPS = 30;
const OUT = path.join(__dirname, 'frames');
const FILE = 'file://' + path.join(__dirname, 'studystack-promo.html').replace(/\\/g, '/') + '?capture=1';

(async () => {
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(FILE, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  const total = await page.evaluate(() => window.__total);
  const frames = Math.round((total / 1000) * FPS);
  console.log(`Total ${total}ms -> ${frames} frames @ ${FPS}fps`);

  for (let f = 0; f < frames; f++) {
    const T = (f * 1000) / FPS;
    await page.evaluate((t) => window.__seek(t), T);
    // let the compositor settle on the seeked frame
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const name = String(f).padStart(4, '0');
    await page.screenshot({ path: path.join(OUT, `frame_${name}.png`) });
    if (f % 60 === 0) console.log(`  frame ${f}/${frames}`);
  }

  await browser.close();
  console.log('Done. Frames in', OUT);
})().catch(e => { console.error(e); process.exit(1); });
