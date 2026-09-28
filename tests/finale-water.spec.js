import { expect, test } from '@playwright/test';
import sharp from 'sharp';

async function waterFixture(page, reducedMotion = false) {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await page.evaluate(async reduce => {
    const { createFinaleWater } = await import('/src/effects/finale-water.js');
    const host = document.createElement('div');
    host.className = 'finale-cosmic-aureole';
    host.id = 'water-fixture';
    host.style.cssText = 'position:fixed;z-index:999;width:min(90vw,80vh);--cosmic-open:1;--finale-vortex-image:url(/assets/finale-water-vortex-v2.webp)';
    host.innerHTML = '<canvas id="water-test" class="finale-water"></canvas>';
    document.body.append(host);
    window.waterEffect = createFinaleWater(host, '/assets/finale-water-vortex-v2.webp', reduce);
    window.waterEffect.prepare();
    window.waterEffect.setActive(true);
  }, reducedMotion);
  return page.locator('#water-test');
}

for (const mobile of [false, true]) {
  test(`water pixels flow without rotating the canvas — ${mobile ? 'mobile' : 'desktop'}`, async ({ page }, testInfo) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const water = await waterFixture(page);
    await expect(water).toHaveAttribute('data-renderer', 'webgl');
    await expect(water).toHaveAttribute('data-running', 'true');
    await expect(water).toHaveCSS('transform', 'none');
    await page.waitForTimeout(250);
    const first = await water.screenshot({ path: testInfo.outputPath('water-first.png') });
    await page.waitForTimeout(1_500);
    const second = await water.screenshot({ path: testInfo.outputPath('water-flowing.png') });
    const a = await sharp(first).removeAlpha().raw().toBuffer();
    const b = await sharp(second).removeAlpha().raw().toBuffer();
    let difference = 0;
    for (let i = 0; i < a.length; i += 1) difference += Math.abs(a[i] - b[i]);
    expect(difference / a.length).toBeGreaterThan(8);
    expect(await water.evaluate(node => node.width)).toBeLessThanOrEqual(mobile ? 640 : 1000);

    await page.evaluate(() => window.waterEffect.setActive(false));
    await expect(water).toHaveAttribute('data-running', 'false');
    const stoppedAt = await water.getAttribute('data-flow-time');
    await page.waitForTimeout(600);
    expect(await water.getAttribute('data-flow-time')).toBe(stoppedAt);
    await page.evaluate(() => window.waterEffect.setActive(true));
    await expect(water).toHaveAttribute('data-running', 'true');
    await expect.poll(() => water.getAttribute('data-flow-time')).not.toBe(stoppedAt);

    // Visibility events must pause both the loop and its clock.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(water).toHaveAttribute('data-running', 'false');
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(water).toHaveAttribute('data-running', 'true');
    await page.evaluate(() => window.waterEffect.reset());
    await expect(water).toHaveAttribute('data-running', 'false');
    await expect(water).toHaveAttribute('data-flow-time', '0');
    expect(errors).toEqual([]);
  });
}

test('water survives GPU context loss and keeps the reference fallback visible', async ({ page }) => {
  const water = await waterFixture(page);
  await expect(water).toHaveAttribute('data-renderer', 'webgl');
  await water.evaluate(node => {
    window.waterContext = node.getContext('webgl').getExtension('WEBGL_lose_context');
    window.waterContext.loseContext();
  });
  await expect(water).toHaveAttribute('data-renderer', 'fallback');
  await expect(water).toHaveAttribute('data-running', 'false');
  expect(await page.locator('#water-fixture').evaluate(node => getComputedStyle(node, '::before').display)).not.toBe('none');
  await page.evaluate(() => window.waterContext.restoreContext());
  await expect(water).toHaveAttribute('data-renderer', 'webgl');
  await expect(water).toHaveAttribute('data-running', 'true');
});

test('reduced motion renders water once and WebGL absence retains the image', async ({ page }) => {
  const water = await waterFixture(page, true);
  await expect(water).toHaveAttribute('data-renderer', 'webgl');
  await expect(water).toHaveAttribute('data-running', 'false');
  await page.waitForTimeout(600);
  await expect(water).toHaveAttribute('data-flow-time', '0.000');
  await page.setViewportSize({ width: 800, height: 600 });
  await page.waitForTimeout(100);
  await expect(water).toHaveAttribute('data-running', 'false');
  await expect(water).toHaveAttribute('data-flow-time', '0.000');
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return this.id === 'water-test' && kind === 'webgl' ? null : original.call(this, kind, ...args);
    };
  });
  const fallback = await waterFixture(page);
  await expect(fallback).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('#water-fixture')).not.toHaveClass(/has-flowing-water/);
});
