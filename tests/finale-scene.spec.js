import { expect, test } from '@playwright/test';
import { goToProgress } from './scene-helpers.js';

test('tia sáng quét thuận hiện cá voi, quét ngược hiện Pastel rồi mới mở đoạn kết', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  await page.goto('/');
  await goToProgress(page, '#ocean-remembers', .91);

  const reveal = page.locator('#finale-reveal');
  const button = page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' });
  const copy = page.locator('.finale-copy');
  const actions = page.locator('#outro-actions button');
  const allActionsDisabled = () => actions.evaluateAll(nodes => nodes.every(node => node.disabled));
  const allActionsEnabled = () => actions.evaluateAll(nodes => nodes.every(node => !node.disabled));

  await expect.poll(() => page.locator('#finale-portrait-image').evaluate(image => (
    image.complete ? image.naturalWidth : 0
  ))).toBeGreaterThan(0);
  const portraitAlpha = await page.locator('#finale-portrait-image').evaluate((image) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const alphaAt = (x, y) => context.getImageData(x, y, 1, 1).data[3];
    return {
      corner: alphaAt(0, 0),
      center: alphaAt(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)),
      bottom: alphaAt(Math.floor(canvas.width / 2), canvas.height - 1),
    };
  });
  expect(portraitAlpha.corner).toBeLessThan(5);
  expect(portraitAlpha.center).toBeGreaterThan(245);
  expect(portraitAlpha.bottom).toBeLessThan(5);
  await expect(reveal).toHaveAttribute('data-finale-phase', 'idle');
  await expect(page.locator('#finale-whale-reveal #intro-whale-swimmer')).toHaveCount(1);
  await expect(page.locator('#memory-whale, .memory-grid, .memory-tile')).toHaveCount(0);
  await expect(page.locator('#finale-whale-reveal')).toHaveCSS('opacity', '0');
  await expect(page.locator('#finale-portrait-reveal')).toHaveCSS('opacity', '0');
  await expect(copy).toHaveCSS('opacity', '0');
  await expect.poll(allActionsDisabled).toBe(true);
  await expect(button).toBeEnabled();

  await page.evaluate(() => {
    window.__finalePhaseHistory = [];
    const target = document.querySelector('#finale-reveal');
    new MutationObserver(() => {
      const phase = target.dataset.finalePhase;
      if (window.__finalePhaseHistory.at(-1) !== phase) window.__finalePhaseHistory.push(phase);
    }).observe(target, { attributes: true, attributeFilter: ['data-finale-phase'] });
  });

  await button.click();
  await expect(button).toBeDisabled();
  await expect(page.locator('.finale-world')).toHaveClass(/is-sequencing/);
  await expect(page.locator('.traveling-light')).toHaveCount(1);
  await page.evaluate(() => {
    document.querySelector('#send-light').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await expect(page.locator('.traveling-light')).toHaveCount(1);
  await expect(copy).toHaveCSS('opacity', '0');

  await expect(reveal).toHaveAttribute('data-finale-phase', 'extending', { timeout: 2_500 });
  await expect.poll(() => reveal.evaluate(node => Number(node.dataset.scanRadius))).toBeGreaterThan(40);
  const radiusGeometry = await page.locator('#finale-scan-arm').evaluate((arm) => {
    const style = getComputedStyle(arm);
    return {
      centerX: window.innerWidth / 2,
      centerY: window.innerHeight / 2,
      lineStartX: parseFloat(style.left),
      lineMidY: parseFloat(style.top),
      transformOrigin: style.transformOrigin,
      radius: parseFloat(arm.style.width),
    };
  });
  expect(Math.abs(radiusGeometry.lineStartX - radiusGeometry.centerX)).toBeLessThan(2);
  expect(Math.abs(radiusGeometry.lineMidY - radiusGeometry.centerY)).toBeLessThan(2);
  expect(radiusGeometry.transformOrigin).toMatch(/^0px /);
  expect(radiusGeometry.radius).toBeGreaterThan(40);

  await expect(reveal).toHaveAttribute('data-finale-phase', 'sweep-forward', { timeout: 2_500 });
  await expect.poll(() => reveal.evaluate(node => Number(node.dataset.whaleReveal))).toBeGreaterThan(.12);
  const whaleLayer = await page.locator('#finale-whale-reveal').evaluate(node => ({
    inlineClip: node.style.clipPath,
    computedClip: getComputedStyle(node).clipPath,
    opacity: Number(getComputedStyle(node).opacity),
  }));
  expect(whaleLayer.inlineClip).toContain('polygon');
  expect(whaleLayer.computedClip).toContain('polygon');
  expect(whaleLayer.opacity).toBeGreaterThan(.35);
  expect(Number(await reveal.getAttribute('data-portrait-reveal'))).toBe(0);
  await expect(copy).toHaveCSS('opacity', '0');
  await expect.poll(allActionsDisabled).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('finale-sweep-forward.png') });

  await expect(reveal).toHaveAttribute('data-finale-phase', 'sweep-reverse', { timeout: 4_000 });
  await expect(reveal).toHaveClass(/has-whale-reveal/);
  expect(Number(await reveal.getAttribute('data-whale-reveal'))).toBe(1);
  await expect.poll(() => reveal.evaluate(node => Number(node.dataset.portraitReveal))).toBeGreaterThan(.12);
  const reverseLayers = await page.locator('#finale-reveal').evaluate(node => {
    const whaleLayerNode = node.querySelector('#finale-whale-reveal');
    const portraitLayerNode = node.querySelector('#finale-portrait-reveal');
    return {
      portraitClip: getComputedStyle(portraitLayerNode).clipPath,
      portraitOpacity: Number(getComputedStyle(portraitLayerNode).opacity),
      whaleZ: Number(getComputedStyle(whaleLayerNode).zIndex),
      portraitZ: Number(getComputedStyle(portraitLayerNode).zIndex),
    };
  });
  expect(reverseLayers.portraitClip).toContain('polygon');
  expect(reverseLayers.portraitOpacity).toBeGreaterThan(.35);
  expect(reverseLayers.portraitZ).toBeGreaterThan(reverseLayers.whaleZ);
  const borderlessPortrait = await page.locator('.finale-portrait').evaluate(node => {
    const style = getComputedStyle(node);
    return {
      background: style.backgroundColor,
      border: style.borderTopWidth,
      boxShadow: style.boxShadow,
      filter: style.filter,
      mask: style.maskImage || style.webkitMaskImage,
    };
  });
  expect(borderlessPortrait).toEqual({
    background: 'rgba(0, 0, 0, 0)',
    border: '0px',
    boxShadow: 'none',
    filter: 'none',
    mask: 'none',
  });
  await expect(copy).toHaveCSS('opacity', '0');
  await expect.poll(allActionsDisabled).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('finale-sweep-reverse.png') });

  await expect(reveal).toHaveAttribute('data-finale-phase', 'fading', { timeout: 4_000 });
  await expect(copy).toHaveCSS('opacity', '0');
  await expect.poll(allActionsDisabled).toBe(true);
  await expect(reveal).toHaveAttribute('data-finale-phase', 'cosmic-opening', { timeout: 2_500 });
  await expect.poll(() => page.locator('#finale-cosmos').evaluate(node => (
    Number(getComputedStyle(node).opacity)
  ))).toBeGreaterThan(.25);
  const waterVortex = await page.locator('.finale-cosmic-aureole').evaluate((node) => {
    const outerWater = getComputedStyle(node, '::before');
    const innerWater = getComputedStyle(node, '::after');
    return {
      outerImage: outerWater.backgroundImage,
      outerAnimation: outerWater.animationName,
      outerDuration: parseFloat(outerWater.animationDuration),
      innerAnimation: innerWater.animationName,
      innerDuration: parseFloat(innerWater.animationDuration),
    };
  });
  expect(waterVortex.outerImage).toContain('finale-water-vortex-v2.webp');
  expect(waterVortex.outerAnimation).toBe('finale-vortex-spin');
  expect(waterVortex.outerDuration).toBe(18);
  expect(waterVortex.innerAnimation).toBe('finale-vortex-spin');
  expect(waterVortex.innerDuration).toBe(25);
  await expect(copy).toHaveCSS('opacity', '0');
  await expect.poll(allActionsDisabled).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('finale-cosmic-opening.png') });
  await expect(reveal).toHaveAttribute('data-finale-phase', 'fireworks', { timeout: 3_000 });
  await expect(page.locator('#finale-fireworks')).toBeVisible();
  await expect.poll(allActionsDisabled).toBe(true);
  expect(await page.locator('.finale-world').evaluate(node =>
    parseFloat(node.style.getPropertyValue('--portrait-x')) || 0)).toBe(0);
  await expect(page.locator('#finale-fireworks')).toHaveAttribute('data-message-phase', 'readable', { timeout: 5_000 });
  await page.screenshot({ path: testInfo.outputPath('finale-fireworks.png') });
  await expect(reveal).toHaveAttribute('data-finale-phase', 'complete', { timeout: 13_000 });
  await expect(page.locator('#finale-fireworks')).toBeHidden();
  await expect(page.locator('#finale-scan')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('.traveling-light')).toHaveCount(0);
  await expect(reveal).toHaveClass(/has-portrait-reveal/);
  await expect.poll(() => copy.evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.95);
  await expect(page.locator('.finale-title')).toHaveAttribute('aria-label', 'Pastel de Whale');
  await expect(page.locator('.finale-title > span')).toHaveText(['PASTEL', 'WHALE']);
  await expect(page.locator('.finale-title > em')).toHaveText('de');
  await expect(page.locator('#outro-actions button')).toHaveCount(1);
  await expect.poll(allActionsEnabled, { timeout: 4_000 }).toBe(true);
  const settledWhale = page.locator('#finale-whale-reveal #intro-whale-swimmer');
  await expect.poll(() => settledWhale.evaluate(node => (
    parseFloat(node.style.getPropertyValue('--whale-x'))
  ))).toBeGreaterThan(68);
  const idleY = await settledWhale.evaluate(node => parseFloat(node.style.getPropertyValue('--whale-y')));
  await page.waitForTimeout(900);
  await expect.poll(() => settledWhale.evaluate(node => (
    parseFloat(node.style.getPropertyValue('--whale-y'))
  ))).not.toBe(idleY);
  const idleX = await settledWhale.evaluate(node => parseFloat(node.style.getPropertyValue('--whale-x')));
  await page.waitForTimeout(700);
  await expect.poll(() => settledWhale.evaluate(node => (
    parseFloat(node.style.getPropertyValue('--whale-x'))
  ))).not.toBe(idleX);
  const vortexTransform = () => page.locator('.finale-cosmic-aureole').evaluate(
    node => getComputedStyle(node, '::before').transform,
  );
  const initialVortexTransform = await vortexTransform();
  await expect.poll(vortexTransform).not.toBe(initialVortexTransform);
  await expect.poll(() => page.locator('.finale-world').evaluate(node => node.getBoundingClientRect().x)).toBe(0);
  const vortexLayout = await page.locator('.finale-cosmic-aureole').evaluate(node => {
    const bounds = node.getBoundingClientRect();
    return { center: bounds.x + bounds.width / 2, viewportCenter: innerWidth / 2 };
  });
  expect(Math.abs(vortexLayout.center - vortexLayout.viewportCenter)).toBeLessThan(2);
  await page.screenshot({ path: testInfo.outputPath('finale-complete.png') });
  const recurring = page.locator('#outro-fireworks');
  await expect(recurring).toHaveAttribute('data-active', 'true');
  await expect.poll(() => recurring.evaluate(node => Number(node.dataset.burstCount)), { timeout: 8_000 }).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(950);
  await page.screenshot({ path: testInfo.outputPath('finale-recurring.png') });

  expect(await page.evaluate(() => window.__finalePhaseHistory)).toEqual([
    'arriving', 'extending', 'sweep-forward', 'sweep-reverse', 'fading', 'cosmic-opening', 'fireworks', 'complete',
  ]);
});

