import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles/main.css';
import { images, whale } from './data/assets.generated.js';
import { dropIds, driftIds, portalGroups, sceneColors } from './data/journey.js';
import { createWhalePlayer } from './effects/whale-player.js';
import { createAmbientCanvas } from './effects/ambient-canvas.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
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
const holdControl = document.querySelector('#hold-control');
const holdProgressRing = document.querySelector('#hold-progress');
const holdLabel = document.querySelector('#hold-label');
const holdStatus = document.querySelector('#hold-status');
const holdMemoryImage = document.querySelector('#hold-memory-image');
const dropLayer = document.querySelector('#drop-layer');
const skipIntro = document.querySelector('#skip-intro');
const skipLink = document.querySelector('.skip-link');
const transitionRibbons = document.querySelector('#transition-ribbons');
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

function buildTransitionRibbons() {
  dropIds.forEach((id, index) => {
    const ribbon = document.createElement('span');
    ribbon.className = 'transition-ribbon';
    ribbon.style.setProperty('--ribbon-index', index);
    ribbon.style.setProperty('--ribbon-x', `${[25, 37.5, 50, 62.5, 75][index]}%`);
    ribbon.style.setProperty('--ribbon-delay', `${index * 0.06}`);
    ribbon.append(makeImage(imageById.get(id), 'thumb'));
    transitionRibbons.append(ribbon);
  });
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

holdMemoryImage.src = assetUrl(imageById.get('p08').thumb);
buildTransitionRibbons();
const portals = buildPortals();
const driftMemories = buildDriftMemories();
const { companions } = buildStorm();
buildMemoryWhale();
buildGallery();
outroButtons.forEach((button) => { button.disabled = true; });

const DROP_X = [25, 37.5, 50, 62.5, 75];
const DROP_THRESHOLDS = [0.1, 0.3, 0.5, 0.7, 0.9];
const HOLD_DURATION = reducedMotion ? 450 : 5200;
const RING_LENGTH = 339.292;
let holding = false;
let holdProgress = 0;
let droppedCount = 0;
let introComplete = false;
let introTimeline = null;
let heldAt = 0;
let accumulatedHoldMs = 0;
let activeScene = 0;
let lightSent = false;
let finalTimeline = null;
let previousStormProgress = 0;
let flashPlayed = false;

function makeDrop(index) {
  const image = imageById.get(dropIds[index]);
  const wrapper = document.createElement('div');
  const drop = document.createElement('div');
  wrapper.className = 'falling-memory';
  drop.className = 'memory-drop';
  wrapper.style.setProperty('--drop-x', `${DROP_X[index]}%`);
  wrapper.append(drop);
  const dropImage = makeImage(image);
  dropImage.loading = 'eager';
  dropImage.fetchPriority = 'high';
  drop.append(dropImage);
  dropLayer.append(wrapper);

  const fallDistance = window.innerHeight * 0.605;
  gsap.set(wrapper, { xPercent: -50, y: -50, scale: 0.52, opacity: 0 });
  gsap.timeline()
    .to(wrapper, { opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' })
    .to(wrapper, {
      x: index % 2 ? 9 : -9,
      y: fallDistance,
      rotation: index % 2 ? 6 : -5,
      scaleX: 0.88,
      scaleY: 1.12,
      duration: reducedMotion ? 0.15 : 0.9 + index * 0.035,
      ease: 'power2.in',
      onComplete: () => createRipple(index),
    })
    .to(wrapper, { scaleX: 1.36, scaleY: 0.24, opacity: 0, duration: 0.2, ease: 'power1.out' });
}

function createRipple(index) {
  const ripple = document.createElement('span');
  const splash = document.createElement('span');
  ripple.className = 'water-ripple';
  splash.className = 'water-splash';
  ripple.style.setProperty('--drop-x', `${DROP_X[index]}%`);
  splash.style.setProperty('--drop-x', `${DROP_X[index]}%`);
  splash.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
  dropLayer.append(ripple, splash);
  gsap.fromTo(ripple, { scale: 0.06, opacity: 0.9 }, {
    scale: 0.78 + index * 0.24,
    opacity: 0.22,
    duration: reducedMotion ? 0.15 : 1.65 + index * 0.12,
    ease: 'power2.out',
    onComplete: () => ripple.classList.add('is-settled'),
  });
  gsap.fromTo(splash.children, { y: 8, scaleY: 0.2, opacity: 0 }, {
    y: -26, scaleY: 1, opacity: 0.72, stagger: 0.04, duration: 0.28, yoyo: true, repeat: 1,
  });
  gsap.to(splash, { opacity: 0, duration: 0.2, delay: 0.52, onComplete: () => splash.remove() });
}

function renderHoldFrame(now) {
  if (holding && !introComplete) {
    holdProgress = clamp((accumulatedHoldMs + now - heldAt) / HOLD_DURATION);
    while (droppedCount < DROP_THRESHOLDS.length && holdProgress >= DROP_THRESHOLDS[droppedCount]) {
      makeDrop(droppedCount);
      droppedCount += 1;
    }
    holdProgressRing.style.strokeDashoffset = `${RING_LENGTH * (1 - holdProgress)}`;
    holdControl.style.setProperty('--hold-glow', `${holdProgress}`);
    if (holdProgress >= 1) completeIntro(false);
  }
  requestAnimationFrame(renderHoldFrame);
}

function beginHolding(event) {
  if (introComplete || reducedMotion) return;
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  if (holding) return;
  holding = true;
  heldAt = performance.now();
  holdControl.classList.add('is-holding');
  holdLabel.textContent = 'ĐANG GIỮ KÝ ỨC';
  holdStatus.textContent = 'Tiếp tục giữ để mở hành trình.';
  if (event.pointerId !== undefined) holdControl.setPointerCapture?.(event.pointerId);
}

function endHolding(event) {
  if (!holding || introComplete) return;
  if (event.type === 'keyup' && !['Enter', ' '].includes(event.key)) return;
  accumulatedHoldMs += performance.now() - heldAt;
  heldAt = 0;
  holding = false;
  holdControl.classList.remove('is-holding');
  holdLabel.textContent = holdProgress > 0 ? 'HÃY TIẾP TỤC GIỮ KÝ ỨC' : 'NHẤN VÀ GIỮ';
  holdStatus.textContent = holdProgress > 0
    ? 'Tiến trình đã được giữ lại. Hãy tiếp tục nhấn giữ.'
    : 'Nhấn và giữ để bắt đầu hành trình.';
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

function unlockIntro(skipped = false) {
  introSection.classList.remove('is-transforming');
  introSection.classList.add('is-complete');
  document.body.classList.remove('is-intro-locked');
  holdControl.disabled = true;
  skipIntro.disabled = true;
  holdControl.setAttribute('inert', '');
  skipIntro.setAttribute('inert', '');
  holdStatus.textContent = skipped ? 'Đã bỏ qua phần mở đầu.' : 'Hành trình đã mở.';
  whalePlayer.setPose({ x: 0.5, y: 0.58, scale: 0.86, opacity: 0.9, rotation: -2, glow: 0.7 });
  updateReducedNext();
  window.setTimeout(() => ScrollTrigger.refresh(), 80);
}

function playIntroTransition() {
  introSection.classList.add('is-transforming');
  introTimeline = gsap.timeline({ onComplete: () => unlockIntro(false) });
  introTimeline
    .to(introWorld, { '--transition-progress': 1, duration: 1.5, ease: 'power2.inOut' })
    .to(introWorld, { '--ribbon-progress': 1, duration: 1.15, ease: 'power3.inOut' }, 0.18)
    .call(() => {
      whalePlayer.setPose({ x: 0.5, y: 0.57, scale: 0.78, opacity: 0.92, rotation: -2, glow: 0.92 });
    }, null, 0.74)
    .to(introWorld, { '--transition-settle': 1, duration: 0.55, ease: 'power2.out' }, 1.2);
}

function completeIntro(skipped = false) {
  if (introComplete) return;
  introComplete = true;
  holding = false;
  holdProgress = 1;
  holdProgressRing.style.strokeDashoffset = '0';
  holdControl.classList.remove('is-holding');
  holdControl.classList.add('is-complete');
  holdLabel.textContent = skipped ? 'ĐANG MỞ HÀNH TRÌNH' : 'KÝ ỨC ĐÃ ĐƯỢC GIỮ';
  if (!skipped && droppedCount < 5) {
    while (droppedCount < 5) {
      makeDrop(droppedCount);
      droppedCount += 1;
    }
  }

  if (skipped || reducedMotion) {
    introWorld.style.setProperty('--transition-progress', '1');
    introWorld.style.setProperty('--ribbon-progress', '1');
    introWorld.style.setProperty('--transition-settle', '1');
    unlockIntro(skipped);
  } else {
    gsap.delayedCall(1.08, playIntroTransition);
  }
}

holdControl.addEventListener('pointerdown', beginHolding);
holdControl.addEventListener('pointerup', endHolding);
holdControl.addEventListener('pointercancel', endHolding);
holdControl.addEventListener('keydown', beginHolding);
holdControl.addEventListener('keyup', endHolding);
window.addEventListener('blur', endHolding);
skipIntro.addEventListener('click', () => completeIntro(true));
skipLink.addEventListener('click', (event) => {
  event.preventDefault();
  completeIntro(true);
  window.setTimeout(() => document.querySelector('#blue-road').scrollIntoView(), 60);
});

if (reducedMotion) {
  holdLabel.textContent = 'TIẾP TỤC';
  holdControl.addEventListener('click', () => completeIntro(false));
}

requestAnimationFrame(renderHoldFrame);

function setActiveScene(index) {
  activeScene = index;
  sceneDots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex <= index));
  updateReducedNext();
}

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
  introTimeline?.kill();
  gsap.killTweensOf([introWorld, breakthroughFlash]);
  for (const dialog of [letterDialog, galleryDialog]) if (dialog.open) dialog.close();
  window.scrollTo({ top: 0, behavior: 'auto' });
  lightLayer.replaceChildren();
  lightSent = false;
  flashPlayed = false;
  previousStormProgress = 0;
  introComplete = false;
  holding = false;
  holdProgress = 0;
  droppedCount = 0;
  heldAt = 0;
  accumulatedHoldMs = 0;
  dropLayer.replaceChildren();
  introSection.classList.remove('is-complete', 'is-transforming');
  finaleWorld.classList.remove('is-complete');
  memoryWhale.classList.remove('is-lit');
  introWorld.style.setProperty('--transition-progress', '0');
  introWorld.style.setProperty('--ribbon-progress', '0');
  introWorld.style.setProperty('--transition-settle', '0');
  finaleWorld.style.setProperty('--outro', '0');
  finaleWorld.style.setProperty('--memory-x', '0px');
  finaleWorld.style.setProperty('--memory-y', '0px');
  finaleWorld.style.setProperty('--copy-reveal', '0');
  holdProgressRing.style.strokeDashoffset = `${RING_LENGTH}`;
  holdControl.style.setProperty('--hold-glow', '0');
  holdControl.classList.remove('is-complete', 'is-holding');
  holdControl.disabled = false;
  skipIntro.disabled = false;
  holdControl.removeAttribute('inert');
  skipIntro.removeAttribute('inert');
  holdLabel.textContent = reducedMotion ? 'TIẾP TỤC' : 'NHẤN VÀ GIỮ';
  holdStatus.textContent = 'Nhấn và giữ để bắt đầu hành trình.';
  sendLight.disabled = true;
  sendLight.classList.remove('is-ready');
  outroButtons.forEach((button) => { button.disabled = true; });
  document.body.classList.add('is-intro-locked');
  setActiveScene(0);
  ambient.setMood('intro', 0.45);
  whaleCanvas.classList.remove('is-hidden');
  whalePlayer.setPose({ opacity: 0, x: 0.5, y: 0.53, scale: 1, rotation: 0, glow: 0.45, brightness: 1 });
  window.setTimeout(() => holdControl.focus(), 80);
}

replayJourney.addEventListener('click', resetJourney);

window.addEventListener('load', () => {
  updateDocumentProgress();
  ScrollTrigger.refresh();
});
