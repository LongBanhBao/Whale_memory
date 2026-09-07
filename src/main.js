import { gsap } from 'gsap';
import './styles/main.css';
import { images, whale } from './data/assets.generated.js';
import { dropIds, portalGroups } from './data/journey.js';
import { createWhalePlayer } from './effects/whale-player.js';
import { createWaterJourney, JOURNEY_DURATION } from './effects/water-journey.js';
import { createIntroWhale } from './effects/intro-whale.js';
import { createAmbientCanvas } from './effects/ambient-canvas.js';


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
const introMemoryLight = document.querySelector('#intro-memory-light');
const introWhaleSwimmer = document.querySelector('#intro-whale-swimmer');
const introWhaleStill = document.querySelector('#intro-whale-still');
const introWhale = createIntroWhale(document.querySelector('#intro-whale-mesh'), introWhaleStill, reducedMotion);
const dropLayer = document.querySelector('#drop-layer');
const holdControl = document.querySelector('#hold-control');
const holdProgressRing = document.querySelector('#hold-progress');
const holdLabel = document.querySelector('#hold-label');
const holdStatus = document.querySelector('#hold-status');
const holdWaterDrop = document.querySelector('#hold-water-drop');
const portalLayer = document.querySelector('#portal-layer');
const foregroundLayer = document.querySelector('#foreground-layer');
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
const reducedNext = document.querySelector('#scene-next');
const sections = [...document.querySelectorAll('.scene')];
let sceneTimeline = null;
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
introWhaleStill.src = assetUrl(whale.still);
holdWaterDrop.src = assetUrl('assets/scene/water-drop.webp');
for (const artwork of [introBackdrop, introHalo, introWhaleStill, holdWaterDrop]) {
  artwork.loading = 'eager';
  artwork.fetchPriority = 'high';
  artwork.decoding = 'async';
}
const waterJourney = createWaterJourney({
  world: journeyWorld, back: portalLayer, front: foregroundLayer,
  groups: portalGroups, imageById, makeImage, assetUrl,
  swimmer: introWhaleSwimmer, mesh: introWhale,
});
introWorld.append(waterJourney.transition);
let sceneTransition = null;
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

function triggerMemoryBloom(level) {
  introWorld.style.setProperty('--memory-glow', level.toFixed(3));
  introMemoryLight.classList.remove('is-pulsing');
  void introMemoryLight.offsetWidth;
  introMemoryLight.classList.add('is-pulsing');
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
  const retreat = smoothstep((eased - 0.12) / 0.84);
  // A single flowing turn with zero velocity at arrival. Perspective, rather
  // than linear zoom, makes the approach read as travel through the water.
  const t = eased;
  const inverse = 1 - t;
  const x = inverse ** 3 * 0.5 + 3 * inverse ** 2 * t * 0.40 + 3 * inverse * t ** 2 * 0.46 + t ** 3 * 0.55;
  const y = inverse ** 3 * 0.48 + 3 * inverse ** 2 * t * 0.61 + 3 * inverse * t ** 2 * 0.54 + t ** 3 * 0.49;
  const scale = 0.16 / (1 - 0.84 * t);

  introWorld.style.setProperty('--whale-emerge', eased.toFixed(4));
  introWorld.style.setProperty('--portal-retreat', retreat.toFixed(4));
  introWhaleSwimmer.style.setProperty('--whale-x', `${x * 100}%`);
  introWhaleSwimmer.style.setProperty('--whale-y', `${y * 100}%`);
  introWhaleSwimmer.style.setProperty('--whale-scale', scale.toFixed(4));
  introWhaleSwimmer.style.setProperty('--whale-rotation', `${lerp(12, -9, t) + Math.sin(t * Math.PI) * 6}deg`);
  introWhaleSwimmer.style.setProperty('--whale-opacity', `${smoothstep(eased / 0.055) * 0.98}`);
  introWhaleSwimmer.style.setProperty('--whale-depth', eased.toFixed(4));
  introWhale.setDepth(eased);
  introWhale.setActive(activeScene === 0 && progress > 0);
}

