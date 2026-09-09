// Three gates share one continuous camera track. Memories are split across the
// far and near halves of each rim so their depth agrees with the swimming mesh.
import { journeyMotion } from './journey-motion.js';
export { JOURNEY_DURATION } from './journey-motion.js';
const clamp = (v) => Math.max(0, Math.min(1, v));
const memorySlots = [
  { angle: -116, radius: 30.5, lean: -3, flowOrigin: '122% 122%' },
  { angle: -28, radius: 30, lean: 2, flowOrigin: '-22% 122%' },
  { angle: 64, radius: 29, lean: -2, flowOrigin: '-22% -22%' },
  { angle: 152, radius: 29.5, lean: 3, flowOrigin: '122% -22%' },
];
const portraitTuning = {
  p01: { x: 0, y: -6, scale: .98 },
  p03: { x: 0, y: -8, scale: .96 },
  p07: { x: 0, y: -2, scale: .9 },
  p08: { x: 2, y: -2, scale: .86 },
  p11: { x: 0, y: 5, scale: .78 },
  p12: { x: 2, y: 4, scale: .8 },
  p13: { x: 0, y: 4, scale: .78 },
  p14: { x: 0, y: 4, scale: .76 },
  p15: { x: 0, y: 5, scale: .78 },
  p16: { x: 0, y: 5, scale: .8 },
  p17: { x: 0, y: 4, scale: .79 },
  p19: { x: 0, y: 5, scale: .78 },
};

const ambientCurrentPaths = [
  'M -120 220 C 220 356 390 158 700 282 S 1180 430 1560 228',
  'M -130 704 C 250 500 430 790 790 618 S 1210 428 1580 620',
  'M -100 474 C 282 574 528 400 840 506 S 1268 674 1568 470',
];

