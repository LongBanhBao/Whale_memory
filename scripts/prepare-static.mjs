import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');
const publicRoot = path.join(projectRoot, 'public');
const rootApp = path.join(projectRoot, 'app');
const sourceIndex = path.join(projectRoot, 'index.html');
const developmentCheck = "const isDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);";
const assetRootDeclaration = "const deploymentAssetRoot = './public/';";
const githubRepository = process.env.GITHUB_REPOSITORY ?? '';
const githubSha = process.env.GITHUB_SHA ?? '';
const hasPinnedGithubRevision = (
  /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(githubRepository)
  && /^[0-9a-f]{40}$/i.test(githubSha)
);
const deploymentAssetRoot = hasPinnedGithubRevision
  ? `https://cdn.jsdelivr.net/gh/${githubRepository}@${githubSha}/public/`
  : './public/';

await Promise.all([
  mkdir(path.join(distRoot, 'public'), { recursive: true }),
  mkdir(rootApp, { recursive: true }),
]);

const sourceHtml = await readFile(sourceIndex, 'utf8');
if (!sourceHtml.includes(developmentCheck)) {
  throw new Error('Không tìm thấy dấu chuyển chế độ development trong index.html.');
}
if (!sourceHtml.includes(assetRootDeclaration)) {
  throw new Error('Không tìm thấy khai báo asset root trong index.html.');
}
const staticHtml = sourceHtml
  .replace(developmentCheck, 'const isDevelopment = false;')
  .replace(
    assetRootDeclaration,
    `const deploymentAssetRoot = ${JSON.stringify(deploymentAssetRoot)};`,
  );

// GitHub Pages của repository từng được cấu hình xuất bản trực tiếp từ main.
// Giữ một bundle production ổn định ở root, đồng thời tạo cùng cấu trúc trong
// dist để workflow Pages hoạt động đúng ở cả hai chế độ nguồn xuất bản.
await Promise.all([
  writeFile(path.join(distRoot, 'index.html'), staticHtml, 'utf8'),
  cp(publicRoot, path.join(distRoot, 'public'), { recursive: true, force: true }),
  cp(path.join(distRoot, 'app'), rootApp, { recursive: true, force: true }),
]);

await Promise.all([
  access(path.join(rootApp, 'main.css')),
  access(path.join(rootApp, 'main.js')),
  access(path.join(distRoot, 'public', 'assets', 'scene', 'blue-room.webp')),
  access(path.join(distRoot, 'public', 'assets', 'scene', 'storm-ocean-v2.webp')),
  access(path.join(distRoot, 'public', 'assets', 'scene', 'finale-pastel.webp')),
  access(path.join(distRoot, 'public', 'assets', 'video', 'P.mp4')),
]);

console.log('Đã chuẩn bị bản tĩnh cho cả GitHub Pages workflow và main/root.');
console.log(`Asset production: ${deploymentAssetRoot}`);
