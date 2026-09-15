import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('bản deploy khóa asset CDN theo SHA và giữ fallback local', async () => {
  const [sourceHtml, buildScript] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/prepare-static.mjs', import.meta.url), 'utf8'),
  ]);

  expect(sourceHtml).toContain(
    'const deploymentAssetRoot = \'https://cdn.jsdelivr.net/gh/LongBanhBao/Whale_memory@',
  );
  expect(sourceHtml).toContain('/public/\';');
  expect(sourceHtml).toContain("const assetRoot = isDevelopment ? '/' : deploymentAssetRoot;");
  expect(buildScript).toContain('https://cdn.jsdelivr.net/gh/${githubRepository}@${githubSha}/public/');
  expect(buildScript).toContain("const deploymentAssetRoot = hasPinnedGithubRevision");
  expect(buildScript).toContain(": './public/';");
});
