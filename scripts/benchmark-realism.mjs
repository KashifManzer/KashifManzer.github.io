import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const origin=process.argv[2]??'http://127.0.0.1:4322', label=process.argv[3]??'current';
const directory=`test-results/realism/${label}`;await mkdir(directory,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-webgpu']});
const report=[];
try {
 for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844],['landscape',844,390]])for(let run=1;run<=3;run++){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(`${origin}/?audit`);await page.waitForFunction(()=>document.documentElement.dataset.graphics==='ready');
  for(const phase of ['cold','warm']){
   await page.evaluate(()=>{window.samples=[];let previous;const tick=now=>{const d=document.documentElement.dataset;if(previous)window.samples.push({dt:now-previous,progress:Number(d.progress),rendered:Number(d.renderCount),calls:Number(d.drawCalls),triangles:Number(d.triangles),geometries:Number(d.geometries),textures:Number(d.textures)});previous=now;window.sampleRaf=requestAnimationFrame(tick);};window.sampleRaf=requestAnimationFrame(tick);});
   // Identical forward/reverse scroll inputs, no still mode and no video recording.
   for(const direction of [1,-1]) {
    const distance=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
    for(let y=0;y<distance+600;y+=700){await page.mouse.wheel(0,700*direction);await page.waitForTimeout(55);}
    await page.waitForTimeout(700);
   }
   const data=await page.evaluate(()=>{cancelAnimationFrame(window.sampleRaf);return {samples:window.samples,textureUploadMs:Number(document.documentElement.dataset.textureUploadMs),compile:Number(document.documentElement.dataset.initialCompileMs),compileVariants:{impact:Number(document.documentElement.dataset.compile19Ms),city:Number(document.documentElement.dataset.compile12Ms),contact:Number(document.documentElement.dataset.compile22Ms)},progress:Number(document.documentElement.dataset.progress),renderer:document.querySelector('canvas').dataset.renderer,tier:document.querySelector('canvas').dataset.tier};});
   const ordered=data.samples.map(s=>s.dt).sort((a,b)=>a-b),percentile=p=>ordered[Math.floor((ordered.length-1)*p)];
   const summary={device,run,phase,renderer:data.renderer,tier:data.tier,median:percentile(.5),p95:percentile(.95),p99:percentile(.99),max:ordered.at(-1),frames:ordered.length,renderedFrames:data.samples.at(-1).rendered-data.samples[0].rendered,maxCalls:Math.max(...data.samples.map(s=>s.calls)),maxTriangles:Math.max(...data.samples.map(s=>s.triangles)),maxGeometries:Math.max(...data.samples.map(s=>s.geometries)),maxTextures:Math.max(...data.samples.map(s=>s.textures)),textureUploadMs:data.textureUploadMs,compileMs:data.compile,compileVariants:data.compileVariants,end:data.progress,errors};
   report.push(summary);await writeFile(`${directory}/${device}-${run}-${phase}.json`,JSON.stringify(data));console.log(JSON.stringify(summary));
  }
  await context.close();
 }
 await writeFile(`${directory}/benchmark.json`,JSON.stringify(report,null,2));
 if(report.some(run=>run.errors.length))throw new Error('Benchmark encountered browser errors');
}finally{await browser.close();}
