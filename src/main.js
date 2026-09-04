import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles/main.css';
import { images, whale } from './data/assets.generated.js';
import { dropIds, driftIds, portalGroups, sceneColors } from './data/journey.js';
import { createWhalePlayer } from './effects/whale-player.js';
import { createAmbientCanvas } from './effects/ambient-canvas.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const assetUrl = (path) => `${window.__BLUE_VOYAGE_ASSET_ROOT__ ?? import.meta.env.BASE_URL}${path}`;
const imageById = new Map(images.map((image) => [image.id, image]));
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const smoothstep = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const bell = (value, start, peak, end) => (
  smoothstep((value - start) / (peak - start))
  * (1 - smoothstep((value - peak) / (end - peak)))
);

const introSection = document.querySelector('#memory-drops');
const introWorld = document.querySelector('.intro-world');
const introBackdrop = document.querySelector('#intro-backdrop');
const introHalo = document.querySelector('#intro-halo');
const dropLayer = document.querySelector('#drop-layer');
const holdControl = document.querySelector('#hold-control');
const holdProgressRing = document.querySelector('#hold-progress');
const holdLabel = document.querySelector('#hold-label');
const holdStatus = document.querySelector('#hold-status');
const holdWaterDrop = document.querySelector('#hold-water-drop');
const portalLayer = document.querySelector('#portal-layer');
const foregroundLayer = document.querySelector('#foreground-layer');
const driftLayer = document.querySelector('#drift-layer');
const journeyWorld = document.querySelector('.journey-world');
const stormWorld = document.querySelector('.storm-world');
const shardField = document.querySelector('#shard-field');
const memoryParticles = document.querySelector('#memory-particles');
const companionWhales = document.querySelector('#companion-whales');
const ascentLines = document.querySelector('#ascent-lines');
const suspendedDrops = document.querySelector('#suspended-drops');
const breakthroughFlash = document.querySelector('#breakthrough-flash');
const finaleWorld = document.querySelector('.finale-world');
const tributeLines = [...document.querySelectorAll('.tribute-sequence p')];
const memoryWhale = document.querySelector('#memory-whale');
const memoryGrid = document.querySelector('#memory-grid');
const sendLight = document.querySelector('#send-light');
const finalMessage = document.querySelector('#final-message');
const lightLayer = document.querySelector('#light-layer');
const outroActions = document.querySelector('#outro-actions');
const outroButtons = [...outroActions.querySelectorAll('button')];
const replayJourney = document.querySelector('#replay-journey');
const openLetter = document.querySelector('#open-letter');
const openGallery = document.querySelector('#open-gallery');
const letterDialog = document.querySelector('#letter-dialog');
const galleryDialog = document.querySelector('#gallery-dialog');
const galleryGrid = document.querySelector('#gallery-grid');
const reducedNext = document.querySelector('#reduced-next');
const whaleCanvas = document.querySelector('#whale-canvas');
const sceneDots = [...document.querySelectorAll('.scene-progress__dot')];
const progressLine = document.querySelector('#progress-line');

const ambient = createAmbientCanvas(document.querySelector('#ambient-canvas'), reducedMotion);
const whalePlayer = createWhalePlayer(
  document.querySelector('#whale-canvas'),
  whale,
  assetUrl(whale.sprite),
  reducedMotion,
);

function makeImage(image, variant = 'src', decorative = true) {
  const element = document.createElement('img');
  element.src = assetUrl(image[variant]);
  element.alt = decorative ? '' : image.alt;
  element.width = variant === 'thumb' ? 260 : image.width;
  element.height = variant === 'thumb' ? 360 : image.height;
  element.loading = 'lazy';
  element.decoding = 'async';
  return element;
}

function buildPortals() {
  return portalGroups.map((group, portalIndex) => {
    const portal = document.createElement('div');
    portal.className = 'portal';
    portal.style.setProperty('--portal-color', sceneColors[portalIndex]);

    for (const className of ['portal__halo', 'portal__ring', 'portal__core']) {
      const layer = document.createElement('span');
      layer.className = className;
      portal.append(layer);
    }

    for (let sparkIndex = 0; sparkIndex < 12; sparkIndex += 1) {
      const spark = document.createElement('i');
      spark.className = 'portal__spark';
      spark.style.setProperty('--angle', `${sparkIndex * 30}deg`);
      spark.style.setProperty('--delay', `${-sparkIndex * 0.13}s`);
      portal.append(spark);
    }

    group.slice(0, 2).forEach((id) => {
      const card = document.createElement('div');
      card.className = 'portal-card';
      card.append(makeImage(imageById.get(id)));
      portal.append(card);
    });

    for (let dustIndex = 0; dustIndex < 14; dustIndex += 1) {
      const dust = document.createElement('b');
      dust.className = 'portal-dust';
      dust.style.setProperty('--dust-angle', `${dustIndex * (360 / 14)}deg`);
      dust.style.setProperty('--dust-delay', `${(dustIndex % 5) * 0.08}`);
      portal.append(dust);
    }

    const foreground = document.createElement('div');
    foreground.className = 'portal portal--foreground';
    foreground.style.setProperty('--portal-color', sceneColors[portalIndex]);
    const foregroundCard = document.createElement('div');
    foregroundCard.className = 'portal-card portal-card--foreground';
    foregroundCard.append(makeImage(imageById.get(group[2])));
    foreground.append(foregroundCard);

    portalLayer.append(portal);
    foregroundLayer.append(foreground);
    return { portal, foreground };
  });
}

