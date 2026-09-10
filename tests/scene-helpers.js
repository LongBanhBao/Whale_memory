import { expect } from '@playwright/test';
import { JOURNEY_DURATION } from '../src/effects/journey-motion.js';
import { STORM_DURATION } from '../src/effects/storm-motion.js';

const elapsedByPage = new WeakMap();
export async function goToProgress(page, selector, progress) {
  const ids = ['#memory-drops', '#blue-road', '#storm', '#ocean-remembers'];
  await expect(page.locator('.intro-world')).toHaveAttribute('data-stage', /drops|pause|whale/);
  while (!(await page.locator(selector).isVisible())) {
    const current = await page.locator('.scene:visible').getAttribute('id');
    try {
      await page.locator('#scene-next').click({ timeout: 1_500 });
    } catch (error) {
      // Scene 3 advances itself at the end of its light wipe. When a visual
      // capture lands close to 100%, that transition can win the race against
      // the helper click; treat the already-visible target as success.
      if (!(await page.locator(selector).isVisible())) throw error;
    }
    await expect(page.locator(`#${current}`)).toBeHidden({
      timeout: current === 'blue-road' ? 10_000 : 5_000,
    });
    elapsedByPage.set(page, 0);
  }
  const target = progress * [0, JOURNEY_DURATION * 1000, STORM_DURATION * 1000, 12000][ids.indexOf(selector)];
  await page.waitForTimeout(Math.max(0, target - (elapsedByPage.get(page) || 0)) + 100);
  elapsedByPage.set(page, target);
}
