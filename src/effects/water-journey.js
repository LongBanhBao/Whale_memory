// Three gates share one continuous camera track. The near lip is composited
// above the swimming mesh. Portraits have their own synchronized foreground
// plane so neither a gate's near rim nor a distant gate can cover their faces.
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
  const memoryArtwork = new Image();
  memoryArtwork.src = assetUrl('assets/scene/prw-memory-window.webp');
  const memoryLayer = document.createElement('div');
  memoryLayer.className = 'memory-layer';
  memoryLayer.setAttribute('aria-hidden', 'true');
  world.append(memoryLayer);
  const gates = groups.map((ids, index) => {
    const gate = document.createElement('div');
    gate.className = 'portal water-gate';
    gate.dataset.gate = index + 1;
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
    const orbit = document.createElement('div');
    orbit.className = 'memory-orbit';
    const memoryGate = document.createElement('div');
    memoryGate.className = 'water-gate water-gate--memories';
    memoryGate.dataset.gate = index + 1;
    memoryGate.style.setProperty('--memory-water', `url("${memoryArtwork.src}")`);
    const memories = ids.map((id, n) => {
      const memory = document.createElement('figure');
      memory.className = 'gate-memory';
      memory.dataset.image = id;
      // Place portraits on the same unprojected water plane as the vortex.
      // The shared orbit supplies perspective to both frame and photograph.
      const angle = [-135, -45, 45, 135][n] * Math.PI / 180;
      memory.style.left = `${50 + Math.cos(angle) * 56}%`;
      memory.style.top = `${50 + Math.sin(angle) * 56}%`;
      const photo = makeImage(imageById.get(id));
      photo.loading = 'eager';
      const portrait = document.createElement('span');
      portrait.className = 'memory-portrait';
      portrait.append(photo);
      memory.append(portrait);
      orbit.append(memory);
      return memory;
    });
    memoryGate.append(orbit);
    memoryLayer.append(memoryGate);
    const lip = document.createElement('div');
    lip.className = 'water-gate water-gate--near';
    lip.append(ring.cloneNode(true));
    back.append(gate);
    front.append(lip);
    return { gate, lip, memoryGate, memories };
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
    gates.forEach(({ gate, lip, memoryGate, memories }, index) => {
      const frame = state.gates[index];
      for (const layer of [gate, lip, memoryGate]) {
        layer.style.left = `${frame.x * 100}%`;
        layer.style.top = `${frame.y * 100}%`;
        layer.style.transform = `translate(-50%, -50%) scale(${frame.scale})`;
        layer.style.opacity = frame.opacity.toFixed(4);
        layer.style.setProperty('--memory-visibility', frame.memories.toFixed(4));
        layer.style.setProperty('--current-angle', `${state.time * 17.5 + index * 57}deg`);
        layer.style.setProperty('--portrait-current', `${Math.sin(state.time / 36 * Math.PI * 8 + index) * 2}deg`);
      }
      memories.forEach((memory, slot) => memory.style.setProperty('--recall', frame.recall[slot].toFixed(4)));
      gate.dataset.active = frame.memories > .1 ? 'true' : 'false';
      gate.dataset.cleared = String(frame.cleared);
    });
    pose(state.x, state.y, state.scale, state.rotation, state.bend, state.effort);
  }

  return { render, pose, transition };
}