function buildDriftMemories() {
  const positions = [
    [8, 31, -12], [91, 18, 9], [7, 72, 8], [92, 67, -7],
    [20, 88, -14], [80, 87, 12], [84, 41, 5],
  ];
  return driftIds.map((id, index) => {
    const memory = document.createElement('div');
    const [x, y, rotation] = positions[index];
    memory.className = 'drift-memory';
    memory.style.setProperty('--x', `${x}%`);
    memory.style.setProperty('--y', `${y}%`);
    memory.style.setProperty('--rotation', `${rotation}deg`);
    memory.style.setProperty('--blur', `${index % 3 === 0 ? 1.8 : 0.6}px`);
    memory.append(makeImage(imageById.get(id), 'thumb'));
    driftLayer.append(memory);
    return memory;
  });
}

function buildStorm() {
  const shardIds = ['p01', 'p04', 'p06', 'p09', 'p12', 'p16', 'p18', 'p19'];
  const clips = [
    'polygon(0 0, 78% 8%, 54% 100%, 8% 83%)',
    'polygon(19% 0, 100% 14%, 79% 91%, 0 100%)',
    'polygon(0 15%, 91% 0, 100% 75%, 24% 100%)',
    'polygon(13% 0, 100% 27%, 68% 100%, 0 71%)',
  ];
  const positions = [
    [13, 27, -13, -95], [86, 23, 11, 88], [22, 73, 8, -130], [79, 70, -9, 115],
    [42, 17, 18, -70], [60, 81, -16, 90], [95, 49, 7, 130], [5, 52, -6, -120],
  ];

  const shards = shardIds.map((id, index) => {
    const shard = document.createElement('div');
    const [x, y, rotation, travel] = positions[index];
    shard.className = 'memory-shard';
    shard.style.setProperty('--x', `${x}%`);
    shard.style.setProperty('--y', `${y}%`);
    shard.style.setProperty('--rotation', `${rotation}deg`);
    shard.style.setProperty('--travel', `${travel}px`);
    shard.style.setProperty('--clip', clips[index % clips.length]);
    shard.append(makeImage(imageById.get(id), 'thumb'));
    shardField.append(shard);
    return shard;
  });

  for (let index = 0; index < 32; index += 1) {
    const angle = (index / 32) * Math.PI * 2 + (index % 4) * 0.13;
    const radius = 12 + (index % 7) * 4.2;
    const particle = document.createElement('span');
    particle.className = 'memory-particle';
    particle.style.setProperty('--x', `${50 + Math.cos(angle) * radius}%`);
    particle.style.setProperty('--y', `${58 + Math.sin(angle) * radius * 0.72}%`);
    particle.style.setProperty('--drift-x', `${Math.cos(angle) * (80 + (index % 5) * 24)}px`);
    particle.style.setProperty('--drift-y', `${Math.sin(angle) * (70 + (index % 4) * 22)}px`);
    particle.style.setProperty('--size', `${index % 6 === 0 ? 20 : 3 + (index % 4) * 1.5}px`);
    particle.style.setProperty('--delay', `${(index % 8) * 0.06}`);
    particle.style.setProperty('--alpha', `${0.28 + (index % 5) * 0.11}`);
    if (index % 6 === 0) particle.append(makeImage(images[(index * 3) % images.length], 'thumb'));
    memoryParticles.append(particle);
  }

  const companions = [];
  for (let index = 0; index < 18; index += 1) {
    const angle = Math.PI * (0.1 + (index / 17) * 0.8);
    const radiusX = 31 + (index % 3) * 2.5;
    const radiusY = 25 + (index % 4) * 1.4;
    const whaleImage = document.createElement('img');
    whaleImage.className = 'companion-whale';
    whaleImage.src = assetUrl(whale.still);
    whaleImage.alt = '';
    whaleImage.loading = 'lazy';
    whaleImage.decoding = 'async';
    whaleImage.style.setProperty('--x', `${50 - Math.cos(angle) * radiusX}%`);
    whaleImage.style.setProperty('--y', `${67 - Math.sin(angle) * radiusY}%`);
    whaleImage.style.setProperty('--rotation', `${-24 + (index / 17) * 38}deg`);
    whaleImage.style.setProperty('--alpha', `${0.28 + (index % 5) * 0.09}`);
    companionWhales.append(whaleImage);
    companions.push(whaleImage);
  }

  const lineCount = window.innerWidth < 720 ? 18 : 34;
  for (let index = 0; index < lineCount; index += 1) {
    const line = document.createElement('i');
    line.className = 'ascent-line';
    line.style.setProperty('--x', `${3 + ((index * 37) % 94)}%`);
    line.style.setProperty('--y', `${10 + ((index * 29) % 84)}%`);
    line.style.setProperty('--size', `${40 + (index % 6) * 24}px`);
    line.style.setProperty('--delay', `${(index % 9) * -0.11}s`);
    ascentLines.append(line);
  }

  const dropCount = window.innerWidth < 720 ? 36 : 64;
  for (let index = 0; index < dropCount; index += 1) {
    const drop = document.createElement('i');
    drop.className = 'suspended-drop';
    drop.style.setProperty('--x', `${2 + ((index * 43) % 96)}%`);
    drop.style.setProperty('--y', `${7 + ((index * 31) % 88)}%`);
    drop.style.setProperty('--size', `${2 + (index % 5) * 1.2}px`);
    drop.style.setProperty('--delay', `${(index % 11) * 0.035}`);
    suspendedDrops.append(drop);
  }

  return { shards, companions };
}

