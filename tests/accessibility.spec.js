import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

test('không có lỗi accessibility nghiêm trọng', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(250);
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      resultTypes: ['violations'],
    });
    return result.violations
      .filter((violation) => ['serious', 'critical'].includes(violation.impact))
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map((node) => node.target.join(' ')),
      }));
  });
  expect(violations).toEqual([]);
});

test('cảnh giông bão không có lỗi accessibility nghiêm trọng', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const next = page.getByRole('button', { name: 'tiếp', exact: true });
  await next.click();
  await expect(page.locator('#blue-road')).toBeVisible();
  await next.click();
  await expect(page.locator('#storm')).toBeVisible();

  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      resultTypes: ['violations'],
    });
    return result.violations
      .filter((violation) => ['serious', 'critical'].includes(violation.impact))
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map((node) => node.target.join(' ')),
      }));
  });

  expect(violations).toEqual([]);
});
