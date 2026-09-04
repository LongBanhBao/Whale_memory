import { expect, test } from '@playwright/test';

const pause = (page) => page.waitForTimeout(550);

async function goToProgress(page, selector, progress) {
  await page.evaluate(({ selector: sectionSelector, progress: sectionProgress }) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const section = document.querySelector(sectionSelector);
    window.scrollTo(0, section.offsetTop + (section.offsetHeight - innerHeight) * sectionProgress);
  }, { selector, progress });
  await pause(page);
}

test('chụp các cảnh chính để kiểm tra trực quan', async ({ page }) => {
  await page.goto('/');
  await pause(page);
  await page.screenshot({ path: 'test-results/intro-dark.png' });
  await goToProgress(page, '#memory-drops', 0.19);
  await page.screenshot({ path: 'test-results/intro-drops.png' });
  await goToProgress(page, '#memory-drops', 0.51);
  await page.screenshot({ path: 'test-results/intro-ocean.png' });
  await goToProgress(page, '#memory-drops', 0.68);
  await page.screenshot({ path: 'test-results/intro-return.png' });
  await goToProgress(page, '#memory-drops', 0.9);
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
  await goToProgress(page, '#memory-drops', 0.51);
  await page.screenshot({ path: 'test-results/intro-ocean-mobile.png' });
  await goToProgress(page, '#memory-drops', 0.9);
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