function buildMemoryWhale() {
  for (let index = 0; index < 48; index += 1) {
    const image = images[index % images.length];
    const tile = document.createElement('div');
    tile.className = 'memory-tile';
    tile.style.setProperty('--tile-color', image.color);
    tile.append(makeImage(image, 'thumb'));
    memoryGrid.append(tile);
  }
  memoryWhale.style.setProperty('--whale-mask', `url("${assetUrl(whale.still)}")`);
  memoryWhale.style.setProperty('--whale-ratio', `${whale.frameWidth / whale.frameHeight}`);
}

function buildGallery() {
  images.forEach((image) => {
    const figure = document.createElement('figure');
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    const galleryImage = makeImage(image, 'src', false);
    source.type = 'image/avif';
    source.srcset = assetUrl(image.avif);
    galleryImage.loading = 'lazy';
    picture.append(source, galleryImage);
    figure.append(picture);
    galleryGrid.append(figure);
  });
}

for (const id of dropIds) {
  const preload = new Image();
  preload.src = assetUrl(imageById.get(id).src);
}

introBackdrop.src = assetUrl('assets/scene/blue-room.webp');
introHalo.src = assetUrl('assets/scene/halo.webp');
holdWaterDrop.src = assetUrl('assets/scene/water-drop.webp');
for (const artwork of [introBackdrop, introHalo, holdWaterDrop]) {
  artwork.loading = 'eager';
  artwork.fetchPriority = 'high';
  artwork.decoding = 'async';
}
const portals = buildPortals();
const driftMemories = buildDriftMemories();
const { companions } = buildStorm();
buildMemoryWhale();
buildGallery();
outroButtons.forEach((button) => { button.disabled = true; });

const DROP_FALL_STARTS = [0, 0.2, 0.4, 0.6, 0.8];
const DROP_FALL_DURATION = 0.16;
const DROP_IMPACTS = DROP_FALL_STARTS.map((start) => start + DROP_FALL_DURATION);
const HOLD_DURATION = reducedMotion ? 700 : 6500;
const HOLD_RING_LENGTH = 2 * Math.PI * 67;
let activeScene = 0;
let lightSent = false;
let finalTimeline = null;
let previousStormProgress = 0;
let flashPlayed = false;
let holding = false;
let holdProgress = 0;
let heldAt = 0;
let accumulatedHoldMs = 0;
let landedCount = 0;
let introComplete = false;
let postStarted = false;
let postTimeline = null;

function buildIntroDrops() {
  return dropIds.map((id, index) => {
    const image = imageById.get(id);
    const wrapper = document.createElement('div');
    const drop = document.createElement('div');
    const photoFrame = document.createElement('span');
    const ripple = document.createElement('span');
    const dropImage = makeImage(image);
    const glass = document.createElement('img');

    wrapper.className = 'falling-memory';
    wrapper.dataset.drop = `${index + 1}`;
    drop.className = 'memory-drop';
    photoFrame.className = 'memory-drop__photo';
    dropImage.loading = 'eager';
    dropImage.fetchPriority = 'high';
    glass.className = 'memory-drop__glass';
    glass.src = assetUrl('assets/scene/water-drop.webp');
    glass.alt = '';
    glass.loading = 'eager';
    glass.decoding = 'async';
    ripple.className = 'water-ripple';
    ripple.dataset.drop = `${index + 1}`;
    ripple.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
    photoFrame.append(dropImage);
    drop.append(photoFrame, glass);
    wrapper.append(drop);
    dropLayer.append(ripple, wrapper);
    return { wrapper, ripple, photoFrame };
  });
}

