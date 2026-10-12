import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const origin=process.argv[2]??'http://127.0.0.1:4322';
const dir='test-results/realism/visual';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-webgpu']});const report=[];
try {
 for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844],['tablet',768,1024],['narrow',320,568],['landscape',844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
  await page.goto(`${origin}/?still&audit`);await page.waitForFunction(()=>document.documentElement.dataset.graphics==='ready');
  const stops=[['opening',0],['approach',4],['arrival',7.3],['descent',11],['career',12.3],['research',14.3],['viasat',16.3],['impact',20],['contact',22]];
  for(const [id,time] of stops){
   await page.evaluate(({id,time})=>{const e=document.getElementById(id);scrollTo(0,e.offsetTop+(id==='contact'?e.parentElement.offsetTop:(time-Number(e.dataset.time))/Number(e.dataset.span)*e.offsetHeight));},{id,time});
   await page.waitForFunction(time=>Math.abs(Number(document.documentElement.dataset.progress)-time)<.01,time);
   await page.waitForTimeout(100);await page.screenshot({path:`${dir}/${device}-${id}.png`});
  }
  const bounds=await page.locator('[data-social]').evaluateAll(links=>links.map(link=>({id:link.dataset.social,...Object.fromEntries(['x','y','width','height'].map(k=>[k,link.getBoundingClientRect()[k]]))})));
  if(device==='desktop'){
   const scene=await page.screenshot({style:'header,main,.flight-hud,.status,.skip,.scene-scrim{visibility:hidden!important}'});
   for(const b of bounds){const left=Math.max(0,Math.floor(b.x)-8),top=Math.max(0,Math.floor(b.y)-8);await sharp(scene).extract({left,top,width:Math.min(width-left,Math.ceil(b.width)+16),height:Math.min(height-top,Math.ceil(b.height)+16)}).resize(320,320,{fit:'contain',background:'#0c1320'}).webp({quality:92}).toFile(`public/social/asteroid-${b.id}.webp`);}
  }
  await page.goto(`${origin}/observatory/?webgl`);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.documentElement.dataset.scene==='ready');await page.locator('#explore').click();
  for(const name of ['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']){
   await page.locator('#solar-system').getByRole('button',{name,exact:true}).click();await page.waitForTimeout(100);await page.screenshot({path:`${dir}/${device}-${name}.png`});
  }
  report.push({device,bounds,errors});console.log(JSON.stringify(report.at(-1)));await page.close();
 }
 await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));
}finally{await browser.close();}
