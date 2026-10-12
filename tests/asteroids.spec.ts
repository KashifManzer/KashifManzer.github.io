import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function ready(page: Page, hash = '') {
  await page.goto('/?still&webgl' + hash);
  await expect(page.locator('html')).toHaveAttribute('data-graphics', 'ready');
}
async function seek(page: Page, time: number) {
  await page.evaluate(time => {
    const chapter = [...document.querySelectorAll<HTMLElement>('.chapter')].reverse().find(e => Number(e.dataset.time) <= time)!;
    scrollTo(0, chapter.offsetTop + (time - Number(chapter.dataset.time)) / Number(chapter.dataset.span) * chapter.offsetHeight);
  }, time);
  await expect.poll(() => page.locator('html').getAttribute('data-progress').then(Number)).toBeCloseTo(time, 2);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
test('impacts reverse deterministically and contact jumps directly to four stable links', async ({ page }, testInfo) => {
  await ready(page);
  const view = { style: 'header,main,.flight-hud,.status,.skip{visibility:hidden!important}' };
  await seek(page, 20.2); const first = await page.screenshot(view);
  await seek(page, 21.6); expect((await page.screenshot(view)).equals(first)).toBe(false);
  await seek(page, 18.4); await seek(page, 20.2);
  const reversed = await page.screenshot(view);
  if (!reversed.equals(first)) { await testInfo.attach('forward', {body:first,contentType:'image/png'}); await testInfo.attach('reversed',{body:reversed,contentType:'image/png'}); }
  expect(reversed.equals(first)).toBe(true);
  await page.getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-progress', '22.0000');
  await expect(page.locator('#contact')).toBeFocused();
  await expect(page.locator('a[data-social]')).toHaveCount(4);
  // Hiding main would blur its focused link and intentionally clear the highlight.
  const sky = { clip: { x: 0, y: 80, width: 1440, height: 320 } };
  const unlit = await page.screenshot(sky);
  await page.locator('a[data-social="github"]').focus();
  await expect(page.locator('html')).toHaveAttribute('data-social', 'github');
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect((await page.screenshot(sky)).equals(unlit)).toBe(false);
  await page.locator('a[data-social="x"]').hover();
  await expect(page.locator('html')).toHaveAttribute('data-social', 'x');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});
test('legacy work anchors resolve to experience, including without JavaScript', async ({ page, browser }) => {
  await ready(page, '#work');
  await expect(page.locator('html')).toHaveAttribute('data-progress', '12.0000');
  await expect(page.getByRole('heading', { name: 'Behind every transaction.' })).toBeInViewport();
  await expect(page.locator('.project')).toHaveCount(0);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const native = await context.newPage(); await native.goto('/#work');
  await expect(native.locator('#career')).toBeInViewport();
  await context.close();
});
test('keyboard scrolling and wheel use the same timeline as copy and progress', async ({ page }) => {
  await ready(page); await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await page.mouse.wheel(0, 800); await page.waitForTimeout(250);
  const state = await page.evaluate(() => {
    const p = Number(document.documentElement.dataset.progress);
    const section = [...document.querySelectorAll<HTMLElement>('.chapter')].find(e => p >= Number(e.dataset.time) && p < Number(e.dataset.time) + Number(e.dataset.span))!;
    const local = (p - Number(section.dataset.time)) / Number(section.dataset.span);
    return { p, local, opacity: Number(section.querySelector<HTMLElement>('.chapter-copy')!.style.opacity), percent: Number(document.getElementById('flight-percent')!.textContent) };
  });
  const t = Math.max(0, Math.min(1, (state.local - .56) / (.82 - .56)));
  expect(state.opacity).toBeCloseTo(1 - t * t * (3 - 2 * t), 2);
  expect(state.percent).toBe(Math.round(state.p / 22 * 100));
});
test('missing social artwork retains all destinations and settled contact after motion changes', async ({ page }) => {
  await page.route('**/social/*.svg', route => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' }));
  await ready(page, '#contact');
  await expect(page.locator('html')).toHaveAttribute('data-progress', '22.0000');
  await expect(page.locator('a[data-social]')).toHaveCount(4);
  for (const link of await page.locator('a[data-social]').all()) expect(await link.getAttribute('href')).toMatch(/^https:/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#contact')).toBeInViewport();
  await expect(page.locator('#contact .contact-poster')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveAttribute('data-progress', '22.0000');
});
test('context loss at contact retains the settled poster and every social link', async ({ page }) => {
  await ready(page, '#contact');
  await page.locator('canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('html')).toHaveAttribute('data-graphics', 'fallback');
  await expect(page.locator('#contact .contact-poster')).toBeVisible();
  await expect(page.locator('a[data-social]')).toHaveCount(4);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
});
test('navigation during pending social artwork releases initialization cleanly', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let release: () => void = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/social/linkedin.svg', async route => { await held; await route.abort().catch(() => {}); });
  const requested = page.waitForRequest('**/social/linkedin.svg');
  await page.goto('/?webgl'); await requested;
  await page.goto('about:blank'); release();
  expect(errors).toEqual([]);
});

test('a native jump interrupts wheel inertia without snapping back', async ({ page }) => {
  await ready(page);
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(20);
  await seek(page, 20.2);
  await page.waitForTimeout(400);
  await expect.poll(() => page.locator('html').getAttribute('data-progress').then(Number)).toBeCloseTo(20.2, 2);
});

const destinations = {
  linkedin: 'https://www.linkedin.com/in/kashif-manzer/',
  github: 'https://github.com/KashifManzer',
  instagram: 'https://www.instagram.com/tech.with.km/',
  x: 'https://x.com/kashif_manzer',
};
test('settled rocks open every destination with pointer, keyboard and one touch', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  await context.route(/^https:\/\/(www\.)?(linkedin\.com|github\.com|instagram\.com|x\.com)\//, route => route.fulfill({ contentType: 'text/html', body: '<title>Profile destination</title>' }));
  const page = await context.newPage(); await ready(page, '#contact');
  for (const method of ['pointer', 'keyboard', 'touch']) for (const [id, url] of Object.entries(destinations)) {
    const link = page.locator(`a[data-social="${id}"]`);
    await expect(link).toHaveAccessibleName(/opens in a new tab/);
    const popup = context.waitForEvent('page');
    if (method === 'keyboard') { await link.focus(); await page.keyboard.press('Enter'); }
    else if (method === 'touch') await link.tap();
    else await link.click();
    const opened = await popup; await opened.waitForLoadState('domcontentloaded');
    expect(opened.url()).toBe(url); expect(await opened.evaluate(() => window.opener)).toBeNull();
    await opened.close();
    await expect(page.locator('html')).toHaveAttribute('data-progress', '22.0000');
  }
  await context.close();
});
test('projected targets stay separated and on screen after resizing; scrolling and history remain native', async ({ page }) => {
  await ready(page, '#contact');
  for (const [width, height] of [[1440,900],[768,1024],[390,844],[320,568],[844,390]]) {
    await page.setViewportSize({width,height});
    await expect(page.locator('html')).toHaveAttribute('data-progress', '22.0000');
    await page.waitForTimeout(100);
    const boxes = await page.locator('a[data-social]').evaluateAll(links => links.map(link => {
      const b = link.getBoundingClientRect(); return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};
    }));
    for (let i=0;i<boxes.length;i++) {
      const b=boxes[i]; expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);
      expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThan(65);expect(b.right).toBeLessThanOrEqual(width);expect(b.bottom).toBeLessThan(height-24);
      for (const a of boxes.slice(i+1)) expect(b.right<=a.x || a.right<=b.x || b.bottom<=a.y || a.bottom<=b.y).toBe(true);
    }
  }
  await page.locator('a[data-social="linkedin"]').hover();await page.mouse.wheel(0,-650);
  await expect.poll(()=>page.locator('html').getAttribute('data-progress').then(Number)).toBeLessThan(22);
  await expect(page.locator('a[data-social="linkedin"]')).toBeHidden();
  await page.getByRole('link',{name:'Contact',exact:true}).click();
  await page.getByRole('link',{name:'Experience',exact:true}).click();
  await page.goBack();await expect(page.locator('html')).toHaveAttribute('data-progress','22.0000');
});
test('middle click opens a new tab and secondary click does not activate the link', async ({ page, context }) => {
  await context.route('https://github.com/**', route=>route.fulfill({contentType:'text/html',body:'<title>GitHub destination</title>'}));
  await ready(page,'#contact');
  const link=page.locator('a[data-social="github"]');
  await link.click({button:'right'});expect(context.pages()).toHaveLength(1);await page.keyboard.press('Escape');
  const popup=context.waitForEvent('page');await link.click({button:'middle'});
  const opened=await popup;await opened.waitForLoadState('domcontentloaded');expect(opened.url()).toBe(destinations.github);await opened.close();
});
test('failed maps and failed fallback images retain four plain accessible links',async({page})=>{
  await page.route('**/textures/realism/**',route=>route.abort());
  await page.route('**/social/asteroid-*.webp',route=>route.abort());
  await page.goto('/#contact');await expect(page.locator('html')).toHaveAttribute('data-graphics','fallback');
  for(const [id,url] of Object.entries(destinations)){
    const link=page.locator(`a[data-social="${id}"]`);await expect(link).toBeVisible();await expect(link).toHaveAttribute('href',url);await expect(link.locator('.social-name')).toBeVisible();
  }
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});

test('direct contact has the same settled lighting as returning through the impact scene', async ({page},testInfo)=>{
  await ready(page,'#contact');
  const view={style:'header,main,.flight-hud,.status,.skip{visibility:hidden!important}'};
  const direct=await page.screenshot(view);
  await seek(page,18.4);await seek(page,22);
  const returned=await page.screenshot(view);
  if(!direct.equals(returned)){
    await testInfo.attach('direct',{body:direct,contentType:'image/png'});
    await testInfo.attach('returned',{body:returned,contentType:'image/png'});
  }
  expect(returned.equals(direct)).toBe(true);
});

test('animated city and impact transitions retain valid shadow textures in both directions', async ({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto('/?audit');
  await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
  for(const time of [12.3,18.8,20,22,18.8,12.3,0]){
    await seek(page,time);
    await page.waitForTimeout(350);
  }
  expect(errors).toEqual([]);
});
