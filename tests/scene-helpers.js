import { expect } from '@playwright/test';

const elapsedByPage = new WeakMap();
export async function goToProgress(page, selector, progress) {
  const ids = ['#memory-drops', '#blue-road', '#storm', '#ocean-remembers'];
  await expect(page.locator('.intro-world')).toHaveAttribute('data-stage', /drops|pause|whale/);
  while (!(await page.locator(selector).isVisible())) {
    await page.locator('#scene-next').click();
    elapsedByPage.set(page, 0);
  }
  const target = progress * [0, 18000, 14000, 12000][ids.indexOf(selector)];
  await page.waitForTimeout(Math.max(0, target - (elapsedByPage.get(page) || 0)) + 100);
  elapsedByPage.set(page, target);
}