const introDrops = buildIntroDrops();

function triggerRipple(index) {
  const ripple = introDrops[index].ripple;
  ripple.classList.remove('is-active');
  void ripple.offsetWidth;
  ripple.classList.add('is-active');
}

function renderHoldProgress(progress) {
  const viewportHeight = window.innerHeight;
  const fallDistance = viewportHeight * 0.55;
  let sceneLight = 0;

  introDrops.forEach(({ wrapper }, index) => {
    const fallStart = DROP_FALL_STARTS[index];
    const local = clamp((progress - fallStart) / DROP_FALL_DURATION);
    const hasStarted = progress > fallStart && progress < DROP_IMPACTS[index];
    const fall = smoothstep(local);
    const photoReveal = smoothstep(local / 0.3);
    const impactFade = smoothstep((local - 0.88) / 0.12);
    const stretch = Math.sin(fall * Math.PI) * 0.11;
    const squash = bell(local, 0.78, 0.94, 1);

    wrapper.style.setProperty('--photo-reveal', photoReveal.toFixed(4));
    wrapper.style.opacity = hasStarted ? `${1 - impactFade}` : '0';
    wrapper.style.transform = `translate(-50%, -50%) translate3d(0, ${fallDistance * fall}px, 0) scale(${1 - stretch + squash * 0.18}, ${1 + stretch - squash * 0.28})`;
    sceneLight += smoothstep((progress - (DROP_IMPACTS[index] - 0.006)) / 0.012) * 0.2;
  });

  introWorld.style.setProperty('--intro-light', clamp(sceneLight).toFixed(4));
  introWorld.dataset.stage = 'drops';
  holdProgressRing.style.strokeDashoffset = `${HOLD_RING_LENGTH * (1 - progress)}`;
  holdControl.classList.toggle('has-started', progress > 0.002);
  ambient.setMood('intro', 0.08 + clamp(sceneLight) * 0.5);

  while (landedCount < DROP_IMPACTS.length && progress >= DROP_IMPACTS[landedCount]) {
    triggerRipple(landedCount);
    landedCount += 1;
  }
}

function setWhaleEmergence(progress) {
  const eased = smoothstep(progress);
  introWorld.style.setProperty('--whale-emerge', eased.toFixed(4));
  whalePlayer.setPose({
    x: 0.5 + Math.sin(eased * Math.PI) * 0.075 - eased * 0.02,
    y: lerp(0.48, 0.54, eased),
    scale: lerp(0.12, 0.9, eased),
    rotation: lerp(-8, -2, eased),
    opacity: smoothstep(eased / 0.24) * 0.97,
    glow: lerp(1, 0.68, eased),
    brightness: lerp(1.3, 1.04, eased),
  });
}

function unlockIntro() {
  introComplete = true;
  introSection.classList.add('is-complete');
  document.body.classList.remove('is-intro-locked');
  holdControl.disabled = true;
  holdControl.setAttribute('inert', '');
  holdStatus.textContent = 'Cá voi đã xuất hiện. Cuộn để tiếp tục hành trình.';
  updateReducedNext();
  window.setTimeout(() => ScrollTrigger.refresh(), 80);
}

function startReturnSequence() {
  if (postStarted) return;
  postStarted = true;
  holding = false;
  holdProgress = 1;
  accumulatedHoldMs = HOLD_DURATION;
  renderHoldProgress(1);
  introWorld.dataset.stage = 'pause';
  holdControl.classList.add('is-complete');
  holdLabel.textContent = 'ĐẠI DƯƠNG ĐÃ THỨC GIẤC';
  holdStatus.textContent = 'Năm giọt ký ức đã chạm mặt nước.';

  if (reducedMotion) {
    introWorld.style.setProperty('--halo-growth', '1');
    introWorld.style.setProperty('--title-reveal', '0');
    introWorld.dataset.arrivals = `${introDrops.length}`;
    introWorld.dataset.stage = 'whale';
    introDrops.forEach(({ wrapper }) => { wrapper.style.opacity = '0'; });
    setWhaleEmergence(1);
    window.setTimeout(unlockIntro, 120);
    return;
  }

  const fallDistance = window.innerHeight * 0.55;
  const haloDistance = window.innerHeight * 0.28;
  const whaleState = { progress: 0 };
  const firstReturnAt = 0.8;
  const returnSpacing = 0.72;
  const returnDuration = 0.55;

  introDrops.forEach(({ wrapper }) => {
    wrapper.classList.add('is-returning');
    wrapper.style.removeProperty('transform');
    wrapper.style.setProperty('--photo-reveal', '1');
    gsap.set(wrapper, {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: fallDistance,
      scale: 0.92,
      opacity: 0,
      rotation: 0,
    });
  });

  postTimeline = gsap.timeline({ onComplete: unlockIntro })
    .to(introWorld, { '--title-reveal': 1, duration: 0.65 }, 0.15);

  introDrops.forEach(({ wrapper }, index) => {
    const start = firstReturnAt + index * returnSpacing;
    postTimeline
      .to(wrapper, { opacity: 1, duration: 0.1 }, start)
      .to(wrapper, {
        y: haloDistance,
        scale: 0.42,
        duration: returnDuration,
        ease: 'power2.inOut',
      }, start + 0.05)
      .call(() => {
        introWorld.style.setProperty('--halo-growth', `${(index + 1) / introDrops.length}`);
        introWorld.dataset.arrivals = `${index + 1}`;
      }, null, start + 0.05 + returnDuration * 0.86)
      .to(wrapper, {
        opacity: 0,
        scale: 0.1,
        duration: 0.14,
        ease: 'power2.in',
      }, start + 0.05 + returnDuration);
  });

  const whaleStart = firstReturnAt + (introDrops.length - 1) * returnSpacing + returnDuration + 0.48;
  postTimeline
    .to(introWorld, { '--title-reveal': 0, duration: 0.45 }, whaleStart - 0.2)
    .call(() => { introWorld.dataset.stage = 'whale'; }, null, whaleStart)
    .to(whaleState, {
      progress: 1,
      duration: 1.45,
      ease: 'power2.out',
      onUpdate: () => setWhaleEmergence(whaleState.progress),
    }, whaleStart);
}

