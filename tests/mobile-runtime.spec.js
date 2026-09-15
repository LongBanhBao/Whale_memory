import { devices, expect, test } from '@playwright/test';

const { defaultBrowserType: _browser, ...iphone } = devices['iPhone 13'];

async function expectViewportContained(page) {
  const state = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = Number.parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--app-height'));
    const activeScene = document.querySelector('.scene:not([hidden])');
    const frame = activeScene.querySelector('.scene__sticky').getBoundingClientRect();
    const visibleControls = [...document.querySelectorAll('button:not([hidden]), a')]
      .filter(node => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > .05
          && (!node.checkVisibility || node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
      })
      .map(node => {
        const bounds = node.getBoundingClientRect();
        return {
          id: node.id || node.className,
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
        };
      });
    return {
      viewportWidth,
      viewportHeight,
      pageWidth: document.documentElement.scrollWidth,
      frame: { x: frame.x, y: frame.y, width: frame.width, height: frame.height },
      controlsOutside: visibleControls.filter(bounds => bounds.left < -1 || bounds.top < -1
        || bounds.right > viewportWidth + 1 || bounds.bottom > viewportHeight + 1),
    };
  });
  expect(state.pageWidth).toBeLessThanOrEqual(state.viewportWidth + 1);
  expect(state.frame.x).toBeCloseTo(0, 0);
  expect(state.frame.y).toBeCloseTo(0, 0);
  expect(state.frame.width).toBeCloseTo(state.viewportWidth, 0);
  expect(state.frame.height).toBeCloseTo(state.viewportHeight, 0);
  expect(state.controlsOutside).toEqual([]);
}

