import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const origin=process.argv[2]??'http://127.0.0.1:4323';
await mkdir('test-results/journey',{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-webgpu']});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'test-results/journey',size:{width:1280,height:800}}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
try {
  await page.goto(origin);
  await page.waitForFunction(()=>document.documentElement.dataset.graphics==='ready');
  await page.waitForTimeout(800);
  const visited=[]; const inspected=new Set();
  for(let i=0;i<38;i++) {
    await page.mouse.wheel(0,450);
    await page.waitForTimeout(380);
    const progress=await page.evaluate(()=>Number(document.documentElement.dataset.progress));
    visited.push(progress);
    if([4,12,17,23,28,33].includes(i)) await page.screenshot({path:`test-results/journey/scroll-${i}.png`});
    if(progress >= 12 && progress < 18 && !inspected.has(Math.floor((progress - 12) / 2))) {
      const district = Math.floor((progress - 12) / 2); inspected.add(district);
      const chapter=['career','research','viasat'][district];
      const id=['go','kubernetes','python'][district];
      await page.locator(`#${chapter} [data-technology="${id}"]`).click();
      await page.waitForTimeout(400);
      await page.getByRole('button',{name:'Rotate right',exact:true}).click();
      await page.getByRole('button',{name:'Zoom in',exact:true}).click();
      await page.waitForTimeout(700);
      await page.getByRole('button',{name:'Close technology inspection'}).click();
    }
  }
  await page.getByRole('link',{name:'Contact',exact:true}).click();
  await page.waitForTimeout(800);
  await page.getByRole('link',{name:'Back to the stars',exact:false}).click();
  await page.waitForTimeout(800);
  const video=page.video();
  await context.close();
  await video.saveAs('test-results/journey/scroll-walkthrough.webm');
  await writeFile('test-results/journey/scroll-report.json',JSON.stringify({visited,errors},null,2));
  console.log(JSON.stringify({first:visited[0],last:visited.at(-1),errors}));
  if(errors.length||visited.at(-1)<18)throw new Error('Scroll walkthrough did not complete cleanly');
}finally{await browser.close();}