function renderHoldFrame(now) {
  if (holding && !postStarted) {
    holdProgress = clamp((accumulatedHoldMs + now - heldAt) / HOLD_DURATION);
    renderHoldProgress(holdProgress);
    if (holdProgress >= 1) startReturnSequence();
  }
  requestAnimationFrame(renderHoldFrame);
}

function beginHolding(event) {
  if (postStarted || introComplete || reducedMotion) return;
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  if (holding) return;
  holding = true;
  heldAt = performance.now();
  holdControl.classList.add('is-holding');
  holdLabel.textContent = 'ĐANG THẢ KÝ ỨC';
  holdStatus.textContent = 'Tiếp tục giữ để thả đủ năm giọt ký ức.';
  if (event.pointerId !== undefined) holdControl.setPointerCapture?.(event.pointerId);
}

function endHolding(event) {
  if (!holding || postStarted) return;
  if (event.type === 'keyup' && !['Enter', ' '].includes(event.key)) return;
  accumulatedHoldMs += performance.now() - heldAt;
  holding = false;
  heldAt = 0;
  holdControl.classList.remove('is-holding');
  holdLabel.textContent = holdProgress > 0 ? 'GIỮ TIẾP ĐỂ ĐÁNH THỨC ĐẠI DƯƠNG' : 'NHẤN VÀ GIỮ';
  holdStatus.textContent = 'Tiến trình đã được giữ lại. Nhấn giữ để tiếp tục.';
}

function updateReducedNext() {
  if (!reducedMotion || !introComplete || activeScene >= 3) {
    reducedNext.hidden = true;
    return;
  }
  const labels = [
    'ĐI ĐẾN CON ĐƯỜNG MÀU XANH',
    'ĐI QUA VÙNG BIỂN TỐI',
    'ĐẾN ĐẠI DƯƠNG KÝ ỨC',
  ];
  reducedNext.querySelector('span').textContent = labels[activeScene];
  reducedNext.hidden = false;
}

function setActiveScene(index) {
  activeScene = index;
  sceneDots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex <= index));
  updateReducedNext();
}

holdControl.addEventListener('pointerdown', beginHolding);
holdControl.addEventListener('pointerup', endHolding);
holdControl.addEventListener('pointercancel', endHolding);
holdControl.addEventListener('keydown', beginHolding);
holdControl.addEventListener('keyup', endHolding);
window.addEventListener('blur', endHolding);

if (reducedMotion) {
  holdLabel.textContent = 'CHẠM ĐỂ BẮT ĐẦU';
  holdControl.addEventListener('click', () => {
    if (postStarted) return;
    holdProgress = 1;
    renderHoldProgress(1);
    startReturnSequence();
  });
}

holdProgressRing.style.strokeDasharray = `${HOLD_RING_LENGTH}`;
holdProgressRing.style.strokeDashoffset = `${HOLD_RING_LENGTH}`;
renderHoldProgress(0);
setWhaleEmergence(0);
requestAnimationFrame(renderHoldFrame);

function updateDocumentProgress() {
  const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progressLine.style.transform = `scaleX(${clamp(window.scrollY / maximum)})`;
}

let scrollQueued = false;
window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    updateDocumentProgress();
    scrollQueued = false;
  });
}, { passive: true });

