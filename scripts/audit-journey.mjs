import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const origin=process.argv[2]??'http://127.0.0.1:4322', label=process.argv[3]??'current';
const dir=`test-results/asteroids/${label}`;await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-webgpu']});
const report=[];
try {
 for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844],...(label==='baseline'?[]:[['tablet',768,1024],['narrow',320,568],['landscape',844,390]])]) {
  const context=await browser.newContext({viewport:{width,height},recordVideo:{dir,size:{width,height}}});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`${origin}/?audit`);await page.waitForFunction(()=>document.documentElement.dataset.graphics==='ready');
  const samples=[];
  const stops=[['opening',0],['approach',4],['arrival',7.3],['descent',9.5],['descent',11],['career',12.3],['research',14.3],['viasat',16.3],...(label==='baseline'?[]:[['impact',18.8],['impact',20],['impact',21],['contact',22]])];
  for(const [id,time] of stops) {
   await page.evaluate(({id,time})=>{const e=document.getElementById(id);scrollTo(0,(e.getBoundingClientRect().top+scrollY)+(id==='contact'?0:(time-Number(e.dataset.time))/Number(e.dataset.span)*e.offsetHeight));},{id,time});
   await page.waitForTimeout(700);
   await page.screenshot({path:`${dir}/${device}-${time}.png`});
   const sample=await page.evaluate(async()=>{const intervals=[];let last;for(let i=0;i<45;i++) await new Promise(resolve=>requestAnimationFrame(now=>{if(last)intervals.push(now-last);last=now;resolve();}));intervals.sort((a,b)=>a-b);return {median:intervals[Math.floor(intervals.length*.5)],p95:intervals[Math.floor(intervals.length*.95)],drawCalls:Number(document.documentElement.dataset.drawCalls),triangles:Number(document.documentElement.dataset.triangles),overflow:document.documentElement.scrollWidth>innerWidth};});
   samples.push({id,time,...sample});
  }
  // Record complete forward and reverse travel with real wheel events.
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(700);
  await page.evaluate(() => { window.journeyFrames=[]; let previous; const frame=now=>{if(previous)window.journeyFrames.push({dt:now-previous,calls:Number(document.documentElement.dataset.drawCalls),triangles:Number(document.documentElement.dataset.triangles)});previous=now;window.journeyRaf=requestAnimationFrame(frame);};window.journeyRaf=requestAnimationFrame(frame); });
  const journey=[];
  for(const direction of [1,-1]) {
   const distance=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
   for(let y=0;y<distance+450;y+=450){await page.mouse.wheel(0,450*direction);await page.waitForTimeout(90);journey.push(await page.evaluate(()=>Number(document.documentElement.dataset.progress)));}
   await page.waitForTimeout(1000);
   journey.push(await page.evaluate(()=>Number(document.documentElement.dataset.progress)));
  }
  const frames=await page.evaluate(()=>{cancelAnimationFrame(window.journeyRaf);return window.journeyFrames;});
  const intervals=frames.map(f=>f.dt).sort((a,b)=>a-b);
  const travel={median:intervals[Math.floor(intervals.length*.5)],p95:intervals[Math.floor(intervals.length*.95)],p99:intervals[Math.floor(intervals.length*.99)],maxDrawCalls:Math.max(...frames.map(f=>f.calls)),maxTriangles:Math.max(...frames.map(f=>f.triangles))};
  const graphics=await page.locator('canvas').evaluate(canvas=>({renderer:canvas.dataset.renderer,tier:canvas.dataset.tier}));
  const video=page.video();await context.close();await video.saveAs(`${dir}/${device}-forward-reverse.webm`);
  report.push({device,width,height,...graphics,samples,travel,journey,errors});
 }
 await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report.map(({device,samples,travel,errors})=>({device,samples,travel,errors})),null,2));
 if(report.some(r=>r.errors.length||r.samples.some(s=>s.overflow)||Math.max(...r.journey)<(label==='baseline'?18:22)||r.journey.at(-1)>.001))throw new Error('Journey audit failed');
} finally {await browser.close();}
