import { expect, test } from '@playwright/test';

test.use({ video: 'on' });
test.setTimeout(40_000);

for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  test(`cá voi bơi liên tục và dừng khi rời cảnh — ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('#intro-whale-swimmer')).toHaveClass(/has-swim-mesh/);
    await page.locator('#hold-control').hover();
    await page.mouse.down();
    await expect(page.locator('.intro-world')).toHaveAttribute('data-stage', 'whale', { timeout: 15_000 });
    await page.mouse.up();
    for (let step = 1; step <= 4; step += 1) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/swim-${name}-${step}.png` });
    }
    await expect(page.locator('#memory-drops')).toHaveClass(/is-complete/);
    await expect(page.locator('#intro-halo')).toHaveCSS('opacity', '0');
    await page.screenshot({ path: `test-results/swim-${name}-arrived.png` });

    // Read immediately after drawing: default WebGL buffers are discarded
    // after compositing. Motion should continue even after the approach ends.
    const sample = () => page.locator('#intro-whale-mesh').evaluate((canvas) => new Promise((resolve) => {
      requestAnimationFrame(() => resolve(canvas.toDataURL()));
    }));
    const first = await sample();
    await page.waitForTimeout(650);
    const second = await sample();
    expect(second).not.toBe(first);
    await page.locator('#scene-next').click();
    await expect(page.locator('#blue-road')).toBeVisible();
    await expect(page.locator('.journey-world #intro-whale-swimmer')).toBeVisible();
    await page.locator('#scene-next').click();
    await expect(page.locator('#storm')).toBeVisible();
    await expect(page.locator('#intro-whale-swimmer')).not.toBeVisible();
    await page.locator('.wordmark').click();
    await expect(page.locator('#hold-control')).toBeEnabled();
    await expect(page.locator('.intro-world')).toHaveAttribute('data-stage', 'drops');
    expect(errors).toEqual([]);
  });
}
