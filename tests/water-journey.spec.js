import { test, expect } from '@playwright/test';

async function expectClearPortraits(page, gateIndex) {
  const state = await page.evaluate(index => {
    const gate = document.querySelectorAll('.water-gate--memories')[index];
    const rear = document.querySelectorAll('#portal-layer > .water-gate')[index];
    const portraits = [...gate.querySelectorAll('.memory-portrait')];
    // Enable hit-testing only for this diagnostic, including potential blockers.
    const targets = [...portraits, ...document.querySelectorAll('#foreground-layer .water-gate__ring, #intro-whale-mesh')];
    const previous = targets.map(node => node.style.pointerEvents);
    targets.forEach(node => { node.style.pointerEvents = 'auto'; });
    try {
      return {
        synchronized: gate.style.transform === rear.style.transform
          && gate.style.left === rear.style.left && gate.style.top === rear.style.top,
        portraits: portraits.map(portrait => {
          const bounds = portrait.getBoundingClientRect();
          const points = [.35, .5, .65].map(fraction => ({
            x: bounds.left + bounds.width * .5,
            y: bounds.top + bounds.height * fraction,
          }));
          return {
            inViewport: points.every(({ x, y }) => x > 0 && x < innerWidth && y > 0 && y < innerHeight),
            unobscured: points.every(({ x, y }) => portrait.contains(document.elementFromPoint(x, y))),
          };
        }),
      };
    } finally {
      targets.forEach((node, n) => { node.style.pointerEvents = previous[n]; });
    }
  }, gateIndex);
  expect(state.synchronized).toBe(true);
  expect(state.portraits).toEqual(Array.from({ length: 4 }, () => ({ inViewport: true, unobscured: true })));
}

test('vòng giữ hướng, đồng bộ hai nửa và tan dần khi cá voi đi qua', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.intro-world')).toHaveAttribute('data-stage', 'drops');
  await page.locator('#scene-next').click();
  await expect(page.locator('#blue-road')).toBeVisible({ timeout: 10000 });
  let previous;
  for (let step = 0; step < 9; step += 1) {
    await page.waitForTimeout(1000);
    const state = await page.evaluate(() => {
      const rear = document.querySelector('#portal-layer .water-gate');
      const near = document.querySelector('#foreground-layer .water-gate');
      const a = rear.querySelector('.water-gate__ring');
      const b = near.querySelector('.water-gate__ring');
      return {
        x: parseFloat(rear.style.left), opacity: Number(rear.style.opacity),
        nearOpacity: Number(near.style.opacity),
        angle: parseFloat(rear.style.getPropertyValue('--current-angle')),
        nearAngle: parseFloat(near.style.getPropertyValue('--current-angle')),
        plane: getComputedStyle(a).transform, nearPlane: getComputedStyle(b).transform,
        transform: rear.style.transform, nearTransform: near.style.transform,
      };
    });
    expect(state.opacity).toBe(state.nearOpacity);
    expect(state.angle).toBe(state.nearAngle);
    expect(state.plane).toBe(state.nearPlane);
    expect(state.transform).toBe(state.nearTransform);
    if (previous) {
      expect(state.x).toBeLessThan(previous.x);
      expect(state.angle).toBeGreaterThan(previous.angle);
      expect(state.plane).toBe(previous.plane);
      expect(state.opacity).toBeLessThanOrEqual(previous.opacity);
    }
    previous = state;
  }
  // The transition into the scene can consume part of the observation window.
  // Assert the eventual fade against the live gate, not the wall-clock sample.
  await expect.poll(() => page.locator('#portal-layer .water-gate').first()
    .evaluate(gate => Number(gate.style.opacity))).toBeLessThan(.75);
});

for (const width of [1440, 390]) {
  test(`ba cổng ký ức và cá voi liên tục ở ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(65000);
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
    await expect(page.locator('.memory-streams, .memory-stream, .memory-shimmer')).toHaveCount(0);
    await expect(page.locator('.memory-portrait')).toHaveCount(12);
    await expect(page.locator('.memory-orbit')).toHaveCount(3);
    const perspective = await page.evaluate(() => ({
      ring: getComputedStyle(document.querySelector('#portal-layer .water-gate__ring')).transform,
      memories: getComputedStyle(document.querySelector('.memory-layer .memory-orbit')).transform,
    }));
    expect(perspective.memories).toBe(perspective.ring);
    const portraitPlate = await page.evaluate(async () => {
      const css = getComputedStyle(document.querySelector('.gate-memory'), '::before');
      const url = css.backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
      const image = new Image();
      image.src = url;
      await image.decode();
      return { url, width: image.naturalWidth, mask: css.maskImage };
    });
    expect(portraitPlate.url).toContain('prw-memory-window.webp');
    expect(portraitPlate.width).toBe(768);
    expect(portraitPlate.mask).toContain('closest-side');
    await expect(page.locator('.water-vortex-texture')).toHaveCount(6);
    await expect.poll(() => page.locator('.water-vortex-texture').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth === 1024))).toBe(true);
    const ids = await page.locator('.gate-memory').evaluateAll(nodes => nodes.map(n => n.dataset.image));
    expect(new Set(ids).size).toBe(12);
    await expect.poll(() => page.locator('.journey-backdrop').evaluate(n => n.naturalWidth)).toBeGreaterThan(0);
    await page.waitForTimeout(5000);
    await expectClearPortraits(page, 0);
    await page.screenshot({ path: testInfo.outputPath('gate-one.png') });
    await expect(page.locator('.journey-world')).toHaveAttribute('data-passed', '1', { timeout: 6500 });
    await page.waitForTimeout(7400);
    await expectClearPortraits(page, 1);
    await page.screenshot({ path: testInfo.outputPath('gate-two.png') });
    await expect(page.locator('.journey-world')).toHaveAttribute('data-passed', '2', { timeout: 12000 });
    await page.waitForTimeout(7400);
    await expectClearPortraits(page, 2);
    await page.screenshot({ path: testInfo.outputPath('gate-three.png') });
    await expect(page.locator('.journey-world')).toHaveAttribute('data-passed', '3', { timeout: 12000 });
    await expect.poll(() => page.locator('#intro-whale-swimmer').evaluate(n => n.style.getPropertyValue('--whale-scale')), { timeout: 11000 }).toBe('1.0000');
    expect(await page.locator('#intro-whale-swimmer').evaluate(n => parseFloat(n.style.getPropertyValue('--whale-x')))).toBeCloseTo(55);
    await page.screenshot({ path: testInfo.outputPath('journey-arrived.png') });
    // The journey timeline may finish, but the animal must keep breathing/swimming.
    const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(document.querySelector('#intro-whale-mesh').toDataURL()))));
    const firstFrame = await frame();
    await page.waitForTimeout(450);
    expect(await frame()).not.toBe(firstFrame);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.wordmark').click();
    await expect(page.locator('.intro-world #intro-whale-swimmer')).toHaveCount(1);
    await expect(page.locator('#hold-control')).toBeEnabled();
    expect(errors).toEqual([]);
  });
}
