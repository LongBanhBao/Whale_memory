import { test, expect } from '@playwright/test';
import { goToProgress } from './scene-helpers.js';

test('cảnh bão kể đủ ba nhịp chống chọi, được hỗ trợ và tự mở sang vùng sáng', async ({ page }, testInfo) => {
  test.setTimeout(80_000);
  const runtimeErrors = [];
  const requestedAssets = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('request', request => requestedAssets.push(request.url()));
  await page.goto('/');

  // The scene handoff reveals the textured storm ocean itself. There must be
  // no opaque black veil between scenes 2 and 3.
  await expect(page.locator('#storm-entry-veil')).toHaveCount(0);
  const entryCurrent = page.locator('#storm-entry-current');
  await expect(entryCurrent).toHaveCSS('background-image', /storm-ocean-v2\.webp/);
  const restingEntryVisual = await entryCurrent.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
    };
  });
  expect(restingEntryVisual.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(restingEntryVisual.backgroundImage).toContain('storm-ocean-v2.webp');

  await goToProgress(page, '#blue-road', .02);
  await page.locator('#scene-next').click();
  await expect(entryCurrent).toHaveCSS('opacity', '1');
  await expect.poll(() => entryCurrent.evaluate(node => (
    parseFloat(node.style.getPropertyValue('--storm-entry-radius'))
  )), { timeout: 2_000 }).toBeGreaterThan(1);
  expect(await entryCurrent.evaluate(node => getComputedStyle(node).backgroundImage))
    .toContain('storm-ocean-v2.webp');
  await expect(page.locator('#blue-road')).toBeHidden({ timeout: 10_000 });

  // Including the elapsed scene-2 sample above, this lands in the fatigue
  // trough: the large whale is visibly sad and the family has not arrived.
  await goToProgress(page, '#storm', .57);
  const storm = page.locator('.storm-world');
  await expect(storm).toHaveAttribute('data-storm-phase', /struggle-3|fatigue/);
  await expect(page.locator('#whale-canvas')).toHaveAttribute('data-renderer', 'static-mesh');
  await expect(page.locator('#whale-canvas')).toHaveAttribute('data-expression', 'sad');
  await expect(page.locator('#family-current')).toHaveAttribute('data-active', 'false');
  await expect(page.locator('#storm-camera')).toHaveAttribute('data-weather', 'storming');

  await expect(page.locator('.storm-obstacle')).toHaveCount(6);
  await expect(page.locator('.companion-whale')).toHaveCount(18);
  await expect(page.locator('.storm-obstacle > strong')).toHaveText([
    'TOXIC', 'ÁP LỰC', 'BẾU', 'MỆT MỎI', 'SO SÁNH', 'TỰ NGHI NGỜ',
  ]);
  await expect(page.locator('.storm-obstacle > span, .storm-obstacle__signal')).toHaveCount(0);
  await expect(page.locator('.companion-whale[data-route="from-left"]')).toHaveCount(18);
  await expect(page.locator('.companion-whale > .companion-whale__image')).toHaveCount(18);
  await expect(page.locator('.companion-whale > .companion-cheer')).toHaveCount(18);
  const floatingWordStyle = await page.locator('.storm-obstacle').first().evaluate((node) => {
    const box = getComputedStyle(node);
    const word = getComputedStyle(node.querySelector('strong'));
    return {
      backgroundImage: box.backgroundImage,
      borderWidth: box.borderTopWidth,
      fontSize: parseFloat(word.fontSize),
    };
  });
  expect(floatingWordStyle).toMatchObject({ backgroundImage: 'none', borderWidth: '0px' });
  expect(floatingWordStyle.fontSize).toBeGreaterThan(30);
  await expect(page.locator('.storm-backdrop-echo')).toHaveCount(2);
  await expect(page.locator('.storm-surface-churn i')).toHaveCount(3);
  await expect(page.locator('.storm-cloud-field i')).toHaveCount(5);
  await expect(page.locator('.storm-wave')).toHaveCount(5);
  await expect(page.locator('.storm-lightning')).toHaveCount(2);
  await expect(page.locator('.storm-rain__plane')).toHaveCount(3);
  await expect(page.locator('.storm-rain__streak')).toHaveCount(48);
  await expect(page.locator('.storm-spray__drop')).toHaveCount(42);
  await expect(page.locator('.memory-shard, .memory-particle, .ascent-line, .suspended-drop')).toHaveCount(0);
  await expect(page.locator('#storm-backdrop')).toHaveAttribute('src', /storm-ocean-v2\.webp/);
  expect(requestedAssets.some(url => /blue-whale-sprite/i.test(url))).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('storm-sad-fatigue.png') });

  await expect.poll(() => page.locator('.companion-whale').evaluateAll(nodes => (
    nodes.filter(node => Number(node.style.getPropertyValue('--companion-arrival')) > .92).length
  )), { timeout: 9_000 }).toBe(18);
  await expect(page.locator('#family-current')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('#whale-canvas')).toHaveAttribute('data-expression', 'hopeful');
  await expect(page.locator('.companion-whale[data-cheering="true"]')).toHaveCount(18);
  await expect(page.locator('.companion-cheer').first()).toHaveCSS('animation-name', 'companion-cheer-pulse');
  await page.screenshot({ path: testInfo.outputPath('storm-family-arrival.png') });

  await expect.poll(() => page.locator('.storm-obstacle[data-state="expelled"]').count(), {
    timeout: 7_000,
  }).toBeGreaterThanOrEqual(5);
  await expect(storm).toHaveAttribute('data-storm-phase', 'breakthrough');
  const pose = await storm.evaluate(node => ({
    x: parseFloat(node.style.getPropertyValue('--storm-whale-x')),
    y: parseFloat(node.style.getPropertyValue('--storm-whale-y')),
    family: Number(node.style.getPropertyValue('--storm-family')),
  }));
  expect(pose.x).toBeGreaterThan(58);
  expect(pose.y).toBeLessThan(40);
  expect(pose.family).toBeGreaterThan(.98);
  await page.screenshot({ path: testInfo.outputPath('storm-breakthrough.png') });

  await expect.poll(() => page.locator('#storm-transition-light').evaluate(node => (
    Number(node.style.getPropertyValue('--storm-wipe'))
  )), { timeout: 8_000 }).toBeGreaterThan(.15);
  await expect(storm).toHaveAttribute('data-storm-phase', 'light-wipe');
  await expect(page.locator('.companion-whale[data-cheering="false"]')).toHaveCount(18);
  await expect(page.locator('#storm-destination')).toHaveAttribute('data-active', 'true');
  const wipe = await page.locator('#storm-transition-light').evaluate(node => ({
    opacity: Number(node.style.getPropertyValue('--storm-wipe')),
    radius: parseFloat(node.style.getPropertyValue('--storm-wipe-radius')),
  }));
  expect(wipe.opacity).toBeGreaterThan(.15);
  expect(wipe.radius).toBeGreaterThan(55);
  await page.screenshot({ path: testInfo.outputPath('storm-light-wipe.png') });

  await expect(page.locator('#ocean-remembers')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('#storm')).toBeHidden();
  expect(runtimeErrors).toEqual([]);
});

