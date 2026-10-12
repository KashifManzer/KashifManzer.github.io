import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('scroll journey and reduced motion work across engines',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
  await page.goto('/?webgl&still');
  await expect(page.locator('html')).toHaveAttribute('data-graphics','ready');
  for(const [width,height] of [[1440,900],[390,844]]) {
    await page.setViewportSize({width,height});
    for(const name of ['approach','arrival','descent','career','research','viasat']) {
      await page.evaluate(name=>scrollTo(0,document.getElementById(name)!.offsetTop),name);
      await expect(page.locator('html')).toHaveAttribute('data-rendered-frame',name);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }
  if(await page.locator('.mobile-menu:not([open]) summary').isVisible()) await page.locator('.mobile-menu summary').click();
  await page.getByRole('link',{name:'Selected work',exact:true}).click();
  await expect(page.locator('#work')).toBeFocused();
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);
  await page.locator('#reduce-motion').click();
  await expect(page.locator('#reduce-motion')).toHaveAttribute('aria-pressed','true');
  expect(errors).toEqual([]);
});
