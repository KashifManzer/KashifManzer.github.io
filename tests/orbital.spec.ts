import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function ready(page: Page, query = '') {
  await page.goto('/observatory/' + query);
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready');
}
async function frame(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('WebGPU and WebGL render without page or shader errors, in both quality tiers', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  for (const query of ['?tier=high', '?tier=low', '?webgl&tier=high', '?webgl&tier=low']) {
    await ready(page, query);
    await expect(page.locator('canvas')).toHaveAttribute('data-renderer', query.includes('webgl') ? 'webgl' : 'webgpu');
    await expect(page.locator('canvas')).toHaveAttribute('data-tier', query.includes('high') ? 'high' : 'low');
    await expect(page.locator('#inspect')).toBeVisible();
    await page.getByRole('link', { name: 'Scene guide', exact: true }).click();
    await expect(page.locator('#work')).toBeFocused();
    expect(await page.evaluate(() => Math.abs(document.querySelector('#work')!.getBoundingClientRect().top))).toBeLessThan(2);
    await page.getByRole('link', { name: 'Back to top ↑', exact: true }).click();
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await noOverflow(page);
  }
  expect(errors).toEqual([]);
});

test('inspection restores scroll and focus, traps keyboard focus, and stays stable over repeated use', async ({ page }) => {
  await ready(page);
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, 140));
    const before = await page.evaluate(() => scrollY);
    await page.locator('#inspect').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close', exact: false })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Reset view' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Close', exact: false })).toBeFocused();
    await page.mouse.wheel(0, 500);
    expect(await page.evaluate(() => scrollY)).toBe(before);
    for (const action of ['left', 'right', 'up', 'down', 'in', 'out', 'reset']) await page.locator(`[data-action="${action}"]`).click();
    if (i % 2) await page.getByRole('button', { name: 'Close', exact: false }).click();
    else await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('#inspect')).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBe(before);
    expect(await page.locator('.scene-home canvas').count()).toBe(1);
    expect(await page.locator('canvas').count()).toBe(1);
  }
});

test('inspection rotation and zoom change the actual render; reset restores it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await page.locator('#inspect').click();
  await frame(page);
  const canvas = page.locator('canvas');
  const initial = await canvas.screenshot();
  await page.locator('[data-action="left"]').click();
  await frame(page);
  expect((await canvas.screenshot()).equals(initial)).toBe(false);
  await page.locator('[data-action="reset"]').click();
  await frame(page);
  expect((await canvas.screenshot()).equals(initial)).toBe(true);
  await page.locator('[data-action="in"]').click();
  await frame(page);
  expect((await canvas.screenshot()).equals(initial)).toBe(false);
  await page.locator('[data-action="reset"]').click();
  await frame(page);
  expect((await canvas.screenshot()).equals(initial)).toBe(true);
});

