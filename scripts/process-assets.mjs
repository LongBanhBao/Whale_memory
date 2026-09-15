import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.resolve(projectRoot, '..');
const photoSource = path.join(sourceRoot, 'Picture');
const whaleSource = path.join(sourceRoot, 'whale');
const sceneSource = path.join(sourceRoot, 'LK');
const publicRoot = path.join(projectRoot, 'public', 'assets');
const fullOutput = path.join(publicRoot, 'images', 'full');
const thumbOutput = path.join(publicRoot, 'images', 'thumb');
const whaleOutput = path.join(publicRoot, 'whale');
const sceneOutput = path.join(publicRoot, 'scene');
const dataOutput = path.join(projectRoot, 'src', 'data');

await Promise.all([
  mkdir(fullOutput, { recursive: true }),
  mkdir(thumbOutput, { recursive: true }),
  mkdir(whaleOutput, { recursive: true }),
  mkdir(sceneOutput, { recursive: true }),
  mkdir(dataOutput, { recursive: true }),
]);

const sceneAssets = [
  { source: 'Water.png', output: 'water.webp', width: 1536, quality: 84 },
  { source: 'BR.png', output: 'blue-room.webp', width: 1400, quality: 84 },
  { source: 'VS.png', output: 'halo.webp', width: 1536, quality: 86 },
];

await Promise.all(sceneAssets.map(({ source, output, width, quality }) => (
  sharp(path.join(sceneSource, source), { limitInputPixels: false })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(path.join(sceneOutput, output))
)));

// Cắt riêng giọt lớn trong Water.png để làm lớp kính cho các giọt ký ức.
// Phần nền đen được loại bằng mix-blend-mode: screen trên giao diện.
await sharp(path.join(sceneSource, 'Water.png'), { limitInputPixels: false })
  .extract({ left: 610, top: 24, width: 316, height: 382 })
  .resize({ width: 260, withoutEnlargement: true })
  .webp({ quality: 90, effort: 6, smartSubsample: true })
  .toFile(path.join(sceneOutput, 'water-drop.webp'));

const sourcePhotos = (await readdir(photoSource))
  .filter((file) => /^p\d+\.png$/i.test(file))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (!sourcePhotos.length) {
  throw new Error(`Không tìm thấy ảnh nguồn trong ${photoSource}`);
}

const imageManifest = [];

for (const [index, file] of sourcePhotos.entries()) {
  const input = path.join(photoSource, file);
  const id = `p${String(index + 1).padStart(2, '0')}`;
  const pipeline = sharp(input, { limitInputPixels: false }).rotate().ensureAlpha();
  const metadata = await pipeline.metadata();
  const stats = await pipeline.stats();

  await Promise.all([
    pipeline
      .clone()
      .webp({ quality: 84, alphaQuality: 96, effort: 6, smartSubsample: true })
      .toFile(path.join(fullOutput, `${id}.webp`)),
    pipeline
      .clone()
      .avif({ quality: 58, effort: 6, chromaSubsampling: '4:4:4' })
      .toFile(path.join(fullOutput, `${id}.avif`)),
    pipeline
      .clone()
      .resize({
        width: 260,
        height: 360,
        fit: 'contain',
        position: 'centre',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        withoutEnlargement: true,
      })
      .webp({ quality: 78, alphaQuality: 92, effort: 6 })
      .toFile(path.join(thumbOutput, `${id}.webp`)),
  ]);

  const placeholder = await pipeline
    .clone()
    .resize({ width: 20, height: 28, fit: 'contain' })
    .webp({ quality: 35, alphaQuality: 60, effort: 4 })
    .toBuffer();

  imageManifest.push({
    id,
    width: metadata.width,
    height: metadata.height,
    aspectRatio: Number((metadata.width / metadata.height).toFixed(4)),
    src: `assets/images/full/${id}.webp`,
    avif: `assets/images/full/${id}.avif`,
    thumb: `assets/images/thumb/${id}.webp`,
    placeholder: `data:image/webp;base64,${placeholder.toString('base64')}`,
    color: `rgb(${stats.dominant.r} ${stats.dominant.g} ${stats.dominant.b})`,
    alt: `Khoảnh khắc của Pastel ${index + 1}`,
  });
}

const frameDirectory = path.join(whaleSource, 'frames', 'png');
const whaleFrames = (await readdir(frameDirectory))
  .filter((file) => /^blue-whale-frame-\d+\.png$/i.test(file))
  .sort();

if (!whaleFrames.length) {
  throw new Error(`Không tìm thấy frame cá voi trong ${frameDirectory}`);
}

const frameBuffers = [];
let union = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
let sourceFrameWidth = 0;
let sourceFrameHeight = 0;

