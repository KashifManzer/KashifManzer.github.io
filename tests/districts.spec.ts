import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function ready(page:Page,query='?still#career'){
 await page.goto('/'+query);await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
 await expect(page.locator('#career [data-technology="go"]')).toBeVisible();
}
const dialog=(page:Page)=>page.locator('#logo-inspection');
const close=(page:Page)=>page.getByRole('button',{name:'Close technology inspection'}).click();
function errorsFrom(page:Page){const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return errors;}

test('every official sculpture renders in inspection and returns to its chapter',async({page})=>{
 test.setTimeout(90000);const errors=errorsFrom(page);await ready(page);
 for(const chapter of ['career','research','viasat']){
  await page.evaluate(id=>scrollTo(0,document.getElementById(id)!.offsetTop),chapter);
  await expect(page.locator('html')).toHaveAttribute('data-progress',chapter==='career'?'12.0000':chapter==='research'?'14.0000':'16.0000');
  const buttons=page.locator(`#${chapter} [data-technology]`);
  for(let i=0;i<await buttons.count();i++){
   const button=buttons.nth(i),id=await button.getAttribute('data-technology');const y=await page.evaluate(()=>scrollY);
   await button.click();await expect(dialog(page)).toHaveAttribute('data-technology',id!);
   await expect(dialog(page)).toBeVisible();await expect(page.locator('.logo-viewport canvas')).toBeVisible();
   const shape=await page.locator('.logo-viewport').screenshot();
   const blank=await page.locator('.logo-viewport').screenshot({style:'canvas {visibility:hidden!important}'});
   expect(shape.equals(blank)).toBe(false);
   await close(page);await expect(button).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(y);
   await expect(page.locator('.journey-stage canvas')).toBeAttached();
  }
 }
 await page.goto('about:blank');expect(errors).toEqual([]);
});

test('inspection rotation, zoom, reset, focus trap and scroll locking work',async({page})=>{
 const errors=errorsFrom(page);await ready(page);await page.locator('#career [data-technology="go"]').click();
 const viewport=page.locator('.logo-viewport');const original=await viewport.screenshot();const y=await page.evaluate(()=>scrollY);
 await page.getByRole('button',{name:'Rotate left',exact:true}).click();expect((await viewport.screenshot()).equals(original)).toBe(false);
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();const zoomed=await viewport.screenshot();
 await page.getByRole('button',{name:'Zoom out',exact:true}).click();expect((await viewport.screenshot()).equals(zoomed)).toBe(false);
 await page.getByRole('button',{name:'Reset view'}).click();expect((await viewport.screenshot()).equals(original)).toBe(true);
 // Safari does not focus buttons on pointer clicks; start this keyboard check explicitly.
 await page.getByRole('button',{name:'Reset view'}).focus();
 await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Close technology inspection'})).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Reset view'})).toBeFocused();
 await page.mouse.wheel(0,650);expect(await page.evaluate(()=>scrollY)).toBe(y);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.keyboard.press('Escape');await expect(dialog(page)).not.toBeVisible();
 await page.goto('about:blank');expect(errors).toEqual([]);
});

test('responsive inspection survives resizing and reduced-motion changes',async({page})=>{
 const errors=errorsFrom(page);await ready(page);
 for(const [width,height] of [[390,844],[320,568],[844,390],[1440,900]]){
  await page.setViewportSize({width,height});await page.locator('#career [data-technology="go"]').click();
  const box=await dialog(page).boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.width).toBeLessThanOrEqual(width);
  await page.getByRole('button',{name:'Reset view'}).scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Reset view'}).click();
  await page.setViewportSize({width:width+20,height:height+20});await page.keyboard.press('Escape');
  await expect(page.locator('#career [data-technology="go"]')).toBeFocused();
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#career [data-technology="go"]').click();
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(dialog(page)).not.toBeVisible();
 await page.goto('about:blank');expect(errors).toEqual([]);
});

test('missing or malformed individual logo retains the other sculptures and content',async({page})=>{
 for(const body of ['', '<svg xmlns="http://www.w3.org/2000/svg"></svg>','not an svg']){
  await page.route('**/logos/go.svg',route=>route.fulfill({status:body?200:503,contentType:'image/svg+xml',body}));
  await page.goto('/?still#career');await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
  await expect(page.locator('#career [data-technology="go"]')).toBeHidden();
  await page.locator('#career [data-technology="redis"]').click();await expect(dialog(page)).toBeVisible();await close(page);
  await page.unroute('**/logos/go.svg');
 }
});

test('context loss during inspection restores compact readable content and releases the modal',async({page})=>{
 await ready(page,'?still&webgl#career');await page.locator('#career [data-technology="go"]').click();
 await page.locator('canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
 await expect(page.locator('html')).toHaveAttribute('data-graphics','fallback');await expect(dialog(page)).not.toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.classList.contains('logo-inspecting'))).toBe(false);
 if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Contact',exact:true}).click();await expect(page.locator('#contact')).toBeInViewport();
});

test('3D logo picking opens inspection but dragging does not',async({page})=>{
 await ready(page);await page.waitForTimeout(200);
 await page.mouse.move(900,430);await page.mouse.down();await page.mouse.move(980,430,{steps:5});await page.mouse.up();
 await expect(dialog(page)).not.toBeVisible();
 // Probe the rendered Go sculpture rather than any HTML trigger; holes aren't pickable.
 for(const [x,y] of [[940,430],[900,430],[1000,420],[920,400]]){
  await page.mouse.click(x,y);if(await dialog(page).isVisible())break;
 }
 await expect(dialog(page)).toBeVisible();await expect(dialog(page)).toHaveAttribute('data-technology','go');await close(page);
});

test('touch gestures manipulate a sculpture while the mobile journey stays fixed',async({browser,browserName})=>{
 test.skip(browserName!=='chromium','CDP touch injection requires Chromium; other engines exercise the shared controls above.');
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage();await ready(page);const y0=await page.evaluate(()=>scrollY);
 await page.locator('#career [data-technology="go"]').tap();const viewport=page.locator('.logo-viewport');
 const before=await viewport.screenshot();const box=(await viewport.boundingBox())!;
 const x=box.x+box.width/2,y=box.y+box.height/2,cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+60,y:y+30}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const rotated=await viewport.screenshot();expect(rotated.equals(before)).toBe(false);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y},{x:x+30,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-60,y},{x:x+60,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect((await viewport.screenshot()).equals(rotated)).toBe(false);expect(await page.evaluate(()=>scrollY)).toBe(y0);
 await page.getByRole('button',{name:'Close technology inspection'}).tap();expect(await page.evaluate(()=>scrollY)).toBe(y0);
 await context.close();
});

test('a slow optional logo times out without disabling the journey',async({page})=>{
 await page.route('**/logos/go.svg',async route=>{await new Promise(resolve=>setTimeout(resolve,6500));await route.abort().catch(()=>{});});
 await page.goto('/?still#career');await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
 await expect(page.locator('#career [data-technology="go"]')).toBeHidden();
 await page.locator('#career [data-technology="kafka"]').click();await expect(dialog(page)).toBeVisible();await close(page);
 if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Contact',exact:true}).click();await expect(page.locator('#contact')).toBeInViewport();
});
