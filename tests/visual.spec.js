import { test } from '@playwright/test';

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
  await page.screenshot({ path: 'test-results/intro-desktop.png' });

  const holdBox = await page.locator('#hold-control').boundingBox();
  await page.mouse.move(holdBox.x + holdBox.width / 2, holdBox.y + holdBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2_750);
  await page.screenshot({ path: 'test-results/intro-holding.png' });
  await page.mouse.up();

  await page.locator('#skip-intro').click();
  await pause(page);
  await goToProgress(page, '#blue-road', 0.39);
  await page.screenshot({ path: 'test-results/journey-desktop.png' });

  await goToProgress(page, '#storm', 0.68);
  await page.screenshot({ path: 'test-results/storm-desktop.png' });

  await goToProgress(page, '#ocean-remembers', 0.82);
  await page.screenshot({ path: 'test-results/finale-desktop.png' });
});

test('chụp cảnh đầu trên mobile', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await pause(page);
  await page.screenshot({ path: 'test-results/intro-mobile.png' });
  await page.locator('#skip-intro').click();
  await pause(page);
  await goToProgress(page, '#blue-road', 0.39);
  await page.screenshot({ path: 'test-results/journey-mobile.png' });
  await goToProgress(page, '#ocean-remembers', 0.82);
  await page.screenshot({ path: 'test-results/finale-mobile.png' });
  await context.close();
});
