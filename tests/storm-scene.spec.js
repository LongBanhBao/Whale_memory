import { test, expect } from '@playwright/test';
import { goToProgress } from './scene-helpers.js';

test('cảnh bão kể đủ ba nhịp chống chọi, được hỗ trợ và tự mở sang vùng sáng', async ({ page }, testInfo) => {
  test.setTimeout(55_000);
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto('/');
  await goToProgress(page, '#storm', .13);

  const storm = page.locator('.storm-world');
  // Under a saturated parallel run, GSAP correctly catches up to wall-clock
  // time before Playwright can inspect the first frame. Accept any pre-family
  // resistance beat here; the pure motion tests assert all three exact turns.
  await expect(storm).toHaveAttribute(
    'data-storm-phase',
    /struggle-[123]|family-arrival/,
  );
  await expect(page.locator('.storm-obstacle')).toHaveCount(6);
  await expect(page.locator('.companion-whale')).toHaveCount(9);
  await expect(page.locator('.storm-rain__streak')).toHaveCount(36);
  await expect(page.locator('.memory-shard, .memory-particle, .ascent-line, .suspended-drop')).toHaveCount(0);
  await expect(page.locator('.storm-world > #whale-canvas')).toHaveCount(1);
  await expect(page.locator('.storm-obstacle').first()).toHaveAttribute('data-state', /impact|blocked|expelled/);
  await page.screenshot({ path: testInfo.outputPath('storm-first-impact.png') });

  await expect.poll(() => page.locator('.companion-whale').evaluateAll(nodes => (
    nodes.filter(node => Number(node.style.getPropertyValue('--companion-arrival')) > .9).length
  )), { timeout: 9_000 }).toBeGreaterThanOrEqual(7);
  await expect(page.locator('#family-current')).toHaveAttribute('data-active', 'true');
  await page.screenshot({ path: testInfo.outputPath('storm-family-arrival.png') });

  await expect.poll(() => page.locator('.storm-obstacle[data-state="expelled"]').count(), {
    timeout: 5_000,
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
  )), { timeout: 5_000 }).toBeGreaterThan(.15);
  await expect(storm).toHaveAttribute('data-storm-phase', 'light-wipe');
  await expect(page.locator('#storm-destination')).toHaveAttribute('data-active', 'true');
  const wipe = await page.locator('#storm-transition-light').evaluate(node => ({
    opacity: Number(node.style.getPropertyValue('--storm-wipe')),
    radius: parseFloat(node.style.getPropertyValue('--storm-wipe-radius')),
  }));
  expect(wipe.opacity).toBeGreaterThan(.15);
  expect(wipe.radius).toBeGreaterThan(25);
  await page.screenshot({ path: testInfo.outputPath('storm-light-wipe.png') });

  await expect(page.locator('#ocean-remembers')).toBeVisible({ timeout: 4_000 });
  await expect(page.locator('#storm')).toBeHidden();
  expect(runtimeErrors).toEqual([]);
});

test('cảnh bão mobile giữ đội hình và không tràn ngang', async ({ page }, testInfo) => {
  test.setTimeout(40_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await goToProgress(page, '#storm', .76);
  await expect(page.locator('.storm-world')).toHaveAttribute('data-storm-phase', 'breakthrough');
  const state = await page.evaluate(() => ({
    visibleCompanions: [...document.querySelectorAll('.companion-whale')]
      .filter(node => getComputedStyle(node).display !== 'none').length,
    viewport: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
    whaleX: parseFloat(document.querySelector('.storm-world').style.getPropertyValue('--storm-whale-x')),
  }));
  expect(state.visibleCompanions).toBe(7);
  expect(state.pageWidth).toBeLessThanOrEqual(state.viewport + 1);
  expect(state.whaleX).toBeGreaterThan(49);
  await page.screenshot({ path: testInfo.outputPath('storm-mobile-family.png') });
});

test('cảnh bão giảm chuyển động dừng ở khoảnh khắc cả đàn đã chiến thắng', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const next = page.getByRole('button', { name: 'tiếp', exact: true });
  await next.click();
  await next.click();
  await expect(page.locator('#storm')).toBeVisible();
  await expect(page.locator('.storm-world')).toHaveAttribute('data-storm-phase', 'breakthrough');
  await expect(page.locator('.storm-rain')).toHaveCSS('display', 'none');
  await expect(page.locator('.storm-lightning')).toHaveCSS('display', 'none');
  await expect(page.locator('.storm-obstacle[data-state="expelled"]')).toHaveCount(6);
  const obstacleOpacities = await page.locator('.storm-obstacle').evaluateAll(nodes => (
    nodes.map(node => Number(node.style.getPropertyValue('--obstacle-opacity')))
  ));
  expect(obstacleOpacities.every(opacity => opacity < .05)).toBe(true);
  await expect(page.locator('#family-current')).toHaveAttribute('data-active', 'true');
  expect(await page.locator('#storm-transition-light').evaluate(node => (
    Number(node.style.getPropertyValue('--storm-wipe'))
  ))).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
