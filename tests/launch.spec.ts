import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { socials } from '../src/data/profile';

test('search metadata identifies the person and only the canonical portfolio is indexable', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Kashif Manzer — Backend & Infrastructure Engineer');
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await page.locator('h1').textContent()).toContain('Kashif Manzer Engineering');
  expect(await page.locator('link[rel=canonical]').getAttribute('href')).toBe('https://kashifmanzer.github.io/');
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(data['@type']).toBe('ProfilePage');
  expect(data.mainEntity.sameAs).toEqual(socials.map(s=>s.href));
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe('https://kashifmanzer.github.io/social-card.png');
  expect((await request.get('/social-card.png')).headers()['content-type']).toContain('image/png');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('<loc>https://kashifmanzer.github.io/</loc>');
  expect(sitemap).not.toMatch(/observatory|direction|404/);
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://kashifmanzer.github.io/sitemap.xml');
  for(const route of ['/observatory/','/404.html']) {
    await page.goto(route); await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex, follow');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  }
  expect((await request.get('/not-a-real-portfolio-page/')).status()).toBe(404);
});

test('legacy direction links preserve fragments and parameters', async ({ page }) => {
  await page.goto('/direction/?still&webgl#career');
  await expect(page).toHaveURL(/\/?\?still&webgl#career$/);
  await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
  await expect(page.locator('html')).toHaveAttribute('data-progress','12.0000');
});

test('social destinations, local icons and contact navigation work without JavaScript', async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();await page.goto('/');
  await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Contact',exact:true}).click();
  await expect(page.locator('#contact')).toBeInViewport();
  for(const social of socials) {
    const link=page.locator(`#contact a[href="${social.href}"]`);
    await expect(link).toHaveAttribute('target','_blank');
    await expect(link).toHaveAttribute('rel',/noopener noreferrer/);
    expect(await link.locator('img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  }
  await context.close();
});

test('mobile menu supports keyboard, outside dismissal, and contact survives motion changes', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});await page.goto('/?still&webgl');
  await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
  const summary=page.locator('.mobile-menu summary');await summary.click();await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open','');
  await summary.click();await page.locator('h1').click();await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open','');
  await summary.click();await page.getByRole('link',{name:'Contact',exact:true}).click();
  await expect(page.locator('#contact')).toBeFocused();
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open','');
  await page.locator('#reduce-motion').click();await expect(page.locator('#contact')).toBeInViewport();
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});

test('extended journey retains camera milestones and contact fits all viewport sizes', async ({ page }) => {
  await page.goto('/?still&webgl');await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
  expect(await page.locator('#career').evaluate(e=>(e.getBoundingClientRect().top+scrollY)/innerHeight)).toBeCloseTo(4.5,1);
  expect(await page.locator('#impact').evaluate(e=>(e.getBoundingClientRect().top+scrollY)/innerHeight)).toBeCloseTo(9,1);
  expect(await page.locator('#contact').evaluate(e=>(e.getBoundingClientRect().top+scrollY)/innerHeight)).toBeCloseTo(11,1);
  for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,568],[844,390]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{const e=document.getElementById('contact')!;scrollTo(0,e.getBoundingClientRect().top+scrollY);});
    await expect(page.locator('html')).toHaveAttribute('data-progress','22.0000');
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const link of await page.locator('#contact a').all()) {
      const box=(await link.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});