reducedNext.addEventListener('click', () => {
  const nextIndex = Math.min(3, activeScene + 1);
  const sections = ['#memory-drops', '#blue-road', '#storm', '#ocean-remembers'];
  const section = document.querySelector(sections[nextIndex]);
  const progress = nextIndex === 3 ? 0.92 : 0.42;
  window.scrollTo({
    top: section.offsetTop + (section.offsetHeight - window.innerHeight) * progress,
    behavior: 'auto',
  });
});

ScrollTrigger.create({
  trigger: '#blue-road', start: 'top top', end: 'bottom bottom',
  onEnter: () => setActiveScene(1),
  onEnterBack: () => setActiveScene(1),
  onLeaveBack: () => setActiveScene(0),
  onUpdate: ({ progress }) => {
    const gateCenters = [0.08, 0.31, 0.54, 0.75];
    const currentGate = gateCenters.reduce((closest, center, index) => (
      Math.abs(progress - center) < Math.abs(progress - gateCenters[closest]) ? index : closest
    ), 0);
    const gateProgress = smoothstep((progress - 0.82) / 0.11);
    const gateCrack = smoothstep((progress - 0.875) / 0.07);
    const gateBreak = smoothstep((progress - 0.94) / 0.055);
    const colorDrain = smoothstep((progress - 0.8) / 0.19);

    journeyWorld.style.setProperty('--journey-progress', progress.toFixed(4));
    journeyWorld.style.setProperty('--journey-light', `${0.4 + progress * 0.6}`);
    journeyWorld.style.setProperty('--scene-accent', sceneColors[currentGate]);
    journeyWorld.style.setProperty('--gate-progress', gateProgress.toFixed(4));
    journeyWorld.style.setProperty('--gate-crack', gateCrack.toFixed(4));
    journeyWorld.style.setProperty('--gate-break', gateBreak.toFixed(4));
    journeyWorld.style.setProperty('--color-drain', colorDrain.toFixed(4));
    ambient.setMood('journey', 0.48 + progress * 0.34);

    portals.forEach(({ portal, foreground }, index) => {
      const center = gateCenters[index];
      const visible = smoothstep((0.19 - Math.abs(progress - center)) / 0.09) * (1 - gateProgress);
      const phase = clamp((progress - (center - 0.17)) / 0.34);
      const travelX = (0.5 - phase) * window.innerWidth * 0.17;
      const scale = 0.66 + phase * 0.54;
      for (const layer of [portal, foreground]) {
        layer.style.opacity = `${visible}`;
        layer.style.transform = `translate(calc(-50% + ${travelX}px), -50%) scale(${scale})`;
        layer.style.setProperty('--portal-strength', visible.toFixed(3));
        layer.classList.toggle('is-active', visible > 0.42);
      }
    });

    driftMemories.forEach((memory, index) => {
      const wave = Math.sin(progress * Math.PI * 2 + index * 0.84);
      memory.style.setProperty('--drift-opacity', `${(0.05 + Math.max(0, wave) * 0.22) * (1 - colorDrain)}`);
      memory.style.translate = `${wave * (8 + index)}px ${progress * (index % 2 ? -42 : 52)}px`;
    });

    whalePlayer.setPose({
      x: lerp(0.48 + Math.sin(progress * Math.PI * 6) * 0.052, 0.5, gateProgress),
      y: lerp(0.54 + Math.sin(progress * Math.PI * 4) * 0.033, 0.52, gateProgress),
      scale: lerp(0.9 + Math.sin(progress * Math.PI * 2) * 0.05, 0.58, gateProgress),
      rotation: Math.sin(progress * Math.PI * 5) * 2 + gateProgress * 6,
      opacity: 0.96 - gateBreak * 0.38,
      glow: 0.55 + progress * 0.32,
      brightness: 1 - colorDrain * 0.42,
    });
  },
});

function playBreakthroughFlash() {
  if (reducedMotion) return;
  gsap.killTweensOf(breakthroughFlash);
  gsap.timeline()
    .set(breakthroughFlash, { opacity: 0 })
    .to(breakthroughFlash, { opacity: 1, duration: 0.15, ease: 'power3.in' })
    .to(breakthroughFlash, { opacity: 1, duration: 0.42 })
    .to(breakthroughFlash, { opacity: 0, duration: 0.62, ease: 'power2.out' });
}

