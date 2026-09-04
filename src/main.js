import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles/main.css';
import { images, whale } from './data/assets.generated.js';
import { dropIds, driftIds, portalGroups, sceneColors } from './data/journey.js';
import { createWhalePlayer } from './effects/whale-player.js';
import { createAmbientCanvas } from './effects/ambient-canvas.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = reducedMotionQuery.matches;
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const imageById = new Map(images.map((image) => [image.id, image]));
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const smoothstep = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

const introSection = document.querySelector('#memory-drops');
const holdControl = document.querySelector('#hold-control');
const holdProgressRing = document.querySelector('#hold-progress');
const holdLabel = document.querySelector('#hold-label');
const holdStatus = document.querySelector('#hold-status');
const dropLayer = document.querySelector('#drop-layer');
const skipIntro = document.querySelector('#skip-intro');
const skipLink = document.querySelector('.skip-link');
const portalLayer = document.querySelector('#portal-layer');
const driftLayer = document.querySelector('#drift-layer');
const journeyWorld = document.querySelector('.journey-world');
const stormWorld = document.querySelector('.storm-world');
const shardField = document.querySelector('#shard-field');
const companionWhales = document.querySelector('#companion-whales');
const finaleWorld = document.querySelector('.finale-world');
const memoryWhale = document.querySelector('#memory-whale');
const memoryGrid = document.querySelector('#memory-grid');
const sendLight = document.querySelector('#send-light');
const lightLayer = document.querySelector('#light-layer');
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

for (const id of dropIds) {
  const preload = new Image();
  preload.src = assetUrl(imageById.get(id).src);
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

    group.forEach((id) => {
      const card = document.createElement('div');
      card.className = 'portal-card';
      card.append(makeImage(imageById.get(id)));
      portal.append(card);
    });

    portalLayer.append(portal);
    return portal;
  });
}

