import { expect, test } from '@playwright/test';

async function goToProgress(page, selector, progress) {
  await page.evaluate(({ selector: sectionSelector, progress: sectionProgress }) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const section = document.querySelector(sectionSelector);
    window.scrollTo(0, section.offsetTop + (section.offsetHeight - innerHeight) * sectionProgress);
  }, { selector, progress });
  await page.waitForTimeout(220);
}

test('tải đủ bốn cảnh và toàn bộ asset mà không khóa phần mở đầu', async ({ page }) => {
  const failedResponses = [];
  const runtimeErrors = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/The Blue Voyage/);
  await expect(page.locator('body')).not.toHaveClass(/is-intro-locked/);
  await expect(page.locator('.scene')).toHaveCount(4);
  await expect(page.locator('#hold-control, #skip-intro')).toHaveCount(0);
  await expect(page.locator('.falling-memory')).toHaveCount(5);
  await expect(page.locator('.water-ripple')).toHaveCount(5);
  await expect(page.locator('#portal-layer > .portal')).toHaveCount(4);
  await expect(page.locator('.memory-tile')).toHaveCount(48);
  await expect.poll(() => page.locator('#intro-backdrop').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

  await page.locator('#ocean-remembers').scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await expect(page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' })).toBeAttached();
  expect(failedResponses).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test('chế độ giảm chuyển động dùng nút chuyển cảnh đơn giản', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  const nextButton = page.locator('#reduced-next');
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toContainText('CON ĐƯỜNG MÀU XANH');
  await nextButton.click();
  await expect(nextButton).toContainText('VÙNG BIỂN TỐI');
  await nextButton.click();
  await expect(nextButton).toContainText('ĐẠI DƯƠNG KÝ ỨC');
  await nextButton.click();
  await expect(nextButton).toBeHidden();
  await expect(page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' })).toBeEnabled();
  await context.close();
});

test('năm giọt làm cảnh sáng dần rồi bay ngược vào vầng sáng', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('.intro-world');
  const backdrop = page.locator('#intro-backdrop');

  await expect(intro).toHaveAttribute('data-stage', 'drops');
  await expect.poll(() => intro.evaluate((element) => Number(getComputedStyle(element).getPropertyValue('--intro-light')))).toBe(0);
  await expect(backdrop).toHaveCSS('opacity', '0');

  await goToProgress(page, '#memory-drops', 0.18);
  await expect.poll(() => intro.evaluate((element) => Number(getComputedStyle(element).getPropertyValue('--intro-light')))).toBeGreaterThan(0.18);

  await goToProgress(page, '#memory-drops', 0.51);
  await expect.poll(() => intro.evaluate((element) => Number(getComputedStyle(element).getPropertyValue('--intro-light')))).toBeGreaterThan(0.98);
  await expect(intro).toHaveAttribute('data-stage', 'ocean');
  await expect.poll(() => page.locator('#intro-backdrop').evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBeGreaterThan(0.9);

  await goToProgress(page, '#memory-drops', 0.67);
  await expect(intro).toHaveAttribute('data-stage', 'return');
  await expect(page.locator('.falling-memory.is-ascending')).toHaveCount(3);

  await goToProgress(page, '#memory-drops', 0.9);
  await expect(intro).toHaveAttribute('data-stage', 'whale');
  await expect.poll(() => intro.evaluate((element) => Number(getComputedStyle(element).getPropertyValue('--whale-emerge')))).toBeGreaterThan(0.65);
});

test('ánh sáng cuối hành trình nhập vào cá voi ký ức', async ({ page }) => {
  await page.goto('/');
  await goToProgress(page, '#ocean-remembers', 0.9);
  const button = page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('#memory-whale')).toHaveClass(/is-lit/, { timeout: 3_000 });
  await expect(page.locator('#outro-actions')).toBeVisible();
});

test('không thể kích hoạt nút kết khi chưa đến đoạn cuối', async ({ page }) => {
  await page.goto('/');
  const sendButton = page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' });
  await expect(sendButton).toBeDisabled();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(sendButton).not.toBeFocused();
  await expect(page.locator('.finale-world')).not.toHaveClass(/is-complete/);
});

test('đoạn kết mở thư viện và có thể bắt đầu lại', async ({ page }) => {
  await page.goto('/');
  await goToProgress(page, '#ocean-remembers', 0.92);
  const sendButton = page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' });
  await expect(sendButton).toBeEnabled();
  await sendButton.click();
  await expect(page.getByRole('button', { name: 'XEM TOÀN BỘ KÝ ỨC' })).toBeEnabled({ timeout: 3_000 });
  await page.getByRole('button', { name: 'XEM TOÀN BỘ KÝ ỨC' }).click();
  await expect(page.locator('#gallery-dialog')).toBeVisible();
  await expect(page.locator('#gallery-grid img')).toHaveCount(19);
  await page.getByRole('button', { name: 'Đóng thư viện ảnh' }).click();
  await page.getByRole('button', { name: 'XEM LẠI HÀNH TRÌNH' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  await expect(page.locator('body')).not.toHaveClass(/is-intro-locked/);
  await expect(page.locator('.falling-memory')).toHaveCount(5);
});

test('giao diện mobile không tràn ngang', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await goToProgress(page, '#memory-drops', 0.51);
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
  await context.close();
});