ScrollTrigger.create({
  trigger: '#storm', start: 'top top', end: 'bottom bottom',
  onEnter: () => setActiveScene(2),
  onEnterBack: () => setActiveScene(2),
  onLeaveBack: () => setActiveScene(1),
  onUpdate: ({ progress }) => {
    const scatter = smoothstep(progress / 0.25);
    const memoryReturn = smoothstep((progress - 0.38) / 0.24);
    const companionsReveal = smoothstep((progress - 0.4) / 0.2);
    const ascent = smoothstep((progress - 0.64) / 0.29);
    const drops = smoothstep((progress - 0.83) / 0.1);
    const stars = smoothstep((progress - 0.93) / 0.055);

    stormWorld.style.setProperty('--storm-intensity', `${clamp(progress * 1.35)}`);
    stormWorld.style.setProperty('--storm-light', `${companionsReveal}`);
    stormWorld.style.setProperty('--companions', `${companionsReveal}`);
    stormWorld.style.setProperty('--shard-flow', (scatter * (1 - memoryReturn)).toFixed(4));
    stormWorld.style.setProperty('--memory-return', memoryReturn.toFixed(4));
    stormWorld.style.setProperty('--line-one', bell(progress, 0.18, 0.27, 0.43).toFixed(4));
    stormWorld.style.setProperty('--line-two', bell(progress, 0.43, 0.53, 0.68).toFixed(4));
    stormWorld.style.setProperty('--ascent', ascent.toFixed(4));
    stormWorld.style.setProperty('--rift', smoothstep((progress - 0.72) / 0.2).toFixed(4));
    stormWorld.style.setProperty('--drops', drops.toFixed(4));
    stormWorld.style.setProperty('--stars', stars.toFixed(4));
    ambient.setMood('storm', 0.45 + progress * 0.5);

    companions.forEach((companion, index) => {
      const wave = Math.sin(progress * Math.PI * 5 + index * 0.7);
      companion.style.setProperty('--companion-scale', `${0.52 + companionsReveal * 0.34 + wave * 0.04}`);
      companion.style.translate = `${wave * 8}px ${-ascent * (25 + (index % 5) * 7)}px`;
    });

    if (!flashPlayed && previousStormProgress < 0.9 && progress >= 0.9) {
      flashPlayed = true;
      playBreakthroughFlash();
    } else if (progress < 0.72) {
      flashPlayed = false;
      if (reducedMotion) breakthroughFlash.style.opacity = '0';
    }
    previousStormProgress = progress;

    whalePlayer.setPose({
      x: lerp(0.53, 0.58, ascent),
      y: lerp(0.64, 0.1, ascent),
      scale: lerp(0.82, 1.1, ascent),
      rotation: lerp(8, -27, ascent),
      opacity: progress > 0.985 ? 0 : 0.96,
      glow: lerp(0.1, 1, companionsReveal),
      brightness: lerp(0.52, 1.38, companionsReveal),
    });
  },
});

ScrollTrigger.create({
  trigger: '#ocean-remembers', start: 'top top', end: 'bottom bottom',
  onEnter: () => { setActiveScene(3); whaleCanvas.classList.add('is-hidden'); },
  onEnterBack: () => { setActiveScene(3); whaleCanvas.classList.add('is-hidden'); },
  onLeaveBack: () => { setActiveScene(2); whaleCanvas.classList.remove('is-hidden'); },
  onUpdate: ({ progress }) => {
    [0.1, 0.24, 0.38, 0.52].forEach((center, index) => {
      const opacity = bell(progress, center - 0.085, center, center + 0.1);
      finaleWorld.style.setProperty(`--tribute-${index + 1}`, opacity.toFixed(4));
      tributeLines[index].setAttribute('aria-hidden', opacity < 0.08 ? 'true' : 'false');
    });

    const reveal = smoothstep((progress - 0.53) / 0.14);
    const cameraPullback = smoothstep((progress - 0.58) / 0.2);
    const buttonReveal = smoothstep((progress - 0.78) / 0.12);
    const targetScale = clamp(0.82 + (760 - window.innerWidth) / 2600, 0.82, 0.98);
    const ready = buttonReveal > 0.96 && !lightSent;

    finaleWorld.style.setProperty('--memory-opacity', `${reveal}`);
    finaleWorld.style.setProperty('--memory-scale', `${lerp(1.48, targetScale, cameraPullback)}`);
    finaleWorld.style.setProperty('--copy-reveal', lightSent ? '1' : '0');
    finaleWorld.style.setProperty('--button-reveal', `${buttonReveal}`);
    memoryGrid.style.translate = `${Math.sin(progress * Math.PI) * -1.2}% ${Math.sin(progress * Math.PI * 0.7) * 1.1}%`;
    sendLight.disabled = !ready;
    sendLight.classList.toggle('is-ready', ready);
    whalePlayer.setPose({ opacity: 0 });
    ambient.setMood('finale', 0.58 + progress * 0.38);
  },
});

