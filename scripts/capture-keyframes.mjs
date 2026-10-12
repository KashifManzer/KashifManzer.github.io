import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const origin = process.argv[2] ?? 'http://127.0.0.1:4323';
const stops = [['opening',0], ['approach',4], ['arrival',7.3], ['descent',11], ['career',12.3], ['research',14.3], ['viasat',16.3]];
await mkdir('public/direction', { recursive:true });
await mkdir('test-results/journey', { recursive:true });
const browser = await chromium.launch({ channel:'chrome', args:['--enable-unsafe-webgpu'] });
const report = [];
try {
  for (const [device,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
    const page = await browser.newPage({ viewport:{width,height}, deviceScaleFactor:1 });
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
    await page.goto(`${origin}/?still`);
    await page.waitForFunction(()=>document.documentElement.dataset.graphics==='ready');
    for (const [name,time] of stops) {
      await page.evaluate(({name,time})=>{
        const section=document.getElementById(name);
        scrollTo(0,section.offsetTop+(time-Number(section.dataset.time))/Number(section.dataset.span)*section.offsetHeight);
      },{name,time});
      await page.waitForFunction(time=>Math.abs(Number(document.documentElement.dataset.progress)-time)<.002,time);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.screenshot({path:`test-results/journey/${name}-${device}.png`});
      const scene=await page.screenshot({style:'header, main, .flight-hud, .status, .skip, .scene-scrim { visibility:hidden !important; }'});
      await sharp(scene).webp({quality:88}).toFile(`public/direction/${name}-${device}.webp`);
      console.log(`${name} / ${device}`);
    }
    report.push({device,renderer:await page.locator('canvas').getAttribute('data-renderer'),errors});
    await page.close();
  }
  await writeFile('test-results/journey/capture-report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if(report.some(result=>result.errors.length)) throw new Error('Browser errors during capture');
} finally { await browser.close(); }