const ambientMotifs = [
  { kind: 'jelly', x: 8, y: 58, size: 78, duration: 21, delay: -8, drift: 18 },
  { kind: 'frond', x: 16, y: 82, size: 94, duration: 24, delay: -15, drift: -13 },
  { kind: 'shell', x: 27, y: 18, size: 48, duration: 19, delay: -4, drift: 11 },
  { kind: 'jelly', x: 88, y: 22, size: 62, duration: 25, delay: -18, drift: -16 },
  { kind: 'frond', x: 91, y: 66, size: 86, duration: 22, delay: -11, drift: 12 },
  { kind: 'shell', x: 76, y: 84, size: 42, duration: 20, delay: -6, drift: -9 },
];

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function createAmbientMotif(spec, index) {
  const motif = createSvgElement('svg', {
    class: `journey-motif journey-motif--${spec.kind}`,
    viewBox: '0 0 100 100',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  motif.dataset.kind = spec.kind;
  motif.style.setProperty('--motif-x', `${spec.x}%`);
  motif.style.setProperty('--motif-y', `${spec.y}%`);
  motif.style.setProperty('--motif-size', `${spec.size}px`);
  motif.style.setProperty('--motif-duration', `${spec.duration}s`);
  motif.style.setProperty('--motif-delay', `${spec.delay}s`);
  motif.style.setProperty('--motif-drift', `${spec.drift}px`);
  motif.style.setProperty('--motif-drift-back', `${spec.drift * -.35}px`);
  motif.style.setProperty('--motif-turn', `${index % 2 ? -4 : 4}deg`);
  motif.style.setProperty('--motif-turn-back', `${index % 2 ? 2.8 : -2.8}deg`);

  if (spec.kind === 'jelly') {
    motif.append(
      createSvgElement('path', { class: 'journey-motif__wash', d: 'M16 47 C18 16 82 16 84 47 C69 39 60 50 50 42 C39 50 30 39 16 47 Z' }),
      createSvgElement('path', { d: 'M16 47 C18 16 82 16 84 47 C69 39 60 50 50 42 C39 50 30 39 16 47 Z' }),
      createSvgElement('path', { d: 'M31 47 C25 61 39 69 30 88 M48 45 C42 60 57 72 48 94 M66 47 C58 62 75 69 66 87' }),
    );
  } else if (spec.kind === 'frond') {
    motif.append(
      createSvgElement('path', { d: 'M48 94 C46 73 50 46 62 9' }),
      createSvgElement('path', { d: 'M50 73 C34 70 24 61 20 49 M53 60 C69 56 78 47 83 34 M56 45 C43 40 36 31 34 20 M60 28 C70 25 78 18 82 10' }),
      createSvgElement('path', { class: 'journey-motif__wash', d: 'M20 49 C35 51 45 60 50 73 C34 70 24 61 20 49 Z M83 34 C68 37 58 46 53 60 C69 56 78 47 83 34 Z' }),
    );
  } else {
    motif.append(
      createSvgElement('path', { class: 'journey-motif__wash', d: 'M50 18 C78 18 88 45 77 66 C65 89 27 85 18 59 C8 31 31 14 56 20 C75 24 79 47 66 60 C53 73 32 64 33 48 C34 35 50 30 59 38 C66 44 62 54 55 56 C48 58 43 52 45 47' }),
      createSvgElement('path', { d: 'M50 18 C78 18 88 45 77 66 C65 89 27 85 18 59 C8 31 31 14 56 20 C75 24 79 47 66 60 C53 73 32 64 33 48 C34 35 50 30 59 38 C66 44 62 54 55 56 C48 58 43 52 45 47' }),
    );
  }
  return motif;
}

function createJourneyAmbience(world) {
  const far = document.createElement('div');
  far.className = 'journey-ambience journey-ambience--far';
  far.setAttribute('aria-hidden', 'true');
  const currents = createSvgElement('svg', {
    class: 'journey-currents',
    viewBox: '0 0 1440 900',
    preserveAspectRatio: 'none',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  const defs = createSvgElement('defs');
  const gradient = createSvgElement('linearGradient', {
    id: 'journey-current-gradient', x1: '0%', y1: '0%', x2: '100%', y2: '0%',
  });
  [
    ['0%', '#69b8d2', '0'],
    ['22%', '#b9f7f3', '.7'],
    ['52%', '#75cfe3', '.32'],
    ['78%', '#d7f8ef', '.66'],
    ['100%', '#779bd2', '0'],
  ].forEach(([offset, color, opacity]) => gradient.append(createSvgElement('stop', {
    offset, 'stop-color': color, 'stop-opacity': opacity,
  })));
  defs.append(gradient);
  currents.append(defs);
  ambientCurrentPaths.forEach((d, index) => {
    const group = createSvgElement('g', { class: `journey-current journey-current--${index + 1}` });
    group.style.setProperty('--current-delay', `${index * -2.8}s`);
    const body = createSvgElement('path', { class: 'journey-current__body', d });
    const glint = createSvgElement('path', { class: 'journey-current__glint', d, pathLength: '100' });
    const echo = createSvgElement('path', { class: 'journey-current__echo', d, pathLength: '100' });
    group.append(body, glint, echo);
    currents.append(group);
  });

  const farBubbles = document.createElement('div');
  farBubbles.className = 'journey-bubbles journey-bubbles--far';
  const near = document.createElement('div');
  near.className = 'journey-ambience journey-ambience--near';
  near.setAttribute('aria-hidden', 'true');
  const nearBubbles = document.createElement('div');
  nearBubbles.className = 'journey-bubbles journey-bubbles--near';
  for (let index = 0; index < 18; index += 1) {
    const nearLayer = index >= 14;
    const localIndex = nearLayer ? index - 14 : index;
    const bubble = document.createElement('i');
    bubble.className = 'journey-bubble';
    const edgeBand = 4 + ((index * 17) % 25);
    const x = index % 2 ? 100 - edgeBand : edgeBand;
    bubble.style.setProperty('--bubble-x', `${x}%`);
    bubble.style.setProperty('--bubble-y', `${4 + ((index * 29) % 91)}%`);
    bubble.style.setProperty('--bubble-size', `${(nearLayer ? 5 : 2) + (index % 6) * (nearLayer ? 1.7 : 1.05)}px`);
    bubble.style.setProperty('--bubble-duration', `${10 + (index % 7) * 1.75}s`);
    bubble.style.setProperty('--bubble-delay', `${-((index * 13) % 19)}s`);
    bubble.style.setProperty('--bubble-drift', `${(index % 2 ? -1 : 1) * (8 + (index % 5) * 5)}px`);
    bubble.style.setProperty('--bubble-alpha', `${(nearLayer ? .2 : .13) + (index % 4) * .045}`);
    bubble.dataset.layer = nearLayer ? 'near' : 'far';
    (nearLayer ? nearBubbles : farBubbles).append(bubble);
    if (nearLayer && localIndex >= 3) bubble.classList.add('journey-bubble--soft');
  }

  const motifs = document.createElement('div');
  motifs.className = 'journey-motifs';
  ambientMotifs.forEach((spec, index) => motifs.append(createAmbientMotif(spec, index)));
  far.append(currents, farBubbles, motifs);
  near.append(nearBubbles);
  world.append(far, near);
}

// Four overlapping current segments bind the portraits into one continuous
// chapter ring. Their short arcs echo the bitmap vortex without forming the
// detached petal shapes of the previous composition.
function createMemoryCurrent(slot) {
  const ns = 'http://www.w3.org/2000/svg';
  const flow = document.createElementNS(ns, 'svg');
  flow.setAttribute('viewBox', '0 0 400 400');
  flow.classList.add('memory-current');
  const centerAngle = memorySlots[slot].angle * Math.PI / 180;
  const arcPoint = (radius, angle) => [
    200 + Math.cos(angle) * radius,
    200 + Math.sin(angle) * radius,
  ];
  for (let strand = 0; strand < 19; strand += 1) {
    const spread = strand - 9;
    const radius = 119 + spread * 1.65;
    const start = arcPoint(radius, centerAngle - .68);
    const end = arcPoint(radius, centerAngle + .82);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', `M ${start[0].toFixed(2)} ${start[1].toFixed(2)} A ${radius} ${radius} 0 0 1 ${end[0].toFixed(2)} ${end[1].toFixed(2)}`);
    path.setAttribute('class', strand === 9 ? 'memory-current__body' : 'memory-current__foam');
    path.style.setProperty('--strand', strand);
    if (strand !== 9) {
      path.setAttribute('stroke-width', strand % 4 === 0 ? '1.65' : '.75');
      path.setAttribute('opacity', `${.3 + (strand % 4) * .16}`);
      path.setAttribute('stroke-dasharray', `${9 + strand * 2} ${3 + strand % 5} ${2 + strand % 3} ${6 + strand % 7}`);
    }
    flow.append(path);
    if (strand === 9) {
      const glow = path.cloneNode();
      glow.setAttribute('class', 'memory-current__glow');
      flow.append(glow);
      const highlights = path.cloneNode();
      highlights.setAttribute('class', 'memory-current__highlights');
      flow.append(highlights);
    }
  }
  for (let n = 0; n < 7; n += 1) {
    const angle = centerAngle - .55 + n / 6 * 1.18;
    const radius = 124 + Math.sin(n * 2.4) * 5;
    const sparkle = document.createElementNS(ns, 'path');
    const [x, y] = arcPoint(radius, angle);
    const size = n % 3 === 0 ? 2.5 : 1.25;
    sparkle.setAttribute('d', `M ${x - size} ${y} h ${size * 2} M ${x} ${y - size} v ${size * 2}`);
    sparkle.setAttribute('class', `memory-current__sparkle${n % 2 ? ' memory-current__sparkle--alternate' : ''}`);
    flow.append(sparkle);
  }
  return flow;
}

export function createWaterJourney({ world, back, front, groups, imageById, makeImage, assetUrl, swimmer, mesh }) {
  const backdrop = document.createElement('img');
  backdrop.className = 'journey-backdrop';
  backdrop.src = assetUrl('assets/scene/journey-background.webp');
  backdrop.alt = '';
  backdrop.decoding = 'async';
  world.prepend(backdrop);
  createJourneyAmbience(world);
  const transition = backdrop.cloneNode();
  transition.className = 'journey-transition-backdrop';
  const vortexUrl = assetUrl('assets/scene/memory-vortex-v2.webp');
  const gates = groups.map((ids, index) => {
    const gate = document.createElement('div');
    gate.className = 'portal water-gate';
    gate.dataset.gate = index + 1;
    const ring = document.createElement('div');
    ring.className = 'water-gate__ring';
    const depth = document.createElement('span');
    depth.className = 'water-gate__depth';
    const texture = document.createElement('img');
    texture.className = 'water-vortex-texture';
    texture.src = vortexUrl;
    texture.alt = '';
    texture.decoding = 'async';
    ring.append(depth, texture);
    // A fixed perspective plane contains the rotating current. Rotating the
    // plane itself would reverse the perceived entrance halfway through.
    const current = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    current.setAttribute('viewBox', '0 0 400 400');
    current.classList.add('water-current');
    for (let n = 0; n < 28; n += 1) {
      const path = document.createElementNS(current.namespaceURI, 'path');
      const points = [];
      const start = n * 2.39996;
      const length = 1.2 + (n % 5) * .34;
      for (let step = 0; step <= 48; step += 1) {
        const t = step / 48;
        const angle = start + t * length;
        const radius = 153 + (n % 7) * 3.2 - t * 12 + Math.sin(angle * 5 + n) * 1.8;
        points.push(`${step ? 'L' : 'M'}${(200 + Math.cos(angle) * radius).toFixed(2)},${(200 + Math.sin(angle) * radius).toFixed(2)}`);
      }
      path.setAttribute('d', points.join(' '));
      path.setAttribute('stroke-width', n % 4 === 0 ? '2.4' : '.8');
      path.setAttribute('opacity', `${.2 + (n % 4) * .13}`);
      current.append(path);
    }
    for (let n = 0; n < 40; n += 1) {
      const bubble = document.createElementNS(current.namespaceURI, 'circle');
      const angle = n * 2.39996;
      const radius = 148 + (n % 9) * 3.6;
      bubble.setAttribute('cx', `${200 + Math.cos(angle) * radius}`);
      bubble.setAttribute('cy', `${200 + Math.sin(angle) * radius}`);
      bubble.setAttribute('r', n % 5 === 0 ? '1.9' : '.7');
      current.append(bubble);
    }
    ring.append(current);
    gate.append(ring);
    const rearOrbit = document.createElement('div');
    rearOrbit.className = 'memory-orbit';
    const nearOrbit = document.createElement('div');
    nearOrbit.className = 'memory-orbit';
    const memoryGate = document.createElement('div');
    memoryGate.className = 'water-gate water-gate--memories water-gate--memories-rear';
    memoryGate.dataset.gate = index + 1;
    const nearMemoryGate = document.createElement('div');
    nearMemoryGate.className = 'water-gate water-gate--memories water-gate--memories-near';
    nearMemoryGate.dataset.gate = index + 1;
    const accent = ['#9be7e5', '#9ad7e8', '#b5c5ed'][index];
    const warmth = ['#ffd9aa', '#f7d3b6', '#e7d4ff'][index];
    for (const layer of [memoryGate, nearMemoryGate]) {
      layer.style.setProperty('--gate-accent', accent);
      layer.style.setProperty('--memory-warm', warmth);
      layer.style.setProperty('--vortex-mask', `url("${vortexUrl}")`);
    }
    const currents = ids.map((_, slot) => createMemoryCurrent(slot));
    // The water strands remain behind the animal; the photographs themselves
    // are divided between the far and near rim so their depth matches the gate.
    const branches = document.createElement('div');
    branches.className = 'water-gate__branches';
    branches.append(...currents);
    gate.append(branches);
    const memories = ids.map((id, n) => {
      const memory = document.createElement('figure');
      memory.className = 'gate-memory';
      memory.dataset.image = id;
      // Place portraits on the same unprojected water plane as the vortex.
      // The shared orbit supplies perspective to both current and photograph.
      const slot = memorySlots[n];
      const angle = slot.angle * Math.PI / 180;
      // Keep the centre of every silhouette on the same radius as the drawn
      // current. The portrait can then dissolve both inward and outward from
      // the water body instead of floating beyond its outer edge.
      memory.style.left = `${50 + Math.cos(angle) * slot.radius}%`;
      memory.style.top = `${50 + Math.sin(angle) * slot.radius}%`;
      const image = imageById.get(id);
      const photo = makeImage(image);
      photo.loading = 'eager';
      const tuning = portraitTuning[id] || { x: 0, y: 0, scale: .82 };
      memory.style.setProperty('--memory-image', `url("${assetUrl(image.src)}")`);
      memory.style.setProperty('--memory-focus', '32%');
      memory.style.setProperty('--memory-fit', 'contain');
      memory.style.setProperty('--memory-subject-x', `${tuning.x}%`);
      memory.style.setProperty('--memory-subject-y', `${tuning.y}%`);
      memory.style.setProperty('--memory-subject-scale', tuning.scale);
      memory.style.setProperty('--memory-lean', `${slot.lean}deg`);
      memory.style.setProperty('--memory-flow-origin', slot.flowOrigin);
      const portrait = document.createElement('span');
      portrait.className = 'memory-portrait';
      portrait.append(photo);
      memory.append(portrait);
      (n === 0 || n === 3 ? nearOrbit : rearOrbit).append(memory);
      return memory;
    });
    memoryGate.append(rearOrbit);
    nearMemoryGate.append(nearOrbit);
    // A restrained foreground copy of the same currents crosses the photos.
    // It is clipped to the real vortex alpha, so the subjects feel submerged
    // in one stream without receiving a separate frame or halo.
    const washSets = [memoryGate, nearMemoryGate].map((layer, layerIndex) => {
      const wash = document.createElement('div');
      wash.className = `water-gate__memory-wash water-gate__memory-wash--${layerIndex ? 'near' : 'rear'}`;
      const flows = currents.map(current => {
        const flow = current.cloneNode(true);
        flow.classList.add('memory-current--wash');
        wash.append(flow);
        return flow;
      });
      layer.append(wash);
      return flows;
    });
    const lip = document.createElement('div');
    lip.className = 'water-gate water-gate--near';
    lip.append(ring.cloneNode(true));
    back.append(gate, memoryGate);
    front.append(lip, nearMemoryGate);
    return { gate, lip, memoryGate, nearMemoryGate, memories, currents, washSets };
  });

  function pose(x, y, scale, rotation, bend = 0, effort = 0, bank = 0, wake = .35) {
    swimmer.style.setProperty('--whale-x', `${x * 100}%`);
    swimmer.style.setProperty('--whale-y', `${y * 100}%`);
    swimmer.style.setProperty('--whale-scale', scale.toFixed(4));
    swimmer.style.setProperty('--whale-rotation', `${rotation}deg`);
    swimmer.style.setProperty('--whale-opacity', '.98');
    swimmer.style.setProperty('--whale-depth', '1');
    swimmer.style.setProperty('--whale-bank', `${bank}deg`);
    swimmer.style.setProperty('--whale-bank-scale', `${1 - Math.abs(bank) / 260}`);
    swimmer.style.setProperty('--wake-strength', wake.toFixed(3));
    mesh.setDepth(1);
    mesh.setBend?.(bend);
    mesh.setEffort?.(effort);
    mesh.setActive(true);
  }

  function render({ progress }) {
    const p = clamp(progress);
    const state = journeyMotion(p);
    world.style.setProperty('--journey-progress', p.toFixed(4));
    world.style.setProperty('--journey-light', '.8');
    world.style.setProperty('--journey-ambient-shift', `${(-p * 2.8).toFixed(3)}vw`);
    world.style.setProperty('--journey-ambient-opacity', `${(.68 + Math.max(...state.gates.map(gate => gate.pulse)) * .08).toFixed(3)}`);
    world.dataset.passed = String(state.passed);
    world.dataset.swimPhase = state.returning > 0 ? 'return' : state.lift > .85 ? 'crossing' : state.lift > .05 ? 'bending' : 'cruise';
    backdrop.style.transform = `scale(${1.04 + p * .08}) translateX(${-p * 2}%)`;
    gates.forEach(({ gate, lip, memoryGate, nearMemoryGate, memories, currents, washSets }, index) => {
      const frame = state.gates[index];
      for (const layer of [gate, lip, memoryGate, nearMemoryGate]) {
        layer.style.left = `${frame.x * 100}%`;
        layer.style.top = `${frame.y * 100}%`;
        layer.style.transform = `translate(-50%, -50%) scale(${frame.scale})`;
        layer.style.opacity = frame.opacity.toFixed(4);
        layer.style.setProperty('--memory-visibility', frame.memories.toFixed(4));
        layer.style.setProperty('--current-angle', `${state.time * 19 + index * 57}deg`);
        layer.style.setProperty('--portrait-current', `${Math.sin(state.time * .72 + index) * 1.35}deg`);
        layer.style.setProperty('--flow-offset', `${-state.time * 15.5}`);
        layer.style.setProperty('--gate-pulse', frame.pulse.toFixed(4));
      }
      memories.forEach((memory, slot) => {
        memory.style.setProperty('--recall', frame.recall[slot].toFixed(4));
        memory.style.setProperty('--memory-glint', `${50 + Math.sin(state.time * 1.9 + slot * 1.45 + index) * 42}%`);
        memory.style.setProperty('--memory-float', `${(Math.sin(state.time * .9 + slot * 1.7 + index) * 2.2).toFixed(2)}px`);
        memory.style.setProperty('--memory-breathe', `${(1 + Math.sin(state.time * .72 + slot * 1.3) * .018).toFixed(4)}`);
      });
      currents.forEach((current, slot) => {
        current.style.setProperty('--recall', frame.recall[slot].toFixed(4));
        current.style.setProperty('--glint-light', `${.55 + Math.sin(state.time * 2.6 + slot * 1.7 + index) * .35}`);
        washSets.forEach(set => {
          set[slot].style.setProperty('--recall', frame.recall[slot].toFixed(4));
          set[slot].style.setProperty('--glint-light', `${.55 + Math.sin(state.time * 2.6 + slot * 1.7 + index) * .35}`);
        });
      });
      gate.dataset.active = frame.memories > .1 ? 'true' : 'false';
      gate.dataset.cleared = String(frame.cleared);
    });
    pose(state.x, state.y, state.scale, state.rotation, state.bend, state.effort, state.bank, state.wake);
  }

  return { render, pose, transition };
}
