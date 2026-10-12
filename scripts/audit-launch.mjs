import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const origin=process.argv[2]??'http://127.0.0.1:4324';
await mkdir('test-results/launch',{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-webgpu']});
const report=[];
try {
  for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844],['narrow',320,568],['landscape',844,390]]) {
    const context=await browser.newContext({viewport:{width,height}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.goto(origin+'/?still');
    await page.waitForFunction(()=>document.documentElement.dataset.graphics==='ready');
    for(const id of ['opening','career','work','contact']) {
      await page.evaluate(id=>{const section=document.getElementById(id);scrollTo(0,section.getBoundingClientRect().top+scrollY);},id);
      await page.waitForTimeout(600);
      await page.screenshot({path:`test-results/launch/${device}-${id}.png`});
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) errors.push(`Overflow: ${id}`);
    }
    report.push({device,errors});await context.close();
  }
  await writeFile('test-results/launch/visual-audit.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if(report.some(result=>result.errors.length))throw new Error('Visual audit found browser errors');
}finally{await browser.close();}