function unlockIntro() {
  introComplete = true;
  introSection.classList.add('is-complete');
  document.body.classList.remove('is-intro-locked');
  holdControl.disabled = true;
  holdControl.setAttribute('inert', '');
  holdStatus.textContent = 'Cá voi đã xuất hiện. Nhấn tiếp để sang cảnh tiếp theo.';
  updateReducedNext();
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
  whalePlayer.setPose({ opacity: 0 });

  if (reducedMotion) {
    introWorld.style.setProperty('--halo-growth', '1');
    introWorld.style.setProperty('--memory-glow', '1');
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
  const firstReturnAt = 0.68;
  const returnSpacing = 0.46;
  const returnDuration = 0.34;

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
        const growth = (index + 1) / introDrops.length;
        introWorld.style.setProperty('--halo-growth', `${growth}`);
        introWorld.dataset.arrivals = `${index + 1}`;
        triggerMemoryBloom(growth);
      }, null, start + 0.05 + returnDuration * 0.86)
      .to(wrapper, {
        opacity: 0,
        scale: 0.1,
        duration: 0.1,
        ease: 'power2.in',
      }, start + 0.05 + returnDuration);
  });

  const whaleStart = firstReturnAt + (introDrops.length - 1) * returnSpacing + returnDuration + 0.38;
  postTimeline
    .to(introWorld, { '--title-reveal': 0, duration: 0.45 }, whaleStart - 0.2)
    .call(() => { introWorld.dataset.stage = 'whale'; }, null, whaleStart)
    .to(whaleState, {
      progress: 1,
      duration: 4.8,
      ease: 'none',
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
  reducedNext.hidden = activeScene >= sections.length - 1;
}

function setActiveScene(index) {
  sceneTimeline?.kill();
  activeScene = index;
  (index === 1 ? journeyWorld : introWorld).append(introWhaleSwimmer);
  introWhale.setActive(index === 1 || (index === 0 && introComplete));
  sections.forEach((section, sectionIndex) => {
    section.hidden = sectionIndex !== index;
    section.inert = sectionIndex !== index;
  });
  progressLine.style.transform = `scaleX(${index / (sections.length - 1)})`;
  whaleCanvas.classList.toggle('is-hidden', index <= 1 || index === 3);
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

function advanceScene() {
  setActiveScene(activeScene + 1);
  const render = [null, renderJourney, renderStorm, renderFinale][activeScene];
  const state = { progress: 0 };
  render({ progress: reducedMotion ? (activeScene === 1 ? 1 : 0.92) : 0 });
  if (!reducedMotion) {
    sceneTimeline = gsap.to(state, {
      progress: 1,
      duration: [0, JOURNEY_DURATION, 14, 12][activeScene],
      ease: 'none',
      onUpdate: () => render(state),
    });
  }
  reducedNext.disabled = false;
  sections[activeScene].focus({ preventScroll: true });
}

reducedNext.addEventListener('click', () => {
  if (activeScene >= 3 || reducedNext.disabled) return;
  endHolding({ type: 'pointercancel' });
  postTimeline?.kill();
  if (activeScene !== 0 || reducedMotion) {
    advanceScene();
    return;
  }
  reducedNext.disabled = true;
  holdControl.disabled = true;
  holdControl.classList.add('is-complete');
  introDrops.forEach(({ wrapper }) => { wrapper.style.opacity = '0'; });
  introWorld.style.setProperty('--intro-light', '1');
  introWorld.style.setProperty('--title-reveal', '0');
  setWhaleEmergence(1);
  const retreat = { progress: 0 };
  sceneTransition = gsap.timeline({ onComplete: advanceScene })
    .to(retreat, {
      progress: 1, duration: 1.65, ease: 'sine.inOut',
      onUpdate: () => waterJourney.pose(
        lerp(.55, .18, retreat.progress), lerp(.49, .64, retreat.progress),
        lerp(1, .48, retreat.progress), lerp(-9, -4, retreat.progress),
      ),
    })
    .to(waterJourney.transition, { opacity: 1, duration: .85, ease: 'sine.inOut' });
});

function renderJourney(state) {
  waterJourney.render(state);
  ambient.setMood('journey', .68);
}

function playBreakthroughFlash() {
  if (reducedMotion) return;
  gsap.killTweensOf(breakthroughFlash);
  gsap.timeline()
    .set(breakthroughFlash, { opacity: 0 })
    .to(breakthroughFlash, { opacity: 1, duration: 0.15, ease: 'power3.in' })
    .to(breakthroughFlash, { opacity: 1, duration: 0.42 })
    .to(breakthroughFlash, { opacity: 0, duration: 0.62, ease: 'power2.out' });
}

function renderStorm({ progress }) {
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
}

function renderFinale({ progress }) {
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
}

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
  sceneTransition?.kill();
  gsap.set(waterJourney.transition, { opacity: 0 });
  reducedNext.disabled = false;
  introWhale.setActive(false);
  introWhale.reset();
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
  introWorld.style.setProperty('--memory-glow', '0');
  introWorld.style.setProperty('--portal-retreat', '0');
  introWorld.style.setProperty('--title-reveal', '0');
  introMemoryLight.classList.remove('is-pulsing');
  holdControl.disabled = false;
  holdControl.removeAttribute('inert');
  holdControl.classList.remove('is-complete', 'is-holding', 'has-started');
  holdLabel.textContent = reducedMotion ? 'CHẠM ĐỂ BẮT ĐẦU' : 'NHẤN VÀ GIỮ';
  holdStatus.textContent = 'Nhấn và giữ để thả những giọt ký ức.';
  document.body.classList.add('is-intro-locked');
  setActiveScene(0);
  whalePlayer.setPose({ opacity: 0 });
  renderHoldProgress(0);
  setWhaleEmergence(0);
}

replayJourney.addEventListener('click', resetJourney);

document.querySelector('.wordmark').addEventListener('click', (event) => {
  event.preventDefault();
  resetJourney();
});
sections.forEach((section) => { section.tabIndex = -1; });
setActiveScene(0);
