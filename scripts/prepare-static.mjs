import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');
const publicRoot = path.join(projectRoot, 'public');
const rootApp = path.join(projectRoot, 'app');
const sourceIndex = path.join(projectRoot, 'index.html');
const developmentCheck = "const isDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);";

await Promise.all([
  mkdir(path.join(distRoot, 'public'), { recursive: true }),
  mkdir(rootApp, { recursive: true }),
]);

const sourceHtml = await readFile(sourceIndex, 'utf8');
if (!sourceHtml.includes(developmentCheck)) {
  throw new Error('Không tìm thấy dấu chuyển chế độ development trong index.html.');
}
const staticHtml = sourceHtml.replace(developmentCheck, 'const isDevelopment = false;');

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
]);

console.log('Đã chuẩn bị bản tĩnh cho cả GitHub Pages workflow và main/root.');
