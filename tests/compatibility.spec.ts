import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('WebGL scene, accessible inspection, motion and anchors work across engines', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/observatory/?webgl');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready');
  await expect(page.locator('canvas')).toHaveAttribute('data-renderer', 'webgl');
  await expect(page.locator('#motion')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#inspect').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Reset view' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close', exact: false })).toBeFocused();
  for (const action of ['left', 'up', 'in', 'out', 'reset']) await page.locator(`[data-action="${action}"]`).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Close', exact: false })).toBeVisible();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const rendered = await page.locator('.inspection-viewport').screenshot();
  const blank = await page.locator('.inspection-viewport').screenshot({ style: '.stage { visibility: hidden !important; }' });
  expect(rendered.equals(blank)).toBe(false);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-inspection.png` });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#inspect')).toBeFocused();
  await page.locator('#motion').click();
  await expect(page.locator('#motion')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('link', { name: 'Scene guide', exact: true }).click();
  await expect(page.locator('#work')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Back to top ↑', exact: true }).click();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(errors).toEqual([]);
});

test('static content and local poster survive unavailable graphics', async ({ page }) => {
  await page.route('**/textures/earth-*.webp', route => route.abort());
  await page.goto('/observatory/?webgl');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('#inspect')).toBeHidden();
  await expect(page.locator('.scene-poster')).toBeVisible();
  expect(await page.locator('.scene-poster img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.getByRole('link', { name: 'Scene guide', exact: true }).click();
  await expect(page.locator('#work')).toBeFocused();
});

test('solar system visits all planets and returns to Earth across engines', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/observatory/?webgl');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready');
  await page.locator('#explore').click();
  const dialog = page.locator('#solar-system');
  for (const name of ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) {
    await dialog.getByRole('button', { name, exact: true }).click();
    await expect(dialog.locator('.planet-name')).toHaveText(name);
    await expect(dialog).toHaveAttribute('data-travel', 'arrived');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.getByRole('button', { name: 'Saturn', exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#explore')).toBeFocused();
  await expect(page.locator('.scene-home canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
