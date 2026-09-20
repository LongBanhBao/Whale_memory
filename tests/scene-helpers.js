import { expect } from '@playwright/test';
import { FINALE_DURATION } from '../src/data/journey.js';
import { JOURNEY_DURATION } from '../src/effects/journey-motion.js';
import { STORM_DURATION } from '../src/effects/storm-motion.js';

const elapsedByPage = new WeakMap();
const stormClicksByPage = new WeakMap();
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
    if (current === 'blue-road') stormClicksByPage.set(page, 0);
  }
  const target = progress * [0, JOURNEY_DURATION * 1000, STORM_DURATION * 1000, FINALE_DURATION * 1000][ids.indexOf(selector)];
  if (selector === '#storm') {
    const clicksNeeded = progress > .37 ? 3 : progress > .225 ? 2 : progress > .08 ? 1 : 0;
    for (let click = stormClicksByPage.get(page) || 0; click < clicksNeeded; click += 1) {
      const whale = page.locator('#storm-whale-control');
      await expect(whale).toBeVisible({ timeout: 12_000 });
      await whale.click();
      stormClicksByPage.set(page, click + 1);
    }
    await expect.poll(() => page.locator('.storm-world').evaluate(node => (
      Number(node.style.getPropertyValue('--storm-progress'))
    )), { timeout: 30_000 }).toBeGreaterThanOrEqual(progress - .005);
    elapsedByPage.set(page, target);
    return;
  }
  await page.waitForTimeout(Math.max(0, target - (elapsedByPage.get(page) || 0)) + 100);
  elapsedByPage.set(page, target);
}
