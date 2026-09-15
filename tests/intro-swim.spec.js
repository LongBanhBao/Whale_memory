import { expect, test } from '@playwright/test';

test.use({ video: 'on' });
test.setTimeout(40_000);

for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  test(`cá voi bơi liên tục và dừng khi rời cảnh — ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('#intro-whale-still')).toHaveAttribute('crossorigin', 'anonymous');
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

    // The compact renderer intentionally draws at 30 FPS. Use its frame
    // counter rather than toDataURL(), whose WebGL buffer may be discarded on
    // a throttled frame even while the on-screen canvas keeps animating.
    const sample = () => page.locator('#intro-whale-mesh')
      .evaluate((canvas) => canvas.__blueVoyageFrame || 0);
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
