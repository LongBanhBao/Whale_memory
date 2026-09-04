import { expect, test } from '@playwright/test';

test('mở intro, hiển thị đủ bốn cảnh và tải asset thành công', async ({ page }) => {
  const failedResponses = [];
  const runtimeErrors = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/The Blue Voyage/);
  await expect(page.locator('body')).toHaveClass(/is-intro-locked/);
  await expect(page.locator('.scene')).toHaveCount(4);

  await page.getByRole('button', { name: 'BỎ QUA MỞ ĐẦU' }).click();
  await expect(page.locator('body')).not.toHaveClass(/is-intro-locked/);
  await expect(page.locator('.portal')).toHaveCount(4);
  await expect(page.locator('.memory-tile')).toHaveCount(40);

  await page.locator('#ocean-remembers').scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await expect(page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' })).toBeAttached();
  expect(failedResponses).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test('chế độ giảm chuyển động dùng thao tác tiếp tục đơn giản', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#hold-label')).toHaveText('TIẾP TỤC');
  await page.locator('#hold-control').click();
  await expect(page.locator('body')).not.toHaveClass(/is-intro-locked/);
  await context.close();
});

test('nhấn giữ tạo đủ năm giọt và mở khóa hành trình', async ({ page }) => {
  await page.goto('/');
  const control = page.locator('#hold-control');
  const box = await control.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(6_000);
  await page.mouse.up();
  await expect(page.locator('.falling-memory')).toHaveCount(5);
  await expect(page.locator('body')).not.toHaveClass(/is-intro-locked/, { timeout: 3_000 });
});

test('ánh sáng cuối hành trình nhập vào cá voi ký ức', async ({ page }) => {
  await page.goto('/');
  await page.locator('#skip-intro').click();
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const section = document.querySelector('#ocean-remembers');
    window.scrollTo(0, section.offsetTop + (section.offsetHeight - innerHeight) * 0.9);
  });
  await page.waitForTimeout(350);
  const button = page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('#memory-whale')).toHaveClass(/is-lit/, { timeout: 3_000 });
});

test('giao diện mobile không tràn ngang', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await page.locator('#skip-intro').click();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
  await context.close();
});
