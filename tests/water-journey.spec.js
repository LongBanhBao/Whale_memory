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
        const image = portrait.querySelector('img');
        const visibleWidth = Math.max(0, Math.min(bounds.right, innerWidth) - Math.max(bounds.left, 0));
        const visibleHeight = Math.max(0, Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0));
        const visibleRatio = visibleWidth * visibleHeight / (bounds.width * bounds.height);
        return {
          inViewport: visibleRatio > .8,
          borderless: style.borderTopWidth === '0px' && style.backgroundImage === 'none',
          visible: Number(style.opacity) >= .94,
          completeSource: image.complete && image.naturalWidth > 0
            && image.src.includes('/assets/images/full/'),
          silhouetteGlint: getComputedStyle(portrait, '::after').maskImage.includes('/assets/images/full/'),
        };
      }),
    };
  }, gateIndex);
  expect(state.synchronized).toBe(true);
  expect(state.portraits).toEqual(Array.from({ length: 4 }, () => ({
    inViewport: true, borderless: true, visible: true, completeSource: true, silhouetteGlint: true,
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

async function expectJourneyAmbience(page, width) {
  const ambience = await page.evaluate(() => {
    const layers = [...document.querySelectorAll('.journey-ambience')];
    const far = document.querySelector('.journey-ambience--far');
    const near = document.querySelector('.journey-ambience--near');
    const whale = document.querySelector('.journey-world #intro-whale-swimmer');
    const foreground = document.querySelector('.journey-world .foreground-layer');
    const bubbles = [...document.querySelectorAll('.journey-bubble')];
    const motifs = [...document.querySelectorAll('.journey-motif')];
    const movingDetails = [
      document.querySelector('.journey-current__glint'),
      bubbles[0],
      motifs[0],
    ];
    return {
      layers: layers.length,
      hidden: layers.every(layer => layer.getAttribute('aria-hidden') === 'true'),
      pointerEvents: layers.map(layer => getComputedStyle(layer).pointerEvents),
      currents: document.querySelectorAll('.journey-current').length,
      currentBodies: document.querySelectorAll('.journey-current__body').length,
      currentGlints: document.querySelectorAll('.journey-current__glint').length,
      bubbles: bubbles.length,
      visibleBubbles: bubbles.filter(bubble => getComputedStyle(bubble).display !== 'none').length,
      edgeBiased: bubbles.every(bubble => {
        const x = parseFloat(bubble.style.getPropertyValue('--bubble-x'));
        return x <= 29 || x >= 71;
      }),
      motifs: motifs.length,
      visibleMotifs: motifs.filter(motif => getComputedStyle(motif).display !== 'none').length,
      motifKinds: [...new Set(motifs.map(motif => motif.dataset.kind))].sort(),
      farZ: Number(getComputedStyle(far).zIndex),
      nearZ: Number(getComputedStyle(near).zIndex),
      whaleZ: Number(getComputedStyle(whale).zIndex),
      foregroundZ: Number(getComputedStyle(foreground).zIndex),
      animations: movingDetails.map(detail => ({
        name: getComputedStyle(detail).animationName,
        duration: parseFloat(getComputedStyle(detail).animationDuration),
      })),
      rasterAssets: far.querySelectorAll('img, canvas').length + near.querySelectorAll('img, canvas').length,
      shift: getComputedStyle(document.querySelector('.journey-world'))
        .getPropertyValue('--journey-ambient-shift').trim(),
    };
  });
  expect(ambience.layers).toBe(2);
  expect(ambience.hidden).toBe(true);
  expect(ambience.pointerEvents).toEqual(['none', 'none']);
  expect(ambience.currents).toBe(3);
  expect(ambience.currentBodies).toBe(3);
  expect(ambience.currentGlints).toBe(3);
  expect(ambience.bubbles).toBe(18);
  expect(ambience.visibleBubbles).toBe(width === 390 ? 10 : 18);
  expect(ambience.edgeBiased).toBe(true);
  expect(ambience.motifs).toBe(6);
  expect(ambience.visibleMotifs).toBe(width === 390 ? 4 : 6);
  expect(ambience.motifKinds).toEqual(['frond', 'jelly', 'shell']);
  expect(ambience.farZ).toBeLessThan(8);
  expect(ambience.nearZ).toBeGreaterThan(ambience.whaleZ);
  expect(ambience.nearZ).toBeLessThan(ambience.foregroundZ);
  expect(ambience.animations.every(animation => animation.name !== 'none'
    && animation.duration >= 10)).toBe(true);
  expect(ambience.rasterAssets).toBe(0);
  expect(ambience.shift).toMatch(/vw$/);
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
    await expectJourneyAmbience(page, width);
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
        maskComposite: getComputedStyle(portrait).maskComposite,
        orbitClip: getComputedStyle(memory.parentElement).clipPath,
        portraitUncompress: Number(getComputedStyle(memory.closest('.water-gate--memories'))
          .getPropertyValue('--portrait-uncompress')),
        fit: getComputedStyle(portrait.querySelector('img')).objectFit,
        imageOpacity: Number(getComputedStyle(portrait.querySelector('img')).opacity),
        flowOrigin: memory.style.getPropertyValue('--memory-flow-origin'),
        waterThreads: memory.closest('.water-gate--memories')
          .querySelectorAll('.water-gate__memory-wash .memory-current--wash').length,
        glintMask: getComputedStyle(portrait, '::after').maskImage,
        waterSurface: getComputedStyle(memory.closest('.water-gate--memories'), '::after').backgroundImage,
      };
    });
    expect(portraitTreatment.plate).toBe('none');
    expect(portraitTreatment.border).toBe('0px');
    expect(portraitTreatment.blend).toBe('normal');
    expect(portraitTreatment.mask.match(/linear-gradient/g)).toHaveLength(2);
    expect(portraitTreatment.maskComposite).toContain('intersect');
    expect(portraitTreatment.orbitClip).toBe('none');
    expect(portraitTreatment.portraitUncompress).toBeGreaterThan(1.4);
    expect(portraitTreatment.fit).toBe('contain');
    expect(portraitTreatment.imageOpacity).toBeGreaterThanOrEqual(.8);
    expect(portraitTreatment.flowOrigin).not.toBe('');
    expect(portraitTreatment.waterThreads).toBe(4);
    expect(portraitTreatment.glintMask).toContain('/assets/images/full/');
    expect(portraitTreatment.waterSurface).toContain('memory-vortex-v2.webp');
    await expect(page.locator('.water-gate__memory-wash')).toHaveCount(6);
    await expect(page.locator('.water-vortex-texture')).toHaveCount(6);
    await expect.poll(() => page.locator('.water-vortex-texture').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth === 1024))).toBe(true);
    await expect(page.locator('.water-vortex-texture').first()).toHaveAttribute('src', /memory-vortex-v2\.webp/);
    await expect(page.locator('.gate-memory__marker')).toHaveCount(0);
    const ids = await page.locator('.gate-memory').evaluateAll(nodes => nodes.map(n => n.dataset.image));
    expect(new Set(ids).size).toBe(12);
    expect([...ids].sort()).toEqual([
      'p01', 'p13', 'p03', 'p14', 'p15', 'p16',
      'p07', 'p08', 'p17', 'p19', 'p11', 'p12',
    ].sort());
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

test('môi trường cảnh 2 giữ trạng thái tĩnh khi giảm chuyển động', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.journey-ambience')).toHaveCount(2);
  const state = await page.evaluate(() => {
    const nodes = [
      document.querySelector('.journey-current__glint'),
      document.querySelector('.journey-bubble'),
      document.querySelector('.journey-motif'),
    ];
    const ambience = document.querySelector('.journey-ambience--far');
    return {
      animations: nodes.map(node => getComputedStyle(node).animationName),
      veilBefore: getComputedStyle(ambience, '::before').animationName,
      veilAfter: getComputedStyle(ambience, '::after').animationName,
      noOverflow: document.documentElement.scrollWidth <= innerWidth,
    };
  });
  expect(state.animations).toEqual(['none', 'none', 'none']);
  expect(state.veilBefore).toBe('none');
  expect(state.veilAfter).toBe('none');
  expect(state.noOverflow).toBe(true);
});
