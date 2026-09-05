// Three gates share one continuous camera track. The near lip is composited
// above the swimming mesh; memories and the far lip remain behind it.
export const JOURNEY_DURATION = 24;
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

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
    const ring = document.createElement('div');
    ring.className = 'water-gate__ring';
    // Irregular flowing filaments, not a flat photograph of a splash.
    for (let n = 0; n < 9; n += 1) {
      const filament = document.createElement('i');
      filament.style.setProperty('--strand', n);
      ring.append(filament);
    }
    gate.append(ring);
    ids.forEach((id, n) => {
      const memory = document.createElement('figure');
      memory.className = 'gate-memory';
      memory.dataset.image = id;
      memory.style.setProperty('--slot', n);
      const photo = makeImage(imageById.get(id));
      photo.loading = 'eager';
      memory.append(photo);
      gate.append(memory);
    });
    const lip = document.createElement('div');
    lip.className = 'water-gate water-gate--near';
    lip.append(ring.cloneNode(true));
    back.append(gate);
    front.append(lip);
    return { gate, lip };
  });

  function pose(x, y, scale, rotation, bend = 0) {
    swimmer.style.setProperty('--whale-x', `${x * 100}%`);
    swimmer.style.setProperty('--whale-y', `${y * 100}%`);
    swimmer.style.setProperty('--whale-scale', scale.toFixed(4));
    swimmer.style.setProperty('--whale-rotation', `${rotation}deg`);
    swimmer.style.setProperty('--whale-opacity', '.98');
    swimmer.style.setProperty('--whale-depth', '1');
    mesh.setDepth(1);
    mesh.setBend?.(bend);
    mesh.setActive(true);
  }

  function render({ progress }) {
    const p = clamp(progress);
    const travel = clamp(p / 0.82) * 3;
    const returning = ease((p - 0.82) / 0.18);
    const local = travel % 1;
    world.style.setProperty('--journey-progress', p.toFixed(4));
    world.style.setProperty('--journey-light', '.8');
    world.dataset.passed = Math.min(3, Math.floor(travel)).toString();
    backdrop.style.transform = `scale(${1.04 + p * .08}) translateX(${-p * 2}%)`;

    gates.forEach(({ gate, lip }, index) => {
      const distance = index + 0.62 - travel;
      // A perspective tunnel on the right. A passed ring expands past the
      // viewer while the next ring approaches the same crossing plane.
      const scale = distance >= 0 ? 1 / (1 + distance * .88) : 1 - distance * 1.4;
      const x = .55 + (distance > 0 ? .32 * (1 - Math.exp(-distance)) : distance * .27);
      const y = .50 - Math.max(0, distance) * .075;
      const alpha = (1 - ease((-distance - .36) / .5)) * (1 - returning);
      const memories = ease((1.05 - distance) / .55) * (1 - ease((-distance - .12) / .55));
      for (const layer of [gate, lip]) {
        layer.style.left = `${x * 100}%`;
        layer.style.top = `${y * 100}%`;
        layer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        layer.style.opacity = alpha.toFixed(4);
        layer.style.setProperty('--memory-visibility', memories.toFixed(4));
      }
      gate.dataset.active = distance < 1 && distance > -.6 ? 'true' : 'false';
      // The right-hand rim remains in front until the tail clears the plane.
      lip.style.opacity = (alpha * (1 - ease((-distance - .12) / .24))).toFixed(4);
    });

    const approach = ease(travel / .5);
    const bank = Math.sin(local * Math.PI * 2) * ease(travel / .2) * (1 - returning);
    const x = mix(mix(.18, .50, approach), .55, returning);
    const y = mix(.57 - approach * .07 + Math.sin(travel * Math.PI * 2) * .025 * (1 - returning), .49, returning);
    pose(x, y, mix(.48 + Math.sin(local * Math.PI) * .04 * (1 - returning), 1, returning),
      mix(-4 - Math.sin(travel * Math.PI * 2) * 7 * (1 - returning), -9, returning), bank);
  }

  return { render, pose, transition };
}
