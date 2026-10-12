import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const view = { style:'header, main, .flight-hud, .status, .skip { visibility:hidden !important; }' };
const stops = [['opening',0],['approach',4],['arrival',7.3],['descent',11],['career',12.3],['research',14.3],['viasat',16.3]] as const;
function errorsFrom(page:Page) {
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
  return errors;
}
async function ready(page:Page, query='?still') {
  await page.goto('/'+query);
  await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
}
async function seek(page:Page,name:string,time:number) {
  const expected = await page.evaluate(({name,time})=>{
    const section=document.getElementById(name)!;
    scrollTo(0,section.offsetTop+(time-Number(section.dataset.time))/Number(section.dataset.span)*section.offsetHeight);
    return Number(section.dataset.time)+(scrollY-section.offsetTop)/section.offsetHeight*Number(section.dataset.span);
  },{name,time});
  await expect(page.locator('html')).toHaveAttribute('data-progress',expected.toFixed(4));
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
}

test('only opening copy is visible from the first graphics frame',async({page})=>{
  await page.addInitScript(()=>{
    const samples:number[][]=[];
    Object.assign(window,{openingOpacitySamples:samples});
    const observer=new MutationObserver(()=>{
      if(document.documentElement.dataset.graphics!=='ready') return;
      observer.disconnect();
      const sample=()=>{
        samples.push([...document.querySelectorAll('.chapter-copy')].map(copy=>Number(getComputedStyle(copy).opacity)));
        if(samples.length<12) requestAnimationFrame(sample);
      };
      sample();
    });
    observer.observe(document,{subtree:true,attributes:true,attributeFilter:['data-graphics']});
  });
  for(const [width,height] of [[1440,900],[390,844]]) {
    await page.setViewportSize({width,height});
    await ready(page);
    const samples=await page.evaluate(async()=>{
      const read=()=>(window as unknown as {openingOpacitySamples:number[][]}).openingOpacitySamples;
      while(read().length<12) await new Promise(requestAnimationFrame);
      return read();
    });
    for(const sample of samples) expect(sample).toEqual([1,0,0,0,0,0,0]);
  }
});

test('native wheel scrolling moves the camera immediately and reverses the same path',async({page})=>{
  const errors=errorsFrom(page);
  await ready(page);
  const original=await page.screenshot(view);
  await page.mouse.wheel(0,450);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(300);
  await expect.poll(()=>page.locator('html').getAttribute('data-progress').then(Number)).toBeGreaterThan(.3);
  await page.waitForTimeout(700);
  expect((await page.screenshot(view)).equals(original)).toBe(false);
  await seek(page,'arrival',7.3);
  const orbit=await page.screenshot(view);
  await seek(page,'approach',4);
  expect((await page.screenshot(view)).equals(orbit)).toBe(false);
  await seek(page,'arrival',7.3);
  expect((await page.screenshot(view)).equals(orbit)).toBe(true);
  await seek(page,'opening',0);
  expect((await page.screenshot(view)).equals(original)).toBe(true);
  expect(errors).toEqual([]);
});

test('the complete scroll sequence renders in both backends and quality tiers',async({page})=>{
  test.setTimeout(120000);
  const errors=errorsFrom(page);
  for(const query of ['?still&tier=high','?still&tier=low','?still&webgl&tier=high','?still&webgl&tier=low']) {
    await ready(page,query);
    await expect(page.locator('canvas')).toHaveAttribute('data-renderer',query.includes('webgl')?'webgl':'webgpu');
    for(const [name,time] of stops) {
      await seek(page,name,time);
      const scene=await page.screenshot(view);
      const blank=await page.screenshot({style:view.style+'canvas {opacity:0!important}'});
      expect(scene.equals(blank)).toBe(false);
    }
  }
  expect(errors).toEqual([]);
});

test('cloud transition covers the world switch and clears in either scroll direction',async({page})=>{
  await ready(page);
  for(const time of [9,10.15,11.5,10.15,9]) {
    await seek(page,'descent',time);
    const opacity=await page.locator('#cloud-veil').evaluate(element=>Number(getComputedStyle(element).opacity));
    if(time===10.15) expect(opacity).toBeGreaterThan(.99);
    else expect(opacity).toBeLessThan(.01);
  }
});

test('native links skip the flight, restore focus, and survive deep linking and browser back',async({page})=>{
  await ready(page);
  await page.getByRole('link',{name:'Experience',exact:true}).click();
  await expect(page.locator('#career')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-progress','12.0000');
  if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Selected work',exact:true}).click();
  await expect(page.locator('#work')).toBeFocused();
  await expect(page.getByRole('heading',{name:'NetLink',exact:true})).toBeInViewport();
  await page.goBack();
  await expect(page.locator('html')).toHaveAttribute('data-progress','12.0000');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
  await expect(page.locator('html')).toHaveAttribute('data-progress','12.0000');
  await page.getByRole('link',{name:'Back to the stars',exact:false}).click();
  await expect(page.locator('html')).toHaveAttribute('data-progress','0.0000');
});

test('all chapters fit desktop, narrow mobile, tablet, landscape, and zoom-equivalent layouts',async({page})=>{
  test.setTimeout(120000);
  const errors=errorsFrom(page);
  await ready(page);
  for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,568],[844,390],[720,450]]) {
    await page.setViewportSize({width,height});
    for(const [name,time] of stops) {
      await seek(page,name,name==='descent'?9:time);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const copy=await page.locator(`#${name} .chapter-copy`).boundingBox();
      expect(copy!.y).toBeGreaterThanOrEqual(55);
      expect(copy!.y+copy!.height).toBeLessThan(height-20);
      if(width===1440 || width===390) expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});

