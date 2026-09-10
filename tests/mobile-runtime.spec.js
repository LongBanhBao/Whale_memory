import { devices, expect, test } from '@playwright/test';

const { defaultBrowserType: _browser, ...iphone } = devices['iPhone 13'];

test.describe('runtime điện thoại', () => {
  test.use(iphone);

  test('mở được bằng cảm ứng và dùng cấu hình dựng hình nhẹ', async ({ page }) => {
    const runtimeErrors = [];
    const failedRequests = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('requestfailed', request => failedRequests.push(request.url()));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-runtime-profile', 'compact');
    await expect(page.locator('#hold-control')).toBeVisible();
    await expect(page.locator('#hold-control')).toBeEnabled();

    const before = await page.locator('#hold-progress').evaluate(node => Number(node.style.strokeDashoffset));
    await page.locator('#hold-control').dispatchEvent('pointerdown');
    await page.waitForTimeout(360);
    const after = await page.locator('#hold-progress').evaluate(node => Number(node.style.strokeDashoffset));
    await page.locator('#hold-control').dispatchEvent('pointerup');
    expect(after).toBeLessThan(before);

    await expect(page.locator('html')).not.toHaveAttribute('data-storm-ready', 'true');
    await page.locator('#scene-next').click();
    await expect(page.locator('#blue-road')).toBeVisible({ timeout: 7_000 });
    await page.locator('#scene-next').click();
    await expect(page.locator('#storm')).toBeVisible({ timeout: 7_000 });
    await expect(page.locator('html')).toHaveAttribute('data-storm-ready', 'true');
    const profile = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
      ambientRatio: Number(document.querySelector('#ambient-canvas').dataset.pixelRatio),
      stormRatio: Number(document.querySelector('#whale-canvas').dataset.pixelRatio),
      grainAnimation: getComputedStyle(document.querySelector('.film-grain')).animationName,
      hiddenStormEcho: getComputedStyle(document.querySelector('.storm-backdrop-echo--near')).display,
      hiddenCurrentEcho: getComputedStyle(document.querySelector('.journey-current__echo')).display,
      visibleCompanions: [...document.querySelectorAll('.companion-whale')]
        .filter(node => getComputedStyle(node).display !== 'none').length,
    }));
    expect(profile.pageWidth).toBeLessThanOrEqual(profile.viewport + 1);
    expect(profile.ambientRatio).toBeLessThanOrEqual(1.2);
    expect(profile.stormRatio).toBeLessThanOrEqual(1.2);
    expect(profile.grainAnimation).toBe('none');
    expect(profile.hiddenStormEcho).toBe('none');
    expect(profile.hiddenCurrentEcho).toBe('none');
    expect(profile.visibleCompanions).toBe(16);
    expect(runtimeErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test('hiện nút tải lại nếu bundle bị lỗi thay vì để màn hình khóa', async ({ page }) => {
    await page.route('**/*', route => (
      new URL(route.request().url()).pathname === '/src/main.js'
        ? route.abort('failed')
        : route.continue()
    ));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'failed');
    await expect(page.locator('body')).not.toHaveClass(/is-intro-locked/);
    await expect(page.locator('#hold-label')).toHaveText('CHẠM ĐỂ TẢI LẠI');
    await expect(page.locator('#hold-control')).toBeEnabled();
  });
});
