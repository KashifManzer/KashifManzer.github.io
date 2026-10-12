import { chromium } from 'playwright';
import sharp from 'sharp';

const origin = process.argv[2] ?? 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-webgpu'] });
try {
  for (const [name, width, height] of [['desktop', 1600, 1000], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: name === 'mobile' ? 2 : 1, reducedMotion: 'reduce' });
    await page.goto(new URL('/observatory/', origin).href);
    await page.waitForFunction(() => document.documentElement.dataset.scene === 'ready');
    const pixels = await page.screenshot({ style: 'main, header, footer, .skip { visibility: hidden !important; }' });
    await sharp(pixels).webp({ quality: 86 }).toFile(`public/orbital-${name}.webp`);
    await page.close();
    console.log(`Captured ${name} poster from the rendered scene.`);
  }
} finally { await browser.close(); }
