// Three gates share one continuous camera track. The near lip is composited
// above the swimming mesh; memories and the far lip remain behind it.
import { journeyMotion } from './journey-motion.js';
export { JOURNEY_DURATION } from './journey-motion.js';
const clamp = (v) => Math.max(0, Math.min(1, v));

export function createWaterJourney({ world, back, front, groups, imageById, makeImage, assetUrl, swimmer, mesh }) {
  const filters = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  filters.setAttribute('width', '0');
  filters.setAttribute('height', '0');
  filters.setAttribute('aria-hidden', 'true');
  filters.innerHTML = '<defs><filter id="water-refraction" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".025 .06" numOctaves="2" seed="7" result="water"/><feDisplacementMap in="SourceGraphic" in2="water" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
  world.append(filters);
  const backdrop = document.createElement('img');
  backdrop.className = 'journey-backdrop';
  backdrop.src = assetUrl('assets/scene/journey-background.webp');
  backdrop.alt = '';
  backdrop.decoding = 'async';
  world.prepend(backdrop);
  const transition = backdrop.cloneNode();
  transition.className = 'journey-transition-backdrop';
  const gates = groups.map((ids, index) => {
    const gate = document.createElement('div');
    gate.className = 'portal water-gate';
    gate.dataset.gate = index + 1;
    gate.style.setProperty('--memory-rim', `url("${assetUrl('assets/scene/memory-water-rim.webp')}")`);
    const ring = document.createElement('div');
    ring.className = 'water-gate__ring';
    const texture = document.createElement('img');
    texture.className = 'water-vortex-texture';
    texture.src = assetUrl('assets/scene/xrw-vortex.webp');
    texture.alt = '';
    texture.decoding = 'async';
    ring.append(texture);
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
    const streams = document.createElementNS(current.namespaceURI, 'svg');
    streams.setAttribute('viewBox', '0 0 400 400');
    streams.classList.add('memory-streams');
    const routes = [
      'M72 72 C20 168 168 120 200 200',
      'M328 72 C232 20 280 168 200 200',
      'M328 328 C380 232 232 280 200 200',
      'M72 328 C168 380 120 232 200 200',
    ];
    routes.forEach((route) => {
      for (const kind of ['body', 'foam', 'glint']) {
        const path = document.createElementNS(current.namespaceURI, 'path');
        path.setAttribute('d', route);
        path.setAttribute('pathLength', '100');
        path.setAttribute('class', `memory-stream memory-stream--${kind}`);
        streams.append(path);
      }
    });
    gate.append(streams);
    ids.forEach((id, n) => {
      const memory = document.createElement('figure');
      memory.className = 'gate-memory';
      memory.dataset.image = id;
      const [x, y] = [[18, 18], [82, 18], [82, 82], [18, 82]][n];
      memory.style.left = `${x}%`;
      memory.style.top = `${y}%`;
      memory.style.setProperty('--tilt', `${[-5, 5, -5, 5][n]}deg`);
      memory.style.setProperty('--memory-delay', `${n * -1.7}s`);
      const photo = makeImage(imageById.get(id));
      photo.loading = 'eager';
      memory.append(photo);
      const shimmer = document.createElement('span');
      shimmer.className = 'memory-shimmer';
      shimmer.setAttribute('aria-hidden', 'true');
      for (let spark = 0; spark < 5; spark += 1) {
        const mote = document.createElement('i');
        mote.style.setProperty('--mote', spark);
        shimmer.append(mote);
      }
      memory.append(shimmer);
      gate.append(memory);
    });
    const lip = document.createElement('div');
    lip.className = 'water-gate water-gate--near';
    lip.append(ring.cloneNode(true));
    back.append(gate);
    front.append(lip);
    return { gate, lip };
  });

  function pose(x, y, scale, rotation, bend = 0, effort = 0) {
    swimmer.style.setProperty('--whale-x', `${x * 100}%`);
    swimmer.style.setProperty('--whale-y', `${y * 100}%`);
    swimmer.style.setProperty('--whale-scale', scale.toFixed(4));
    swimmer.style.setProperty('--whale-rotation', `${rotation}deg`);
    swimmer.style.setProperty('--whale-opacity', '.98');
    swimmer.style.setProperty('--whale-depth', '1');
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
    world.dataset.passed = String(state.passed);
    world.dataset.swimPhase = state.returning > 0 ? 'return' : state.lift > .85 ? 'crossing' : state.lift > .05 ? 'bending' : 'cruise';
    backdrop.style.transform = `scale(${1.04 + p * .08}) translateX(${-p * 2}%)`;
    gates.forEach(({ gate, lip }, index) => {
      const frame = state.gates[index];
      streamsFor(gate, p);
      for (const layer of [gate, lip]) {
        layer.style.left = `${frame.x * 100}%`;
        layer.style.top = `${frame.y * 100}%`;
        layer.style.transform = `translate(-50%, -50%) scale(${frame.scale})`;
        layer.style.opacity = frame.opacity.toFixed(4);
        layer.style.setProperty('--memory-visibility', frame.memories.toFixed(4));
        layer.style.setProperty('--current-angle', `${p * 630 + index * 57}deg`);
      }
      gate.dataset.active = frame.memories > .1 ? 'true' : 'false';
      gate.dataset.cleared = String(frame.cleared);
    });
    pose(state.x, state.y, state.scale, state.rotation, state.bend, state.effort);
  }

  return { render, pose, transition };
}

function streamsFor(gate, progress) {
  // Progress drives both halves and connector foam; no independent animations
  // can drift out of sync after replay, pausing or reduced-motion navigation.
  gate.style.setProperty('--stream-offset', `${-progress * 700}`);
}
