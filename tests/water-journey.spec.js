import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`ba cổng ký ức và cá voi liên tục ở ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('.intro-world')).toHaveAttribute('data-stage', 'drops');
    await page.locator('#scene-next').click();
    await expect(page.locator('#scene-next')).toBeDisabled();
    await page.waitForTimeout(900);
    await expect(page.locator('#memory-drops')).toBeVisible();
    const x = await page.locator('#intro-whale-swimmer').evaluate(n => parseFloat(n.style.getPropertyValue('--whale-x')));
    expect(x).toBeLessThan(55);
    await expect(page.locator('#blue-road')).toBeVisible();
    await expect(page.locator('#scene-next')).toBeEnabled();
    await expect(page.locator('.journey-world #intro-whale-swimmer')).toHaveCount(1);
    await expect(page.locator('#whale-canvas')).toHaveClass(/is-hidden/);
    await expect(page.locator('.gate-memory')).toHaveCount(12);
    const ids = await page.locator('.gate-memory').evaluateAll(nodes => nodes.map(n => n.dataset.image));
    expect(new Set(ids).size).toBe(12);
    await expect.poll(() => page.locator('.journey-backdrop').evaluate(n => n.naturalWidth)).toBeGreaterThan(0);
    await page.waitForTimeout(3500);
    await page.screenshot({ path: testInfo.outputPath('gate-one.png') });
    await expect(page.locator('.journey-world')).toHaveAttribute('data-passed', '1', { timeout: 6500 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: testInfo.outputPath('gate-two.png') });
    await expect(page.locator('.journey-world')).toHaveAttribute('data-passed', '2', { timeout: 6500 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: testInfo.outputPath('gate-three.png') });
    await expect(page.locator('.journey-world')).toHaveAttribute('data-passed', '3', { timeout: 6500 });
    await expect.poll(() => page.locator('#intro-whale-swimmer').evaluate(n => n.style.getPropertyValue('--whale-scale')), { timeout: 6000 }).toBe('1.0000');
    expect(await page.locator('#intro-whale-swimmer').evaluate(n => parseFloat(n.style.getPropertyValue('--whale-x')))).toBeCloseTo(55);
    await page.screenshot({ path: testInfo.outputPath('journey-arrived.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.wordmark').click();
    await expect(page.locator('.intro-world #intro-whale-swimmer')).toHaveCount(1);
    await expect(page.locator('#hold-control')).toBeEnabled();
    expect(errors).toEqual([]);
  });
}
