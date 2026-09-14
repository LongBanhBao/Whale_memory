import { expect, test } from '@playwright/test';
import { goToProgress } from './scene-helpers.js';

test('tia sáng quét thuận hiện cá voi, quét ngược hiện Pastel rồi mới mở đoạn kết', async ({ page }, testInfo) => {
  test.setTimeout(65_000);
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
  await expect(reveal).toHaveAttribute('data-finale-phase', 'idle');
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
    const rect = arm.getBoundingClientRect();
    return {
      centerX: window.innerWidth / 2,
      centerY: window.innerHeight / 2,
      lineStartX: rect.left,
      lineMidY: rect.top + rect.height / 2,
      radius: parseFloat(arm.style.width),
    };
  });
  expect(Math.abs(radiusGeometry.lineStartX - radiusGeometry.centerX)).toBeLessThan(2);
  expect(Math.abs(radiusGeometry.lineMidY - radiusGeometry.centerY)).toBeLessThan(2);
  expect(radiusGeometry.radius).toBeGreaterThan(40);

  await expect(reveal).toHaveAttribute('data-finale-phase', 'sweep-forward', { timeout: 2_500 });
  await expect.poll(() => reveal.evaluate(node => Number(node.dataset.whaleReveal))).toBeGreaterThan(.12);
  expect(Number(await reveal.getAttribute('data-portrait-reveal'))).toBe(0);
  await expect(copy).toHaveCSS('opacity', '0');
  await expect.poll(allActionsDisabled).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('finale-sweep-forward.png') });

  await expect(reveal).toHaveAttribute('data-finale-phase', 'sweep-reverse', { timeout: 4_000 });
  await expect(reveal).toHaveClass(/has-whale-reveal/);
  expect(Number(await reveal.getAttribute('data-whale-reveal'))).toBe(1);
  await expect.poll(() => reveal.evaluate(node => Number(node.dataset.portraitReveal))).toBeGreaterThan(.12);
  await expect(copy).toHaveCSS('opacity', '0');
  await expect.poll(allActionsDisabled).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('finale-sweep-reverse.png') });

  await expect(reveal).toHaveAttribute('data-finale-phase', 'fading', { timeout: 4_000 });
  await expect(copy).toHaveCSS('opacity', '0');
  await expect.poll(allActionsDisabled).toBe(true);
  await expect(reveal).toHaveAttribute('data-finale-phase', 'complete', { timeout: 2_500 });
  await expect(page.locator('#finale-scan')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('.traveling-light')).toHaveCount(0);
  await expect(reveal).toHaveClass(/has-portrait-reveal/);
  await expect.poll(() => copy.evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(.95);
  await expect.poll(allActionsEnabled, { timeout: 4_000 }).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('finale-complete.png') });

  expect(await page.evaluate(() => window.__finalePhaseHistory)).toEqual([
    'arriving', 'extending', 'sweep-forward', 'sweep-reverse', 'fading', 'complete',
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
  await expect.poll(() => page.locator('#outro-actions button').evaluateAll(
    nodes => nodes.every(node => !node.disabled),
  )).toBe(true);
  await context.close();
});
