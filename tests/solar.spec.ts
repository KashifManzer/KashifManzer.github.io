import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, query = '') {
  await page.goto('/observatory/' + query);
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready');
  await page.locator('#explore').click();
  await expect(page.locator('#solar-system')).toBeVisible();
}
async function frame(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test('all eight planets render distinct close-ups; overview, focus, and Earth return work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  const dialog = page.locator('#solar-system');
  await expect(dialog).toHaveAttribute('data-travel', 'arrived');
  await frame(page);
  const overview = await page.locator('.solar-viewport').screenshot();
  expect(overview.equals(await page.locator('.solar-viewport').screenshot({ style: '.stage { visibility: hidden !important; }' }))).toBe(false);
  await page.screenshot({ path: 'test-results/solar-overview-desktop.png' });
  let previous: Awaited<ReturnType<Page['screenshot']>> | undefined;
  for (const name of ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) {
    await dialog.getByRole('button', { name, exact: true }).click();
    await expect(dialog.locator('.planet-name')).toHaveText(name);
    await expect(dialog.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await frame(page);
    const rendered = await page.locator('canvas').screenshot();
    if (previous) expect(rendered.equals(previous)).toBe(false);
    previous = rendered;
    await page.screenshot({ path: `test-results/solar-${name.toLowerCase()}.png` });
  }
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await dialog.getByRole('button', { name: 'All planets', exact: false }).click();
  await expect(dialog).toHaveAttribute('data-destination', 'overview');
  await page.keyboard.press('Escape');
  await expect(page.locator('#explore')).toBeFocused();
  expect(await page.locator('.scene-home canvas').count()).toBe(1);
  await page.locator('#inspect').click();
  await expect(page.locator('#inspection')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('journeys can be interrupted, planets can be clicked in 3D, motion can be paused', async ({ page }) => {
  await open(page);
  const dialog = page.locator('#solar-system');
  await dialog.getByRole('button', { name: 'Mars', exact: true }).click();
  await expect(dialog).toHaveAttribute('data-travel', 'travelling');
  await dialog.getByRole('button', { name: 'Saturn', exact: true }).click();
  await expect(dialog).toHaveAttribute('data-travel', 'arrived');
  await dialog.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await frame(page);
  const still = await page.locator('canvas').screenshot();
  await page.waitForTimeout(250);
  expect((await page.locator('canvas').screenshot()).equals(still)).toBe(true);
  await dialog.getByRole('button', { name: 'All planets', exact: false }).click();
  await frame(page);
  const marker = dialog.locator('[data-planet-label="4"]');
  await expect(marker).toBeVisible();
  const projected = await marker.evaluate(element => { const m = new DOMMatrix(getComputedStyle(element).transform); return { x: m.m41, y: m.m42 }; });
  const viewport = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(viewport.x + projected.x - 3, viewport.y + projected.y - 3);
  await expect(dialog).toHaveAttribute('data-destination', 'Jupiter');
  await dialog.getByRole('button', { name: 'Resume motion', exact: true }).click();
  await dialog.getByRole('button', { name: 'Mercury', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#explore')).toBeFocused();
});

test('solar exploration fits mobile and landscape, traps focus, and survives context loss', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '?webgl');
  const dialog = page.locator('#solar-system');
  for (const [width, height] of [[390, 844], [320, 568], [844, 390], [768, 1024]]) {
    await page.setViewportSize({ width, height });
    if (await dialog.locator('.solar-overview').isVisible()) await dialog.locator('.solar-overview').click();
    await frame(page);
    await page.screenshot({ path: `test-results/solar-overview-${width}.png` });
    await dialog.getByRole('button', { name: 'Saturn', exact: true }).click();
    await frame(page);
    for (const control of await dialog.locator('.solar-close, .solar-overview, nav button, .solar-motion').all()) {
      const box = (await control.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(height);
    }
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `test-results/solar-saturn-${width}.png` });
    await dialog.getByRole('button', { name: 'Return to Earth', exact: false }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('link', { name: 'Discover the planets at NASA', exact: false })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Return to Earth', exact: false })).toBeFocused();
  }
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'fallback');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#explore')).toBeHidden();
  await expect(page.locator('html')).not.toHaveClass(/inspecting/);
});