test('giảm chuyển động vẫn hoàn tất đúng thứ tự và không giữ tia quét', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await page.locator('#hold-control').click();
  const next = page.getByRole('button', { name: 'tiếp', exact: true });
  await next.click();
  await next.click();
  await next.click();

  const reveal = page.locator('#finale-reveal');
  const button = page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' });
  await expect(page.locator('#ocean-remembers')).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();

  await expect(reveal).toHaveAttribute('data-finale-phase', 'complete');
  await expect(reveal).toHaveAttribute('data-whale-reveal', '1.0000');
  await expect(reveal).toHaveAttribute('data-portrait-reveal', '1.0000');
  await expect(page.locator('#finale-scan')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('.traveling-light')).toHaveCount(0);
  await expect(page.locator('.finale-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('#finale-cosmos')).toHaveCSS('opacity', '1');
  await expect(page.locator('.finale-portrait')).toHaveCSS('filter', 'none');
  await expect(page.locator('.finale-portrait')).toHaveCSS('mask-image', 'none');
  const stackedArtwork = await page.locator('#finale-reveal').evaluate(node => {
    const whaleBox = node.querySelector('#intro-whale-swimmer').getBoundingClientRect();
    const portraitBox = node.querySelector('.finale-portrait').getBoundingClientRect();
    return {
      whaleCenterY: whaleBox.top + whaleBox.height / 2,
      portraitCenterY: portraitBox.top + portraitBox.height / 2,
    };
  });
  expect(stackedArtwork.whaleCenterY - stackedArtwork.portraitCenterY).toBeGreaterThan(120);
  await expect.poll(() => page.locator('#outro-actions button').evaluateAll(
    nodes => nodes.every(node => !node.disabled),
  )).toBe(true);
  await context.close();
});

test('mobile đưa cá voi cảnh 2 bơi xuống và không dao động theo sóng sin', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await goToProgress(page, '#ocean-remembers', .91);
  await page.getByRole('button', { name: 'GỬI MỘT ÁNH SÁNG' }).click();
  await expect(page.locator('#finale-reveal')).toHaveAttribute('data-finale-phase', 'fireworks', {
    timeout: 12_000,
  });
  await expect(page.locator('#finale-fireworks')).toBeVisible();
  await expect(page.locator('#finale-fireworks')).toHaveAttribute('data-message-phase', 'readable', { timeout: 5_000 });
  await page.screenshot({ path: testInfo.outputPath('finale-fireworks-mobile.png') });
  await expect(page.locator('#finale-reveal')).toHaveAttribute('data-finale-phase', 'complete', {
    timeout: 13_000,
  });
  await expect.poll(() => page.locator('#outro-actions button').evaluateAll(
    nodes => nodes.every(node => !node.disabled),
  ), { timeout: 4_000 }).toBe(true);

  const whale = page.locator('#finale-whale-reveal #intro-whale-swimmer');
  const firstY = await whale.evaluate(node => parseFloat(node.style.getPropertyValue('--whale-y')));
  expect(firstY).toBeGreaterThan(62);
  await page.waitForTimeout(1000);
  const secondY = await whale.evaluate(node => parseFloat(node.style.getPropertyValue('--whale-y')));
  expect(Math.abs(secondY - firstY)).toBeLessThan(.2);
  await expect(whale).toHaveClass(/has-swim-mesh/);
  const mobileLayout = await page.locator('.finale-world').evaluate(node => {
    const title = node.querySelector('.finale-copy').getBoundingClientRect();
    const whaleBox = node.querySelector('#intro-whale-swimmer').getBoundingClientRect();
    return { titleBottom: title.bottom, whaleTop: whaleBox.top };
  });
  expect(mobileLayout.whaleTop - mobileLayout.titleBottom).toBeGreaterThan(4);
  const mobileVortexTransform = () => page.locator('.finale-cosmic-aureole').evaluate(
    node => getComputedStyle(node, '::before').transform,
  );
  const mobileVortexStart = await mobileVortexTransform();
  await expect.poll(mobileVortexTransform).not.toBe(mobileVortexStart);
  await page.screenshot({ path: testInfo.outputPath('finale-cosmos-mobile.png') });
  await expect(page.locator('#outro-fireworks')).toHaveAttribute('data-active', 'true');
  await expect.poll(() => page.locator('#outro-fireworks').evaluate(node => Number(node.dataset.burstCount)), { timeout: 8_000 }).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(950);
  await page.screenshot({ path: testInfo.outputPath('finale-recurring-mobile.png') });
});
