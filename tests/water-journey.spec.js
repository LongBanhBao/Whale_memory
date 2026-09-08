import { test, expect } from '@playwright/test';

async function expectClearPassage(page, gateIndex) {
  const result = await page.evaluate(index => {
    const mesh = document.querySelector('#intro-whale-mesh');
    const gate = document.querySelectorAll('#portal-layer > .portal.water-gate')[index];
    const near = document.querySelectorAll('#foreground-layer .water-gate__ring')[index];
    const currents = [...gate.querySelectorAll('.memory-current')];
    const branches = gate.querySelector('.water-gate__branches');
    const targets = [mesh, near, branches];
    const previous = targets.map(node => node.style.pointerEvents);
    targets.forEach(node => { node.style.pointerEvents = 'all'; });
    try {
      const bounds = mesh.getBoundingClientRect();
      let overlaps = 0;
      const branchesBehind = [.35, .5, .65, .8].every(fraction => {
        const stack = document.elementsFromPoint(bounds.left + bounds.width * fraction, bounds.top + bounds.height * .5);
        if (!stack.includes(branches) || !stack.includes(mesh)) return true;
        overlaps += 1;
        return stack.indexOf(mesh) < stack.indexOf(branches);
      });
      // Project both lips into the viewport. Only the entrance (left) may
      // occupy the foreground; the exit must leave the emerging head clear.
      const projection = currents[0].getScreenCTM();
      const hits = [40, 360].map(x => {
        const point = new DOMPoint(x, 200).matrixTransform(projection);
        return document.elementsFromPoint(point.x, point.y).includes(near);
      });
      return { branchesBehind, overlaps, entranceInFront: hits[0], exitInFront: hits[1] };
    } finally {
      targets.forEach((node, n) => { node.style.pointerEvents = previous[n]; });
    }
  }, gateIndex);
  expect(result.overlaps).toBeGreaterThan(0);
  expect(result.branchesBehind).toBe(true);
  expect(result.entranceInFront).toBe(true);
  expect(result.exitInFront).toBe(false);
}

async function expectMemoryImprints(page, gateIndex) {
  const state = await page.evaluate(index => {
    const gates = [...document.querySelectorAll(`.water-gate--memories[data-gate="${index + 1}"]`)];
    const rear = document.querySelectorAll('#portal-layer > .portal.water-gate')[index];
    const portraits = gates.flatMap(gate => [...gate.querySelectorAll('.memory-portrait')]);
    return {
      synchronized: gates.length === 2 && gates.every(gate => gate.style.transform === rear.style.transform
        && gate.style.left === rear.style.left && gate.style.top === rear.style.top),
      portraits: portraits.map(portrait => {
        const bounds = portrait.getBoundingClientRect();
        const style = getComputedStyle(portrait);
        const visibleWidth = Math.max(0, Math.min(bounds.right, innerWidth) - Math.max(bounds.left, 0));
        const visibleHeight = Math.max(0, Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0));
        const visibleRatio = visibleWidth * visibleHeight / (bounds.width * bounds.height);
        return {
          inViewport: visibleRatio > .8,
          borderless: style.borderTopWidth === '0px' && style.backgroundImage === 'none',
          visible: Number(style.opacity) >= .75,
          silhouetteGlint: getComputedStyle(portrait, '::after').maskImage.includes('/assets/images/full/'),
        };
      }),
    };
  }, gateIndex);
  expect(state.synchronized).toBe(true);
  expect(state.portraits).toEqual(Array.from({ length: 4 }, () => ({
    inViewport: true, borderless: true, visible: true, silhouetteGlint: true,
  })));
}

async function waitForGateCrest(page, gateIndex) {
  const gate = page.locator(`#portal-layer > .portal.water-gate[data-gate="${gateIndex + 1}"]`);
  await expect.poll(() => gate.evaluate(node => parseFloat(node.style.left)), { timeout: 12_000 })
    .toBeLessThan(56);
  const memories = page.locator(`.water-gate--memories[data-gate="${gateIndex + 1}"] .gate-memory`);
  await expect.poll(() => memories.evaluateAll(nodes => nodes.length === 4
    && nodes.every(node => Number(node.style.getPropertyValue('--recall')) > .98)), { timeout: 5_000 })
    .toBe(true);
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
        opening: getComputedStyle(a).maskImage, nearOpening: getComputedStyle(b).maskImage,
        transform: rear.style.transform, nearTransform: near.style.transform,
      };
    });
    expect(state.opacity).toBe(state.nearOpacity);
    expect(state.angle).toBe(state.nearAngle);
    expect(state.plane).toBe(state.nearPlane);
    expect(state.opening).toBe(state.nearOpening);
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
    await expect(page.locator('.memory-orbit')).toHaveCount(6);
    const perspective = await page.evaluate(() => ({
      ring: getComputedStyle(document.querySelector('#portal-layer .water-gate__ring')).transform,
      memories: getComputedStyle(document.querySelector('.water-gate--memories .memory-orbit')).transform,
    }));
    expect(perspective.memories).toBe(perspective.ring);
    const portraitTreatment = await page.evaluate(() => {
      const memory = document.querySelector('.gate-memory');
      const portrait = memory.querySelector('.memory-portrait');
      return {
        plate: getComputedStyle(memory, '::before').backgroundImage,
        border: getComputedStyle(portrait).borderTopWidth,
        blend: getComputedStyle(portrait).mixBlendMode,
        mask: getComputedStyle(portrait).maskImage,
        annulus: getComputedStyle(memory.parentElement).maskImage,
        glintMask: getComputedStyle(portrait, '::after').maskImage,
        waterSurface: getComputedStyle(memory.closest('.water-gate--memories'), '::after').backgroundImage,
      };
    });
    expect(portraitTreatment.plate).toBe('none');
    expect(portraitTreatment.border).toBe('0px');
    expect(portraitTreatment.blend).toBe('screen');
    expect(portraitTreatment.mask).toContain('radial-gradient');
    expect(portraitTreatment.annulus).toContain('memory-vortex-v2.webp');
    expect(portraitTreatment.glintMask).toContain('/assets/images/full/');
    expect(portraitTreatment.waterSurface).toContain('memory-vortex-v2.webp');
    await expect(page.locator('.water-vortex-texture')).toHaveCount(6);
    await expect.poll(() => page.locator('.water-vortex-texture').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth === 1024))).toBe(true);
    await expect(page.locator('.water-vortex-texture').first()).toHaveAttribute('src', /memory-vortex-v2\.webp/);
    await expect(page.locator('.gate-memory__marker')).toHaveCount(0);
    const ids = await page.locator('.gate-memory').evaluateAll(nodes => nodes.map(n => n.dataset.image));
    expect(new Set(ids).size).toBe(12);
    await expect.poll(() => page.locator('.journey-backdrop').evaluate(n => n.naturalWidth)).toBeGreaterThan(0);
    await waitForGateCrest(page, 0);
    await expectMemoryImprints(page, 0);
    await expectClearPassage(page, 0);
    await page.screenshot({ path: testInfo.outputPath('gate-one.png') });
    await expect(page.locator('.journey-world')).toHaveAttribute('data-passed', '1', { timeout: 6500 });
    await waitForGateCrest(page, 1);
    await expectMemoryImprints(page, 1);
    await expectClearPassage(page, 1);
    await page.screenshot({ path: testInfo.outputPath('gate-two.png') });
    await expect(page.locator('.journey-world')).toHaveAttribute('data-passed', '2', { timeout: 12000 });
    await waitForGateCrest(page, 2);
    await expectMemoryImprints(page, 2);
    await expectClearPassage(page, 2);
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
