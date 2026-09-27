import { expect, test } from '@playwright/test';
import { goToProgress } from './scene-helpers.js';

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
    await page.screenshot({ path: testInfo.outputPath('courier-waiting.png') });
    await button.click();
    await expect(page.locator('.finale-world')).toHaveAttribute('data-letter-phase', 'approaching');
    await expect(page.locator('#open-gallery')).toBeDisabled();
    await expect(page.locator('#intro-whale-swimmer > #courier-scroll')).toHaveCount(1);
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
