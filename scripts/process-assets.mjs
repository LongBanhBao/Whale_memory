import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.resolve(projectRoot, '..');
const photoSource = path.join(sourceRoot, 'Picture');
const whaleSource = path.join(sourceRoot, 'whale');
const publicRoot = path.join(projectRoot, 'public', 'assets');
const fullOutput = path.join(publicRoot, 'images', 'full');
const thumbOutput = path.join(publicRoot, 'images', 'thumb');
const whaleOutput = path.join(publicRoot, 'whale');
const dataOutput = path.join(projectRoot, 'src', 'data');

await Promise.all([
  mkdir(fullOutput, { recursive: true }),
  mkdir(thumbOutput, { recursive: true }),
  mkdir(whaleOutput, { recursive: true }),
  mkdir(dataOutput, { recursive: true }),
]);

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

for (const file of whaleFrames) {
  const { data, info } = await sharp(path.join(frameDirectory, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha > 4) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  union.left = Math.min(union.left, left);
  union.top = Math.min(union.top, top);
  union.right = Math.max(union.right, right);
  union.bottom = Math.max(union.bottom, bottom);
  frameBuffers.push(path.join(frameDirectory, file));
}

const padding = 8;
union.left = Math.max(0, union.left - padding);
union.top = Math.max(0, union.top - padding);
union.right = Math.min(383, union.right + padding);
union.bottom = Math.min(511, union.bottom + padding);
const frameWidth = union.right - union.left + 1;
const frameHeight = union.bottom - union.top + 1;
const columns = 4;
const rows = Math.ceil(frameBuffers.length / columns);
const composites = [];

for (const [index, file] of frameBuffers.entries()) {
  const input = await sharp(file)
    .extract({ left: union.left, top: union.top, width: frameWidth, height: frameHeight })
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

await sharp(frameBuffers[0])
  .extract({ left: union.left, top: union.top, width: frameWidth, height: frameHeight })
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
console.log(`Sprite cá voi: ${frameWidth} × ${frameHeight} px/frame, ${columns} × ${rows}.`);