test('reduced motion is visually stable, responds to OS changes, and can be toggled manually', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await expect(page.locator('#motion')).toHaveAttribute('aria-pressed', 'true');
  const hideContent = { style: 'main, header, footer, .skip { visibility: hidden !important; }' };
  const initial = await page.locator('canvas').screenshot(hideContent);
  await page.waitForTimeout(400);
  expect((await page.locator('canvas').screenshot(hideContent)).equals(initial)).toBe(true);
  await page.getByRole('link', { name: 'Scene guide', exact: true }).click();
  await frame(page);
  // Canvas stays fixed when reduced motion is enabled, even after a jump.
  expect((await page.locator('canvas').screenshot(hideContent)).equals(initial)).toBe(true);
  await page.getByRole('link', { name: 'Back to top ↑', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#motion')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#motion').click();
  await expect(page.locator('#motion')).toHaveAttribute('aria-pressed', 'true');
});

test('Earth and satellite both move slowly on desktop and mobile with either renderer', async ({ page }) => {
  const style = 'main, header, footer, .skip { visibility: hidden !important; }';
  for (const query of ['', '?webgl']) {
    for (const mobile of [false, true]) {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
      await ready(page, query);
      const satellite = mobile ? { x: 0, y: 70, width: 390, height: 260 } : { x: 780, y: 210, width: 620, height: 330 };
      const earth = mobile ? { x: 50, y: 500, width: 290, height: 300 } : { x: 500, y: 680, width: 500, height: 200 };
      const beforeSatellite = await page.screenshot({ clip: satellite, style });
      const beforeEarth = await page.screenshot({ clip: earth, style });
      await page.waitForTimeout(1500);
      expect((await page.screenshot({ clip: satellite, style })).equals(beforeSatellite)).toBe(false);
      expect((await page.screenshot({ clip: earth, style })).equals(beforeEarth)).toBe(false);
      await page.locator('#inspect').click();
      await frame(page);
      const inspection = await page.locator('canvas').screenshot();
      await page.waitForTimeout(200);
      expect((await page.locator('canvas').screenshot()).equals(inspection)).toBe(true);
      await page.keyboard.press('Escape');
    }
  }
});

test('desktop, tablet, narrow mobile and landscape layouts fit; modal adapts on resize', async ({ page }) => {
  await ready(page);
  for (const [width, height] of [[1920, 1080], [1024, 768], [768, 1024], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/observatory/');
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready');
    await noOverflow(page);
    await page.locator('#inspect').click();
    await frame(page);
    const canvas = await page.locator('canvas').boundingBox();
    expect(canvas!.width).toBeGreaterThan(100);
    expect(canvas!.height).toBeGreaterThan(100);
    await page.getByRole('button', { name: 'Reset view' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: 'Scene guide', exact: true }).click();
    await expect(page.locator('#work')).toBeFocused();
    await noOverflow(page);
  }
  await page.goto('/observatory/');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready');
  await page.locator('#inspect').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.screenshot({ path: 'test-results/inspection-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#inspect')).toBeFocused();
});

test('touch drag and pinch affect only the inspection canvas', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await ready(page);
  await page.locator('#inspect').tap();
  await frame(page);
  const initial = await page.locator('canvas').screenshot();
  const box = (await page.locator('canvas').boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 60, y: y + 30 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await frame(page);
  expect((await page.locator('canvas').screenshot()).equals(initial)).toBe(false);
  const rotated = await page.locator('canvas').screenshot();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 30, y }, { x: x + 30, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 60, y }, { x: x + 60, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await frame(page);
  expect((await page.locator('canvas').screenshot()).equals(rotated)).toBe(false);
  await page.getByRole('button', { name: 'Close', exact: false }).tap();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await context.close();
});

test('accessible page and modal have no automated WCAG A/AA violations', async ({ page }) => {
  await ready(page);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.locator('#inspect').click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('no JavaScript: poster, copy and native anchors remain usable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/observatory/');
  await expect(page.locator('h1')).toContainText('Space');
  await expect(page.locator('#inspect')).toBeHidden();
  await expect(page.locator('#motion')).toBeHidden();
  expect(await page.locator('.scene-poster img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.getByRole('link', { name: 'Scene guide', exact: true }).click();
  expect(await page.evaluate(() => Math.abs(document.querySelector('#work')!.getBoundingClientRect().top))).toBeLessThan(2);
  await page.screenshot({ path: 'test-results/no-javascript.png' });
  await context.close();
});

test('unavailable graphics and missing texture preserve the poster and text', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.includes('webgl') || type === 'webgpu') return null;
      return original.call(this, type, ...args);
    } as typeof original;
    Object.defineProperty(navigator, 'gpu', { value: undefined });
  });
  await page.goto('/observatory/?webgl');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('#inspect')).toBeHidden();
  await expect(page.locator('.scene-poster')).toBeVisible();
  await page.getByRole('link', { name: 'Scene guide', exact: true }).click();
  await expect(page.locator('#work')).toBeFocused();
});

test('a failed required asset returns to the static composition', async ({ page }) => {
  await page.route('**/textures/earth-*.webp', route => route.abort());
  await page.goto('/observatory/');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('#inspect')).toBeHidden();
  await expect(page.locator('.scene-poster')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
});

test('graphics context loss during inspection safely closes the modal', async ({ page }) => {
  await ready(page, '?webgl');
  await page.locator('#inspect').click();
  await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext();
  });
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/inspecting/);
  await expect(page.locator('.scene-poster')).toBeVisible();
  await page.getByRole('link', { name: 'Scene guide', exact: true }).click();
  await expect(page.locator('#work')).toBeFocused();
});

test('a slow asset cannot block content or leave a permanent graphics load', async ({ page }) => {
  await page.route('**/textures/earth-*.webp', async route => {
    await new Promise(resolve => setTimeout(resolve, 17000));
    await route.abort().catch(() => {});
  });
  await page.goto('/observatory/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Scene guide', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('#inspect')).toBeHidden();
});

test('deep links, a 200%-zoom-equivalent viewport and the 404 route retain readable content', async ({ page }) => {
  await ready(page, '#work');
  expect(await page.evaluate(() => Math.abs(document.querySelector('#work')!.getBoundingClientRect().top))).toBeLessThan(2);
  await page.getByRole('link', { name: 'Back to top ↑', exact: true }).click();
  // Browser layout zoom halves the CSS viewport; CSS `zoom` does not update media queries.
  await page.setViewportSize({ width: 720, height: 450 });
  await noOverflow(page);
  await page.screenshot({ path: 'test-results/zoom-200.png' });
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { name: 'Nothing here.' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to the start' }).click();
  await expect(page.locator('h1')).toContainText('Kashif');
});

test('WebGL fallback is automatic when WebGPU is unavailable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined }));
  await ready(page);
  await expect(page.locator('canvas')).toHaveAttribute('data-renderer', 'webgl');
  await page.locator('#inspect').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#inspect')).toBeFocused();
});

test('leaving the page cleans up controls even if inspection was never opened', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const inspect of [false, true]) {
    await ready(page);
    if (inspect) { await page.locator('#inspect').click(); await page.keyboard.press('Escape'); }
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  }
  expect(errors).toEqual([]);
});