function softenTransparentEdge(data, info) {
  const source = Buffer.from(data);
  const alphaAt = (x, y) => {
    if (x < 0 || y < 0 || x >= info.width || y >= info.height) return 0;
    return source[(y * info.width + x) * info.channels + 3];
  };

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      if (source[offset + 3] <= 4) continue;

      let touchesTransparency = false;
      for (let oy = -1; oy <= 1 && !touchesTransparency; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (alphaAt(x + ox, y + oy) <= 4) {
            touchesTransparency = true;
            break;
          }
        }
      }
      if (!touchesTransparency) continue;

      let best = null;
      for (let oy = -2; oy <= 2; oy += 1) {
        for (let ox = -2; ox <= 2; ox += 1) {
          const candidateAlpha = alphaAt(x + ox, y + oy);
          if (candidateAlpha <= 32) continue;
          let neighbours = 0;
          for (let ny = -1; ny <= 1; ny += 1) {
            for (let nx = -1; nx <= 1; nx += 1) {
              if (alphaAt(x + ox + nx, y + oy + ny) > 32) neighbours += 1;
            }
          }
          const score = neighbours * 256 + candidateAlpha;
          if (!best || score > best.score) best = { x: x + ox, y: y + oy, score };
        }
      }

      if (best) {
        const bestOffset = (best.y * info.width + best.x) * info.channels;
        data[offset] = source[bestOffset];
        data[offset + 1] = source[bestOffset + 1];
        data[offset + 2] = source[bestOffset + 2];
        data[offset + 3] = Math.min(source[offset + 3], 205);
      }
    }
  }
}

for (const file of whaleFrames) {
  const { data, info } = await sharp(path.join(frameDirectory, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  sourceFrameWidth = info.width;
  sourceFrameHeight = info.height;
  let left = info.width;
  let top = info.height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const alpha = data[offset + 3];
      if (alpha <= 4) {
        data[offset] = 0;
        data[offset + 1] = 0;
        data[offset + 2] = 0;
        data[offset + 3] = 0;
        continue;
      }

      // Khử nền trắng còn lưu trong RGB của các pixel bán trong suốt.
      // Việc này loại bỏ quầng trắng khi sprite được phóng lớn trên nền biển tối.
      if (alpha < 255) {
        const coverage = alpha / 255;
        for (let channel = 0; channel < 3; channel += 1) {
          const unmatted = (data[offset + channel] - 255 * (1 - coverage)) / coverage;
          data[offset + channel] = Math.round(Math.max(0, Math.min(255, unmatted)));
        }
      }

      if (alpha > 4) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  softenTransparentEdge(data, info);

  union.left = Math.min(union.left, left);
  union.top = Math.min(union.top, top);
  union.right = Math.max(union.right, right);
  union.bottom = Math.max(union.bottom, bottom);
  frameBuffers.push({ data, info });
}

const padding = 8;
union.left = Math.max(0, union.left - padding);
union.top = Math.max(0, union.top - padding);
union.right = Math.min(sourceFrameWidth - 1, union.right + padding);
union.bottom = Math.min(sourceFrameHeight - 1, union.bottom + padding);
const sourceCropWidth = union.right - union.left + 1;
const sourceCropHeight = union.bottom - union.top + 1;
const whaleScale = 2;
const frameWidth = sourceCropWidth * whaleScale;
const frameHeight = sourceCropHeight * whaleScale;
const columns = 4;
const rows = Math.ceil(frameBuffers.length / columns);
const composites = [];

for (const [index, frame] of frameBuffers.entries()) {
  const input = await sharp(frame.data, {
    raw: { width: frame.info.width, height: frame.info.height, channels: frame.info.channels },
  })
    .extract({ left: union.left, top: union.top, width: sourceCropWidth, height: sourceCropHeight })
    .resize(frameWidth, frameHeight, { kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.55, m1: 0.35, m2: 0.7 })
    .png()
    .toBuffer();
  composites.push({
    input,
    left: (index % columns) * frameWidth,
    top: Math.floor(index / columns) * frameHeight,
  });
}

await sharp({
  create: {
    width: frameWidth * columns,
    height: frameHeight * rows,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .webp({ quality: 88, alphaQuality: 96, effort: 6 })
  .toFile(path.join(whaleOutput, 'blue-whale-sprite.webp'));

await sharp(frameBuffers[0].data, {
  raw: {
    width: frameBuffers[0].info.width,
    height: frameBuffers[0].info.height,
    channels: frameBuffers[0].info.channels,
  },
})
  .extract({ left: union.left, top: union.top, width: sourceCropWidth, height: sourceCropHeight })
  .resize(frameWidth, frameHeight, { kernel: sharp.kernel.lanczos3 })
  .sharpen({ sigma: 0.55, m1: 0.35, m2: 0.7 })
  .webp({ quality: 86, alphaQuality: 96, effort: 6 })
  .toFile(path.join(whaleOutput, 'blue-whale-still.webp'));

const whaleManifest = {
  sprite: 'assets/whale/blue-whale-sprite.webp',
  still: 'assets/whale/blue-whale-still.webp',
  frameWidth,
  frameHeight,
  columns,
  rows,
  frameCount: frameBuffers.length,
  fps: 7,
};

const generatedSource = `// Tệp này được tạo bởi npm run assets.\n` +
  `export const images = ${JSON.stringify(imageManifest, null, 2)};\n\n` +
  `export const whale = ${JSON.stringify(whaleManifest, null, 2)};\n`;

await writeFile(path.join(dataOutput, 'assets.generated.js'), generatedSource, 'utf8');
await writeFile(
  path.join(publicRoot, 'assets-manifest.json'),
  JSON.stringify({ images: imageManifest, whale: whaleManifest }, null, 2),
  'utf8',
);

console.log(`Đã xử lý ${imageManifest.length} ảnh Pastel và ${frameBuffers.length} frame cá voi.`);
console.log(`Đã tối ưu ${sceneAssets.length} ảnh nền cho cảnh mở đầu.`);
console.log(`Sprite cá voi: ${frameWidth} × ${frameHeight} px/frame, ${columns} × ${rows}.`);