function buildDriftMemories() {
  const positions = [
    [8, 31, -12], [91, 18, 9], [7, 72, 8], [92, 67, -7],
    [20, 88, -14], [80, 87, 12], [84, 41, 5],
  ];
  return driftIds.map((id, index) => {
    const image = imageById.get(id);
    const memory = document.createElement('div');
    const [x, y, rotation] = positions[index];
    memory.className = 'drift-memory';
    memory.style.setProperty('--x', `${x}%`);
    memory.style.setProperty('--y', `${y}%`);
    memory.style.setProperty('--rotation', `${rotation}deg`);
    memory.style.setProperty('--blur', `${index % 3 === 0 ? 1.8 : 0.6}px`);
    memory.append(makeImage(image, 'thumb'));
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
  return { shards, companions };
}

function buildMemoryWhale() {
  const tileCount = window.innerWidth < 760 ? 42 : 40;
  for (let index = 0; index < tileCount; index += 1) {
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

const portals = buildPortals();
const driftMemories = buildDriftMemories();
const { companions } = buildStorm();
buildMemoryWhale();

const DROP_X = [28, 39, 50, 61, 72];
const DROP_THRESHOLDS = [0.1, 0.3, 0.5, 0.7, 0.9];
const HOLD_DURATION = reducedMotion ? 450 : 5200;
const RING_LENGTH = 339.292;
let holding = false;
let holdProgress = 0;
let droppedCount = 0;
let introComplete = false;
let previousFrame = performance.now();

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
  gsap.set(wrapper, { xPercent: -50, y: -50, scale: 0.55, opacity: 0 });
  gsap.timeline()
    .to(wrapper, { opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' })
    .to(wrapper, {
      y: fallDistance,
      rotation: index % 2 ? 5 : -4,
      duration: reducedMotion ? 0.15 : 0.9 + index * 0.035,
      ease: 'power2.in',
      onComplete: () => createRipple(index),
    })
    .to(wrapper, { scaleX: 1.28, scaleY: 0.28, opacity: 0, duration: 0.18, ease: 'power1.out' });
}

function createRipple(index) {
  const ripple = document.createElement('span');
  ripple.className = 'water-ripple';
  ripple.style.setProperty('--drop-x', `${DROP_X[index]}%`);
  dropLayer.append(ripple);
  gsap.fromTo(
    ripple,
    { scale: 0.08, opacity: 0.88 },
    {
      scale: 0.65 + index * 0.3,
      opacity: 0,
      duration: reducedMotion ? 0.2 : 1.8 + index * 0.16,
      ease: 'power2.out',
      onComplete: () => ripple.remove(),
    },
  );
}

function renderHoldFrame(now) {
  const delta = Math.min(50, now - previousFrame);
  previousFrame = now;
  if (holding && !introComplete) {
    holdProgress = clamp(holdProgress + delta / HOLD_DURATION);
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
  holding = true;
  holdControl.classList.add('is-holding');
  holdLabel.textContent = 'ĐANG GIỮ KÝ ỨC';
  holdStatus.textContent = 'Tiếp tục giữ để mở hành trình.';
  if (event.pointerId !== undefined) holdControl.setPointerCapture?.(event.pointerId);
}

function endHolding(event) {
  if (!holding || introComplete) return;
  if (event.type === 'keyup' && !['Enter', ' '].includes(event.key)) return;
  holding = false;
  holdControl.classList.remove('is-holding');
  holdLabel.textContent = holdProgress > 0 ? 'TIẾP TỤC GIỮ' : 'NHẤN VÀ GIỮ';
  holdStatus.textContent = holdProgress > 0
    ? 'Tiến trình đã được giữ lại. Hãy tiếp tục nhấn giữ.'
    : 'Nhấn và giữ để bắt đầu hành trình.';
}

function completeIntro(skipped = false) {
  if (introComplete) return;
  introComplete = true;
  holding = false;
  holdProgress = 1;
  holdProgressRing.style.strokeDashoffset = '0';
  holdControl.classList.remove('is-holding');
  holdControl.classList.add('is-complete');
  holdStatus.textContent = skipped ? 'Đã bỏ qua phần mở đầu.' : 'Hành trình đã mở.';
  if (!skipped && droppedCount < 5) {
    while (droppedCount < 5) {
      makeDrop(droppedCount);
      droppedCount += 1;
    }
  }

  const delay = skipped || reducedMotion ? 0 : 1.05;
  gsap.delayedCall(delay, () => {
    introSection.classList.add('is-complete');
    document.body.classList.remove('is-intro-locked');
    whalePlayer.setPose({ x: 0.5, y: 0.58, scale: 0.86, opacity: 0.78, rotation: -2, glow: 0.7 });
    window.setTimeout(() => ScrollTrigger.refresh(), 80);
  });
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
  sceneDots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex <= index));
}

function updateDocumentProgress() {
  const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = clamp(window.scrollY / maximum);
  progressLine.style.transform = `scaleX(${progress})`;
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

ScrollTrigger.create({
  trigger: '#blue-road',
  start: 'top top',
  end: 'bottom bottom',
  onEnter: () => setActiveScene(1),
  onEnterBack: () => setActiveScene(1),
  onLeaveBack: () => setActiveScene(0),
  onUpdate: ({ progress }) => {
    const gateFloat = progress * 4;
    const currentGate = Math.min(3, Math.floor(gateFloat));
    journeyWorld.style.setProperty('--journey-progress', progress.toFixed(4));
    journeyWorld.style.setProperty('--journey-light', `${0.4 + progress * 0.6}`);
    journeyWorld.style.setProperty('--scene-accent', sceneColors[currentGate]);
    ambient.setMood('journey', 0.48 + progress * 0.34);

    portals.forEach((portal, index) => {
      const local = gateFloat - index;
      const visible = clamp(Math.sin(clamp(local) * Math.PI) * 1.18);
      const travelX = (0.48 - clamp(local)) * window.innerWidth * 0.2;
      const scale = 0.48 + clamp(local) * 1.04;
      portal.style.opacity = `${visible}`;
      portal.style.transform = `translate(calc(-50% + ${travelX}px), -50%) scale(${scale})`;
      portal.style.setProperty('--portal-strength', visible.toFixed(3));
      portal.classList.toggle('is-active', visible > 0.42);
    });

    driftMemories.forEach((memory, index) => {
      const wave = Math.sin(progress * Math.PI * 2 + index * 0.84);
      memory.style.setProperty('--drift-opacity', `${0.05 + Math.max(0, wave) * 0.22}`);
      memory.style.translate = `${wave * (8 + index)}px ${progress * (index % 2 ? -42 : 52)}px`;
    });

    const exit = smoothstep((progress - 0.88) / 0.12);
    whalePlayer.setPose({
      x: 0.48 + Math.sin(progress * Math.PI * 6) * 0.055 + exit * 0.13,
      y: 0.54 + Math.sin(progress * Math.PI * 4) * 0.035 + exit * 0.09,
      scale: 0.9 + Math.sin(progress * Math.PI * 2) * 0.05,
      rotation: Math.sin(progress * Math.PI * 5) * 2 + exit * 9,
      opacity: 0.96,
      glow: 0.55 + progress * 0.32,
      brightness: 1 - exit * 0.34,
    });
  },
});

ScrollTrigger.create({
  trigger: '#storm',
  start: 'top top',
  end: 'bottom bottom',
  onEnter: () => setActiveScene(2),
  onEnterBack: () => setActiveScene(2),
  onLeaveBack: () => setActiveScene(1),
  onUpdate: ({ progress }) => {
    const companionsReveal = smoothstep((progress - 0.45) / 0.22);
    const ascent = smoothstep((progress - 0.65) / 0.3);
    const rift = smoothstep((progress - 0.72) / 0.22);
    const flashIn = smoothstep((progress - 0.9) / 0.065);
    const flashOut = smoothstep((progress - 0.965) / 0.035);
    const flash = flashIn * (1 - flashOut);

    stormWorld.style.setProperty('--storm-intensity', `${clamp(progress * 1.35)}`);
    stormWorld.style.setProperty('--storm-light', `${companionsReveal}`);
    stormWorld.style.setProperty('--companions', `${companionsReveal}`);
    stormWorld.style.setProperty('--rift', `${rift}`);
    stormWorld.style.setProperty('--flash', `${flash}`);
    ambient.setMood('storm', 0.45 + progress * 0.5);

    companions.forEach((companion, index) => {
      const wave = Math.sin(progress * Math.PI * 5 + index * 0.7);
      companion.style.setProperty('--companion-scale', `${0.52 + companionsReveal * 0.34 + wave * 0.04}`);
      companion.style.translate = `${wave * 8}px ${-ascent * (25 + (index % 5) * 7)}px`;
    });

    whalePlayer.setPose({
      x: lerp(0.53, 0.58, ascent),
      y: lerp(0.64, 0.12, ascent),
      scale: lerp(0.82, 1.08, ascent),
      rotation: lerp(8, -27, ascent),
      opacity: progress > 0.985 ? 0 : 0.96,
      glow: lerp(0.1, 1, companionsReveal),
      brightness: lerp(0.52, 1.35, companionsReveal),
    });
  },
});

ScrollTrigger.create({
  trigger: '#ocean-remembers',
  start: 'top top',
  end: 'bottom bottom',
  onEnter: () => setActiveScene(3),
  onEnterBack: () => setActiveScene(3),
  onLeaveBack: () => setActiveScene(2),
  onUpdate: ({ progress }) => {
    const reveal = smoothstep(progress / 0.18);
    const cameraPullback = smoothstep((progress - 0.12) / 0.58);
    const copyReveal = smoothstep((progress - 0.64) / 0.16);
    const buttonReveal = smoothstep((progress - 0.76) / 0.12);
    const scale = lerp(1.5, window.innerWidth < 760 ? 0.92 : 0.78, cameraPullback);

    finaleWorld.style.setProperty('--memory-opacity', `${reveal}`);
    finaleWorld.style.setProperty('--memory-scale', `${scale}`);
    finaleWorld.style.setProperty('--copy-reveal', `${copyReveal}`);
    finaleWorld.style.setProperty('--button-reveal', `${buttonReveal}`);
    memoryGrid.style.translate = `${Math.sin(progress * Math.PI) * -1.2}% ${Math.sin(progress * Math.PI * 0.7) * 1.1}%`;
    sendLight.classList.toggle('is-ready', buttonReveal > 0.96 && !sendLight.disabled);
    whalePlayer.setPose({ opacity: 0 });
    ambient.setMood('finale', 0.58 + progress * 0.38);
  },
});

function sendLightToWhale(event) {
  if (sendLight.disabled) return;
  sendLight.disabled = true;
  sendLight.classList.remove('is-ready');
  const buttonRect = sendLight.getBoundingClientRect();
  const whaleRect = memoryWhale.getBoundingClientRect();
  const startX = Number.isFinite(event.clientX) && event.clientX > 0
    ? event.clientX
    : buttonRect.left + buttonRect.width / 2;
  const startY = Number.isFinite(event.clientY) && event.clientY > 0
    ? event.clientY
    : buttonRect.top + buttonRect.height / 2;
  const targetX = whaleRect.left + whaleRect.width * 0.67;
  const targetY = whaleRect.top + whaleRect.height * 0.53;
  const light = document.createElement('span');
  light.className = 'traveling-light';
  light.style.left = `${startX}px`;
  light.style.top = `${startY}px`;
  lightLayer.append(light);

  if (reducedMotion) {
    light.style.left = `${targetX}px`;
    light.style.top = `${targetY}px`;
    light.remove();
    memoryWhale.classList.add('is-lit');
    return;
  }

  const bendX = (targetX - startX) * 0.46 - 70;
  const bendY = (targetY - startY) * 0.43 - 95;
  gsap.timeline({
    onComplete: () => {
      light.remove();
      memoryWhale.classList.add('is-lit');
      gsap.fromTo('.finale-copy', { filter: 'brightness(1.7)' }, { filter: 'brightness(1)', duration: 1.4 });
    },
  })
    .to(light, { x: bendX, y: bendY, scale: 1.45, duration: 0.56, ease: 'power2.out' })
    .to(light, {
      x: targetX - startX,
      y: targetY - startY,
      scale: 0.35,
      duration: 0.76,
      ease: 'power3.in',
    });
}

sendLight.addEventListener('click', sendLightToWhale);

window.addEventListener('load', () => {
  updateDocumentProgress();
  ScrollTrigger.refresh();
});