function revealOutro() {
  lightSent = true;
  memoryWhale.classList.add('is-lit');
  finaleWorld.classList.add('is-complete');
  finaleWorld.style.setProperty('--copy-reveal', '1');
  finalMessage.textContent = 'Hành trình vẫn đang tiếp tục.';
  outroButtons.forEach((button) => { button.disabled = false; });

  if (reducedMotion) {
    finaleWorld.style.setProperty('--outro', '1');
    finaleWorld.style.setProperty('--memory-x', '16vw');
    finaleWorld.style.setProperty('--memory-y', '-4vh');
    return;
  }

  finalTimeline = gsap.timeline()
    .to(finaleWorld, { '--outro': 1, duration: 1.25, ease: 'power2.out' })
    .to(finaleWorld, { '--memory-x': '18vw', '--memory-y': '-5vh', duration: 2.6, ease: 'power1.inOut' }, 0.3)
    .fromTo('.finale-copy', { filter: 'brightness(1.8)' }, { filter: 'brightness(1)', duration: 1.5 }, 0.42);
}

function sendLightToWhale(event) {
  if (sendLight.disabled || lightSent) return;
  sendLight.disabled = true;
  sendLight.classList.remove('is-ready');
  const buttonRect = sendLight.getBoundingClientRect();
  const whaleRect = memoryWhale.getBoundingClientRect();
  const startX = Number.isFinite(event.clientX) && event.clientX > 0
    ? event.clientX : buttonRect.left + buttonRect.width / 2;
  const startY = Number.isFinite(event.clientY) && event.clientY > 0
    ? event.clientY : buttonRect.top + buttonRect.height / 2;
  const targetX = whaleRect.left + whaleRect.width * 0.67;
  const targetY = whaleRect.top + whaleRect.height * 0.53;
  const light = document.createElement('span');
  light.className = 'traveling-light';
  light.style.left = `${startX}px`;
  light.style.top = `${startY}px`;
  lightLayer.append(light);

  if (reducedMotion) {
    light.remove();
    revealOutro();
    return;
  }

  gsap.timeline({ onComplete: () => { light.remove(); revealOutro(); } })
    .to(light, {
      x: (targetX - startX) * 0.46 - 70,
      y: (targetY - startY) * 0.43 - 95,
      scale: 1.45,
      duration: 0.56,
      ease: 'power2.out',
    })
    .to(light, {
      x: targetX - startX,
      y: targetY - startY,
      scale: 0.35,
      duration: 0.76,
      ease: 'power3.in',
    });
}

sendLight.addEventListener('click', sendLightToWhale);

function openMemoryDialog(dialog) {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

openLetter.addEventListener('click', () => openMemoryDialog(letterDialog));
openGallery.addEventListener('click', () => openMemoryDialog(galleryDialog));
document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
for (const dialog of [letterDialog, galleryDialog]) {
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}

function resetJourney() {
  finalTimeline?.kill();
  postTimeline?.kill();
  gsap.killTweensOf(breakthroughFlash);
  introDrops.forEach(({ wrapper, ripple }) => {
    gsap.killTweensOf(wrapper);
    wrapper.classList.remove('is-returning');
    wrapper.removeAttribute('style');
    ripple.classList.remove('is-active');
  });
  for (const dialog of [letterDialog, galleryDialog]) if (dialog.open) dialog.close();
  window.scrollTo({ top: 0, behavior: 'auto' });
  lightLayer.replaceChildren();
  lightSent = false;
  flashPlayed = false;
  previousStormProgress = 0;
  finaleWorld.classList.remove('is-complete');
  memoryWhale.classList.remove('is-lit');
  finaleWorld.style.setProperty('--outro', '0');
  finaleWorld.style.setProperty('--memory-x', '0px');
  finaleWorld.style.setProperty('--memory-y', '0px');
  finaleWorld.style.setProperty('--copy-reveal', '0');
  sendLight.disabled = true;
  sendLight.classList.remove('is-ready');
  outroButtons.forEach((button) => { button.disabled = true; });
  holding = false;
  holdProgress = 0;
  heldAt = 0;
  accumulatedHoldMs = 0;
  landedCount = 0;
  introComplete = false;
  postStarted = false;
  postTimeline = null;
  introSection.classList.remove('is-complete');
  introWorld.dataset.stage = 'drops';
  delete introWorld.dataset.arrivals;
  introWorld.style.setProperty('--halo-growth', '0');
  introWorld.style.setProperty('--title-reveal', '0');
  holdControl.disabled = false;
  holdControl.removeAttribute('inert');
  holdControl.classList.remove('is-complete', 'is-holding', 'has-started');
  holdLabel.textContent = reducedMotion ? 'CHẠM ĐỂ BẮT ĐẦU' : 'NHẤN VÀ GIỮ';
  holdStatus.textContent = 'Nhấn và giữ để thả những giọt ký ức.';
  document.body.classList.add('is-intro-locked');
  setActiveScene(0);
  whaleCanvas.classList.remove('is-hidden');
  renderHoldProgress(0);
  setWhaleEmergence(0);
  window.setTimeout(() => ScrollTrigger.refresh(), 80);
}

replayJourney.addEventListener('click', resetJourney);

window.addEventListener('load', () => {
  updateDocumentProgress();
  ScrollTrigger.refresh();
});