test('reduced motion shortens the journey and keeps graphics still, with an explicit override',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page,'');
  await expect(page.locator('#reduce-motion')).toHaveAttribute('aria-pressed','true');
  expect(await page.locator('#opening').evaluate(element=>element.clientHeight)).toBe(900);
  const staticScene=await page.screenshot(view);
  await page.waitForTimeout(300);
  expect((await page.screenshot(view)).equals(staticScene)).toBe(true);
  await page.getByRole('link',{name:'Experience',exact:true}).click();
  expect((await page.screenshot(view)).equals(staticScene)).toBe(true);
  await page.locator('#reduce-motion').click();
  await expect(page.locator('#reduce-motion')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('html')).toHaveAttribute('data-progress','12.0000');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#reduce-motion')).toHaveAttribute('aria-pressed','true');
});

test('Earth and satellite animate slowly and a same-aspect resize redraws',async({page})=>{
  await ready(page,'#arrival');
  const before=await page.screenshot(view);
  await page.waitForTimeout(1500);
  expect((await page.screenshot(view)).equals(before)).toBe(false);
  await page.setViewportSize({width:960,height:600});
  await page.waitForTimeout(200);
  const actual=await page.screenshot(view);
  expect(actual.equals(await page.screenshot({style:view.style+'canvas{opacity:0!important}'}))).toBe(false);
});

test('mobile touch scroll drives the flight and direct project navigation stays available',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const page=await context.newPage();
  await ready(page);
  await expect(page.locator('canvas')).toHaveAttribute('data-tier','low');
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:650}]});
  for(const y of [550,450,350,250,150]) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(250);
  if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Selected work',exact:true}).tap();
  await expect(page.locator('#work')).toBeFocused();
  await context.close();
});

test('without JavaScript every chapter, poster, and project remains accessible',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto('/');
  for(const [name] of stops) {
    await page.locator(`#${name}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${name} .chapter-poster`)).toBeVisible();
    await expect.poll(()=>page.locator(`#${name} img`).evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true);
  }
  if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Selected work',exact:true}).click();
  await expect(page.locator('#work')).toBeInViewport();
  await expect(page.locator('#reduce-motion')).toBeHidden();
  await context.close();
});

test('each failed texture retains the illustrated portfolio and working project links',async({page})=>{
  for(const asset of ['earth-*.webp','cinematic/moon-color.webp','cinematic/moon-height.webp','cinematic/jupiter.webp','cinematic/earth-clouds.webp']) {
    await page.route('**/textures/'+asset,route=>route.fulfill({status:503,body:'Unavailable'}));
    await page.goto('/#career');
    await expect(page.locator('html')).toHaveAttribute('data-graphics','fallback');
    await expect(page.locator('#career h2')).toBeInViewport();
    if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Selected work',exact:true}).click();
    await expect(page.locator('#work')).toBeFocused();
    await page.unrouteAll();
  }
});

test('context loss restores readable content and unload cleans up pending graphics',async({page})=>{
  await ready(page,'?webgl#career');
  await page.locator('canvas').evaluate((canvas:HTMLCanvasElement)=>canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await expect(page.locator('html')).toHaveAttribute('data-graphics','fallback');
  await expect(page.locator('#career h2')).toBeInViewport();
  const errors=errorsFrom(page);
  await ready(page);
  await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide')));
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
});

test('the planet-explorer link opens the existing interactive destination controls',async({page})=>{
  await ready(page,'#arrival');
  await page.getByRole('link',{name:'Explore the planets',exact:false}).click();
  await expect(page.locator('#solar-system')).toBeVisible();
  await page.locator('#solar-system').getByRole('button',{name:'Saturn',exact:true}).click();
  await expect(page.locator('#solar-system .planet-name')).toHaveText('Saturn');
  await page.getByRole('button',{name:'Return to Earth',exact:false}).click();
  await page.getByRole('link',{name:'Back to journey',exact:false}).click();
  await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
  await expect(page.locator('html')).toHaveAttribute('data-progress','7.0000');
});

test('unavailable graphics keeps the compact illustrated portfolio usable',async({page})=>{
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]) {
      if(type.includes('webgl')||type==='webgpu') return null;
      return original.call(this,type,...args);
    } as typeof original;
    Object.defineProperty(navigator,'gpu',{value:undefined});
  });
  await page.goto('/?webgl');
  await expect(page.locator('html')).toHaveAttribute('data-graphics','fallback');
  await expect(page.locator('#opening .chapter-poster')).toBeVisible();
  if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Selected work',exact:true}).click();
  await expect(page.locator('#work')).toBeFocused();
});

test('slow graphics time out without blocking the work or leaving a long empty flight',async({page})=>{
  await page.route('**/textures/cinematic/moon-color.webp',async route=>{
    await new Promise(resolve=>setTimeout(resolve,22000));
    await route.abort().catch(()=>{});
  });
  await page.goto('/');
  if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Selected work',exact:true}).click();
  await expect(page.locator('#work')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-graphics','fallback',{timeout:25000});
  await expect(page.locator('#work')).toBeInViewport();
  expect(await page.locator('#opening').evaluate(element=>element.clientHeight)).toBe(900);
});
