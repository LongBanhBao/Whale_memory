import { expect, test } from '@playwright/test';
import { goToProgress } from './scene-helpers.js';

async function expectMobileWhaleBelowTitle(page) {
  const boxes = await page.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width };
    };
    return { whale: box('#intro-whale-swimmer'), copy: box('.finale-copy'), cow: box('#letter-courier'), height: innerHeight };
  });
  expect(boxes.whale.top).toBeGreaterThan(boxes.copy.bottom + 8);
  expect(boxes.whale.left).toBeGreaterThanOrEqual(0);
  expect(boxes.whale.right).toBeLessThan(boxes.cow.left - 8);
  expect(boxes.whale.bottom).toBeLessThan(boxes.height);
  expect(boxes.whale.width).toBeGreaterThan(110);
}

for (const mobile of [false, true]) {
  test(`cá voi nhận và mở thư, đóng và bắt đầu lại — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('#take-letter')).toBeDisabled();
    await goToProgress(page, '#ocean-remembers', .91);
    await page.locator('#send-light').click();
    const button = page.getByRole('button', { name: 'Nhận thư từ chú bò' });
    await expect(button).toBeEnabled({ timeout: 26_000 });
    await expect.poll(() => page.locator('#boa-courier').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    if (mobile) {
      await expectMobileWhaleBelowTitle(page);
      await page.evaluate(() => {
        window.letterApproach = [];
        const sample = () => {
          const phase = document.querySelector('.finale-world').dataset.letterPhase;
          if (phase === 'carrying') return;
          if (phase === 'approaching') window.letterApproach.push(parseFloat(document.querySelector('#intro-whale-swimmer').style.getPropertyValue('--whale-x')));
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
    }
    await page.screenshot({ path: testInfo.outputPath('courier-waiting.png') });
    await button.click();
    await expect(page.locator('.finale-world')).toHaveAttribute('data-letter-phase', 'approaching');
    await expect(page.locator('#open-gallery')).toBeDisabled();
    await expect(page.locator('#intro-whale-swimmer > #courier-scroll')).toHaveCount(1);
    if (mobile) {
      const approach = await page.evaluate(() => window.letterApproach);
      expect(approach.length).toBeGreaterThan(2);
      expect(approach.at(-1) - approach[0]).toBeGreaterThan(20);
      expect(approach.every((x, i) => !i || x >= approach[i - 1] - .01)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath('courier-carrying.png') });
    const dialog = page.locator('#letter-dialog');
    await expect(dialog).toBeVisible({ timeout: 7_000 });
    await expect(page.locator('.letter-parchment__words')).toHaveCSS('opacity', '1');
    await expect(dialog).toContainText('Đại dương này vẫn nhớ.');
    await expect(dialog).toContainText('Cảm ơn vì đã bắt đầu');
    await expect.poll(() => page.locator('#letter-scroll-art').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({ path: testInfo.outputPath('letter-reading.png') });
    if (mobile) await page.getByRole('button', { name: 'Đóng thư tri ân' }).click();
    else await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(button).toBeEnabled();
    if (mobile) await expectMobileWhaleBelowTitle(page);
    await expect(page.locator('#take-letter > #courier-scroll')).toHaveCount(1);
    await expect(page.locator('#outro-fireworks')).toHaveAttribute('data-active', 'true');
    await button.click();
    await page.locator('.wordmark').click();
    await expect(page.locator('#memory-drops')).toBeVisible();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('#take-letter > #courier-scroll')).toHaveCount(1);
    await expect(page.locator('#take-letter')).toBeDisabled();
    await expect(page.locator('#intro-whale-swimmer')).not.toHaveCSS('visibility', 'hidden');
    expect(errors).toEqual([]);
  });
}

test('thư mở trực tiếp khi giảm chuyển động và có thể đọc lại', async ({ page }) => {
  test.setTimeout(45_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await goToProgress(page, '#ocean-remembers', .91);
  await page.locator('#send-light').click();
  const button = page.locator('#take-letter');
  await button.click();
  await expect(page.locator('#letter-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('#letter-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng thư tri ân' }).click();
  await expect(button).toBeFocused();
});

for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
  test(`mobile whale clears text and cow at ${viewport.width}×${viewport.height}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    for (let i = 0; i < 3; i += 1) await page.locator('#scene-next').click();
    await page.locator('#send-light').click();
    await expect(page.locator('#take-letter')).toBeEnabled();
    await expectMobileWhaleBelowTitle(page);
    await expect.poll(() => page.locator('#boa-courier, #finale-portrait-image').evaluateAll(nodes => nodes.every(img => img.naturalWidth > 0))).toBe(true);
    await page.locator('#boa-courier, #finale-portrait-image').evaluateAll(nodes => Promise.all(nodes.map(img => img.decode())));
    await page.screenshot({ path: testInfo.outputPath('mobile-whale-layout.png') });
    if (viewport.width === 430) {
      await page.setViewportSize({ width: 844, height: 390 });
      await expect.poll(() => page.locator('#intro-whale-swimmer').evaluate(node => node.getBoundingClientRect().right)).toBeLessThan(250);
      await expectMobileWhaleBelowTitle(page);
    }
    await context.close();
  });
}
