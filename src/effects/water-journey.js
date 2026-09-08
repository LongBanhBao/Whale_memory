// Three gates share one continuous camera track. Memories are split across the
// far and near halves of each rim so their depth agrees with the swimming mesh.
import { journeyMotion } from './journey-motion.js';
export { JOURNEY_DURATION } from './journey-motion.js';
const clamp = (v) => Math.max(0, Math.min(1, v));

// Four overlapping current segments bind the portraits into one continuous
// chapter ring. Their short arcs echo the bitmap vortex without forming the
// detached petal shapes of the previous composition.
function createMemoryCurrent(slot) {
  const ns = 'http://www.w3.org/2000/svg';
  const flow = document.createElementNS(ns, 'svg');
  flow.setAttribute('viewBox', '0 0 400 400');
  flow.classList.add('memory-current');
  const centerAngle = [-135, -45, 45, 135][slot] * Math.PI / 180;
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
      const angle = [-145, -35, 35, 145][n] * Math.PI / 180;
      // Keep the centre of every silhouette on the same radius as the drawn
      // current. The portrait can then dissolve both inward and outward from
      // the water body instead of floating beyond its outer edge.
      memory.style.left = `${50 + Math.cos(angle) * 32}%`;
      memory.style.top = `${50 + Math.sin(angle) * 32}%`;
      const image = imageById.get(id);
      const photo = makeImage(image);
      photo.loading = 'eager';
      const imageRatio = image.width / image.height;
      memory.style.setProperty('--memory-image', `url("${assetUrl(image.src)}")`);
      memory.style.setProperty('--memory-focus', '32%');
      memory.style.setProperty('--memory-fit', 'contain');
      memory.style.setProperty('--memory-box-width', `${Math.min(100, imageRatio * 100).toFixed(2)}%`);
      memory.style.setProperty('--memory-box-height', `${Math.min(100, 100 / imageRatio).toFixed(2)}%`);
      memory.style.setProperty('--memory-lean', `${[-3.5, 2.5, -2, 3][n]}deg`);
      memory.style.setProperty('--memory-flow-origin', ['122% 122%', '-22% 122%', '-22% -22%', '122% -22%'][n]);
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
