import { expect, test } from '@playwright/test';

test('chuyển cảnh bằng tiếp, không cuộn, và xem lại hành trình', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#hold-label')).toHaveText('CHẠM ĐỂ BẮT ĐẦU');
  const next = page.getByRole('button', { name: 'tiếp', exact: true });
  const scenes = ['memory-drops', 'blue-road', 'storm', 'ocean-remembers'];
  for (let index = 0; index < scenes.length; index += 1) {
    await expect(page.locator('.scene:visible')).toHaveCount(1);
    await expect(page.locator(`#${scenes[index]}`)).toBeVisible();
    await page.mouse.wheel(0, 1500);
    await page.keyboard.press('PageDown');
    await expect(page.locator(`#${scenes[index]}`)).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    if (index < 3) await next.click();
  }
  await expect(next).toBeHidden();
  await page.locator('#send-light').click();
  await page.locator('#open-gallery').click();
  await expect(page.locator('#gallery-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng thư viện ảnh' }).click();
  await page.locator('#replay-journey').click();
  await expect(page.locator('#memory-drops')).toBeVisible();
  await expect(next).toBeVisible();
  await expect(page.locator('#hold-control')).toBeEnabled();
  expect(errors).toEqual([]);
});

test('cảnh chạy tự động và dừng khi chuyển cảnh trên điện thoại', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.intro-world')).toHaveAttribute('data-stage', 'drops');
  await page.locator('#scene-next').click();
  const progress = () => page.locator('.journey-world').evaluate((node) => Number(node.style.getPropertyValue('--journey-progress')));
  await expect.poll(progress).toBeGreaterThan(0.01);
  await page.locator('#scene-next').click();
  const stopped = await progress();
  await page.waitForTimeout(250);
  expect(await progress()).toBe(stopped);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('#storm')).toBeVisible();
});
