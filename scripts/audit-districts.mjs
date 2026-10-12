import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
const origin=process.argv[2]??'http://127.0.0.1:4324';
await mkdir('test-results/districts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-webgpu']});
const report=[];
try{
 for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  await page.goto(origin+'/?audit');await page.waitForFunction(()=>document.documentElement.dataset.graphics==='ready');
  const scenes=[];
  for(const chapter of ['career','research','viasat']){
   await page.evaluate(id=>scrollTo(0,document.getElementById(id).offsetTop+100),chapter);await page.waitForTimeout(1200);
   await page.screenshot({path:`test-results/districts/${chapter}-${device}.png`});
   const sample=await page.evaluate(async()=>{
    const times=[];let last=performance.now();
    for(let i=0;i<120;i++)await new Promise(resolve=>requestAnimationFrame(now=>{times.push(now-last);last=now;resolve();}));
    times.shift();times.sort((a,b)=>a-b);
    return{median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],drawCalls:document.documentElement.dataset.drawCalls,triangles:document.documentElement.dataset.triangles};
   });scenes.push({chapter,...sample});
   const ids=await page.locator(`#${chapter} [data-technology]`).evaluateAll(bs=>bs.map(b=>b.dataset.technology));
   for(const id of ids){
    await page.locator(`#${chapter} [data-technology="${id}"]`).click();await page.waitForTimeout(300);
    await page.getByRole('button',{name:'Rotate right',exact:true}).click();await page.waitForTimeout(100);
    await page.screenshot({path:`test-results/districts/inspect-${id}-${device}.png`});
    await page.getByRole('button',{name:'Close technology inspection'}).click();await page.waitForTimeout(100);
   }
  }
  await page.goto('about:blank');report.push({device,scenes,errors,warnings});await page.close();
 }
 await writeFile('test-results/districts/audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 if(report.some(r=>r.errors.length))throw new Error('District audit found browser errors');
}finally{await browser.close();}