test.describe('runtime điện thoại', () => {
  test.use(iphone);

  test('mở được bằng cảm ứng và dùng cấu hình dựng hình nhẹ', async ({ page }) => {
    const runtimeErrors = [];
    const failedRequests = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('requestfailed', request => {
      const expectedMediaRelease = new URL(request.url()).pathname.endsWith('/assets/video/P.optimized.mp4')
        && request.failure()?.errorText === 'net::ERR_ABORTED';
      if (!expectedMediaRelease) failedRequests.push(request.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-runtime-profile', 'compact');
    await expect(page.locator('#hold-control')).toBeVisible();
    await expect(page.locator('#hold-control')).toBeEnabled();
    const nativeHoldGestures = await page.locator('#hold-control').evaluate(node => {
      const style = getComputedStyle(node);
      return {
        hasNativeImage: Boolean(node.querySelector('img')),
        userSelect: style.userSelect,
        contextMenuAllowed: node.dispatchEvent(new Event('contextmenu', {
          bubbles: true,
          cancelable: true,
        })),
        selectionAllowed: node.dispatchEvent(new Event('selectstart', {
          bubbles: true,
          cancelable: true,
        })),
      };
    });
    expect(nativeHoldGestures).toEqual({
      hasNativeImage: false,
      userSelect: 'none',
      contextMenuAllowed: false,
      selectionAllowed: false,
    });

    const before = await page.locator('#hold-progress').evaluate(node => Number(node.style.strokeDashoffset));
    await page.locator('#hold-control').dispatchEvent('pointerdown');
    await page.waitForTimeout(360);
    const after = await page.locator('#hold-progress').evaluate(node => Number(node.style.strokeDashoffset));
    await page.locator('#hold-control').dispatchEvent('pointerup');
    expect(after).toBeLessThan(before);

    await expect(page.locator('html')).not.toHaveAttribute('data-storm-ready', 'true');
    await page.locator('#scene-next').click();
    await expect(page.locator('#blue-road')).toBeVisible({ timeout: 7_000 });
    await expect.poll(() => page.locator('.portal.water-gate').first().evaluate(node => (
      Number(node.style.getPropertyValue('--memory-visibility'))
    )), { timeout: 5_000 }).toBeGreaterThan(.1);
    await page.locator('#scene-next').click();
    await expect(page.locator('#storm')).toBeVisible({ timeout: 7_000 });
    await expect(page.locator('html')).toHaveAttribute('data-storm-ready', 'true');
    const profile = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
      ambientRatio: Number(document.querySelector('#ambient-canvas').dataset.pixelRatio),
      stormRatio: Number(document.querySelector('#whale-canvas').dataset.pixelRatio),
      grainAnimation: getComputedStyle(document.querySelector('.film-grain')).animationName,
      grainDisplay: getComputedStyle(document.querySelector('.film-grain')).display,
      hiddenStormEcho: getComputedStyle(document.querySelector('.storm-backdrop-echo--near')).display,
      hiddenCurrentEcho: getComputedStyle(document.querySelector('.journey-current__echo')).display,
      journeyNodes: document.querySelector('.journey-world').querySelectorAll('*').length,
      journeyPaths: document.querySelector('.journey-world').querySelectorAll('path').length,
      stormNodes: document.querySelector('.storm-world').querySelectorAll('*').length,
      visibleCompanions: [...document.querySelectorAll('.companion-whale')]
        .filter(node => getComputedStyle(node).display !== 'none').length,
    }));
    expect(profile.pageWidth).toBeLessThanOrEqual(profile.viewport + 1);
    expect(profile.ambientRatio).toBeLessThanOrEqual(1);
    expect(profile.stormRatio).toBeLessThanOrEqual(1);
    expect(profile.grainAnimation).toBe('none');
    expect(profile.grainDisplay).toBe('none');
    expect(profile.hiddenStormEcho).toBe('none');
    expect(profile.hiddenCurrentEcho).toBe('none');
    expect(profile.visibleCompanions).toBe(16);
    expect(profile.journeyNodes).toBeLessThan(320);
    expect(profile.journeyPaths).toBeLessThan(100);
    expect(profile.stormNodes).toBeLessThan(250);
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

  for (const profile of [
    { name: 'dọc', width: 390, height: 844, orientation: 'portrait' },
    { name: 'ngang', width: 844, height: 390, orientation: 'landscape' },
  ]) {
    test(`giữ nền ổn định và toàn bộ điều khiển trong khung ở màn hình ${profile.name}`, async ({ page }) => {
      test.setTimeout(35_000);
      await page.setViewportSize({ width: profile.width, height: profile.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
      await expect(page.locator('html')).toHaveAttribute('data-runtime-profile', 'compact');
      await expect(page.locator('html')).toHaveAttribute('data-runtime-orientation', profile.orientation);
      await expect(page.locator('#intro-backdrop')).toHaveCSS('transform', 'none');
      await expectViewportContained(page);

      await page.locator('#scene-next').click();
      await expect(page.locator('#blue-road')).toBeVisible({ timeout: 8_000 });
      await expect(page.locator('.journey-backdrop')).toHaveCSS('transform', 'none');
      await expectViewportContained(page);

      await page.locator('#scene-next').click();
      await expect(page.locator('#storm')).toBeVisible({ timeout: 8_000 });
      await expect(page.locator('#storm-camera')).toHaveCSS('transform', 'none');
      await expect(page.locator('#storm-backdrop')).toHaveCSS('transform', 'none');
      await expect(page.locator('.storm-backdrop-echo--far')).toHaveCSS('display', 'none');
      await expect(page.locator('.storm-rain__plane--far')).toHaveCSS('display', 'none');
      await expect(page.locator('#storm-entry-current')).toHaveCSS('clip-path', 'none');
      await expect(page.locator('#storm-transition-light')).toHaveCSS('clip-path', 'none');
      await expect(page.locator('.storm-rain__streak')).toHaveCount(16);
      await expect(page.locator('.storm-spray__drop')).toHaveCount(10);
      await expect(page.locator('.storm-debris__piece')).toHaveCount(8);
      await expectViewportContained(page);

      await page.locator('#scene-next').click();
      await expect(page.locator('#ocean-remembers')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('#finale-whale-reveal #intro-whale-swimmer')).toHaveCount(1);
      await expect(page.locator('.memory-tile')).toHaveCount(0);
      await expectViewportContained(page);
    });
  }
});
