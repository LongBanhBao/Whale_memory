import { expect, test } from '@playwright/test';
import { goToProgress } from './scene-helpers.js';

// Scene 3 intentionally runs for 24 seconds now; the desktop capture traverses
// the full four-scene experience and needs headroom on a saturated CI worker.
test.setTimeout(180_000);

const pause = (page) => page.waitForTimeout(550);


test('chụp các cảnh chính để kiểm tra trực quan', async ({ page }) => {
  await page.goto('/');
  await pause(page);
  await page.screenshot({ path: 'test-results/intro-dark.png' });
  await page.locator('#hold-control').hover();
  await page.mouse.down();
  await page.waitForTimeout(620);
  await page.screenshot({ path: 'test-results/intro-drops.png' });
  await page.waitForTimeout(6_030);
  await page.mouse.up();
  await page.screenshot({ path: 'test-results/intro-ocean.png' });
  await page.waitForTimeout(1_700);
  await page.screenshot({ path: 'test-results/intro-return.png' });
  await page.waitForTimeout(2_250);
  await page.screenshot({ path: 'test-results/intro-whale-emerging.png' });
  await expect(page.locator('#memory-drops')).toHaveClass(/is-complete/, { timeout: 8_000 });
  await page.screenshot({ path: 'test-results/intro-whale.png' });
  await goToProgress(page, '#blue-road', 0.39);
  await page.screenshot({ path: 'test-results/journey-desktop.png' });

  await goToProgress(page, '#blue-road', 0.92);
  await page.screenshot({ path: 'test-results/journey-gate-desktop.png' });

  await goToProgress(page, '#storm', 0.53);
  await page.screenshot({ path: 'test-results/storm-desktop.png' });

  await goToProgress(page, '#storm', 0.93);
  await page.screenshot({ path: 'test-results/storm-breakthrough-desktop.png' });

  await goToProgress(page, '#ocean-remembers', 0.92);
  await page.screenshot({ path: 'test-results/finale-desktop.png' });
  await page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' }).click();
  await page.waitForTimeout(1_800);
  await page.screenshot({ path: 'test-results/finale-outro-desktop.png' });
});

test('chụp cảnh đầu trên mobile', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await pause(page);
  await page.screenshot({ path: 'test-results/intro-mobile.png' });
  await page.locator('#hold-control').hover();
  await page.mouse.down();
  await page.waitForTimeout(6_650);
  await page.mouse.up();
  await page.screenshot({ path: 'test-results/intro-ocean-mobile.png' });
  await expect(page.locator('#memory-drops')).toHaveClass(/is-complete/, { timeout: 12_000 });
  await page.screenshot({ path: 'test-results/intro-whale-mobile.png' });
  await goToProgress(page, '#blue-road', 0.39);
  await page.screenshot({ path: 'test-results/journey-mobile.png' });
  await goToProgress(page, '#ocean-remembers', 0.92);
  await page.screenshot({ path: 'test-results/finale-mobile.png' });
  await page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' }).click();
  await page.waitForTimeout(1_800);
  await page.screenshot({ path: 'test-results/finale-outro-mobile.png' });
  await context.close();
});