test('cảnh bão mobile giữ mười hai cá voi con trong đội hình và không tràn ngang', async ({ page }, testInfo) => {
  test.setTimeout(50_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await goToProgress(page, '#storm', .8);
  await expect(page.locator('.storm-world')).toHaveAttribute('data-storm-phase', 'breakthrough');
  await expect(page.locator('.companion-whale')).toHaveCount(18);
  const state = await page.evaluate(() => ({
    visibleCompanions: [...document.querySelectorAll('.companion-whale')]
      .filter(node => getComputedStyle(node).display !== 'none').length,
    formedVisibleCompanions: [...document.querySelectorAll('.companion-whale')]
      .filter(node => getComputedStyle(node).display !== 'none'
        && Number(node.style.getPropertyValue('--companion-arrival')) > .92).length,
    viewport: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
    whaleX: parseFloat(document.querySelector('.storm-world').style.getPropertyValue('--storm-whale-x')),
  }));
  expect(state.visibleCompanions).toBe(12);
  expect(state.formedVisibleCompanions).toBe(12);
  expect(state.pageWidth).toBeLessThanOrEqual(state.viewport + 1);
  expect(state.whaleX).toBeGreaterThan(45);
  await page.screenshot({ path: testInfo.outputPath('storm-mobile-family.png') });
});

test('cảnh bão giảm chuyển động dừng ở khoảnh khắc cả đàn đã chiến thắng', async ({ page }) => {
  const requestedAssets = [];
  page.on('request', request => requestedAssets.push(request.url()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const next = page.getByRole('button', { name: 'tiếp', exact: true });
  await next.click();
  await next.click();
  await expect(page.locator('#storm')).toBeVisible();
  await expect(page.locator('.storm-world')).toHaveAttribute('data-storm-phase', 'breakthrough');
  await expect(page.locator('#whale-canvas')).toHaveAttribute('data-renderer', 'static-mesh');
  await expect(page.locator('#whale-canvas')).toHaveAttribute('data-expression', 'hopeful');
  await expect(page.locator('.storm-rain')).toHaveCSS('display', 'none');
  await expect(page.locator('.storm-lightning').first()).toHaveCSS('display', 'none');
  await expect(page.locator('.storm-spray')).toHaveCSS('display', 'none');
  await expect(page.locator('.storm-obstacle[data-state="expelled"]')).toHaveCount(6);
  await expect(page.locator('.companion-whale')).toHaveCount(18);
  await expect(page.locator('.companion-whale[data-formation="formed"]')).toHaveCount(18);
  const obstacleOpacities = await page.locator('.storm-obstacle').evaluateAll(nodes => (
    nodes.map(node => Number(node.style.getPropertyValue('--obstacle-opacity')))
  ));
  expect(obstacleOpacities.every(opacity => opacity < .05)).toBe(true);
  await expect(page.locator('#family-current')).toHaveAttribute('data-active', 'true');
  expect(await page.locator('#storm-transition-light').evaluate(node => (
    Number(node.style.getPropertyValue('--storm-wipe'))
  ))).toBe(0);
  expect(requestedAssets.some(url => /blue-whale-sprite/i.test(url))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
