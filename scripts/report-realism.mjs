import { readFile, writeFile, readdir } from 'node:fs/promises';
import sharp from 'sharp';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const baseline=await read('test-results/realism/baseline/benchmark.json');
const current=await read('test-results/realism/current/benchmark.json');
const regression=await read('test-results/realism/final-regression.json');
const coverage=new Map();
function collect(suites){for(const suite of suites){for(const spec of suite.specs??[])for(const test of spec.tests)coverage.set(`${spec.file}:${spec.title}:${test.projectName}`,test.status);collect(suite.suites??[]);}}
collect(regression.suites);
const latestCoverage=Object.fromEntries(['expected','unexpected','skipped','flaky'].map(status=>[status,[...coverage.values()].filter(value=>value===status).length]));
const visual=await read('test-results/realism/visual/report.json');
const recorded=await read('test-results/asteroids/realism/report.json');
const captures=[];
for(const dir of ['public/direction','public/social','public/textures/realism'])for(const name of await readdir(dir))if(name.endsWith('.webp')){
 const meta=await sharp(`${dir}/${name}`).metadata();captures.push({path:`${dir}/${name}`,width:meta.width,height:meta.height});
}
const comparison=[];
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
for(const device of ['desktop','mobile','landscape'])for(const phase of ['cold','warm']){
 const row={device,phase};
 for(const [label,entries] of [['baseline',baseline],['current',current]]){
  const samples=entries.filter(x=>x.device===device&&x.phase===phase);
  row[label]=Object.fromEntries(['median','p95','p99','max','renderedFrames','maxCalls','maxTriangles','maxGeometries','maxTextures'].map(key=>[key,median(samples.map(x=>x[key]))]));
 }
 comparison.push(row);
}
const report={generated:new Date().toISOString(),regression:{fullRun:regression.stats,latestCoverage},comparison,visual,recorded:recorded.map(({device,errors,journey,samples})=>({device,errors,maximumProgress:Math.max(...journey),finalProgress:journey.at(-1),overflow:samples.some(sample=>sample.overflow)})),captures,limits:['Same host and browser, viewport emulation only; no physical-device measurements.','Cold means first traversal in a new browser context, not a purged OS/GPU cache.','Baseline bundle only instrumented with matching audit frame/memory counters; shader compile timing unavailable.','Video capture is separate from benchmark timing.','Shader compilation timings describe explicit precompilation; remaining frame spikes are not attributed to compilation without profiling.']};
await writeFile('test-results/realism/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(latestCoverage.unexpected||latestCoverage.flaky||visual.some(row=>row.errors.length)||current.some(row=>row.errors.length)||report.recorded.some(row=>row.errors.length||row.overflow||row.maximumProgress<22||row.finalProgress>.001))throw new Error('Verification has unresolved failures');
