// One timeline-driven canvas: no timers or animation loop survive the finale.
export const FIREWORKS_DURATION = 11.8;

export function createUnderwaterFireworks(canvas, compact) {
  const ctx = canvas.getContext('2d');
  const colors = ['#a2eeff', '#ffc5e5', '#d3b5ff', '#fff0b3', '#a6ffdc'];
  let width = 0;
  let height = 0;
  let bursts = [];
  let bubbles = [];
  let lettering = [];
  const clamp = value => Math.max(0, Math.min(1, value));
  const glow = document.createElement('canvas');
  glow.width = glow.height = 24;
  const glowContext = glow.getContext('2d');
  const glowGradient = glowContext.createRadialGradient(12, 12, 0, 12, 12, 12);
  glowGradient.addColorStop(0, '#ffffff');
  glowGradient.addColorStop(.16, '#fff3cf');
  glowGradient.addColorStop(.4, 'rgba(159,226,255,.55)');
  glowGradient.addColorStop(1, 'rgba(159,226,255,0)');
  glowContext.fillStyle = glowGradient;
  glowContext.fillRect(0, 0, 24, 24);

  function buildLettering() {
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(width);
    mask.height = Math.ceil(height);
    const c = mask.getContext('2d', { willReadFrequently: true });
    const scale = Math.min(width / (compact ? 600 : 850), height / 650, 1.15);
    const lines = [
      ['chúc mừng', 42, -112],
      ['Pastel', 108, -32],
      ['1 năm debut', 48, 45],
      ['1/10/2025 - 1/10/2026', 28, 109],
    ];
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    for (const [text, size, y] of lines) {
      // System serif supports Vietnamese without waiting on a remote font.
      c.font = `bold ${size * scale}px Georgia, "Times New Roman", serif`;
      c.fillText(text, width / 2, height * .48 + y * scale);
    }
    const pixels = c.getImageData(0, 0, mask.width, mask.height).data;
    const step = compact ? 1.8 : 3;
    lettering = [];
    for (let y = Math.floor(height * .48 - 155 * scale); y < height * .48 + 140 * scale; y += step) {
      for (let x = 0; x < width; x += step) {
        if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] > 100) {
          const seed = lettering.length + 900;
          lettering.push({ x, y, angle: random(seed) * Math.PI * 2, spread: random(seed + 1), flicker: random(seed + 2) });
        }
      }
    }
  }

  function renderCenterpiece(time) {
    const age = time - 3.2;
    if (age < -.9) return;
    const cx = width / 2;
    const cy = height * .48;
    if (age < 0) {
      const p = clamp(1 + age / .9);
      ctx.globalAlpha = p;
      ctx.drawImage(glow, cx - 26, height - (height - cy) * p - 26, 52, 52);
      return;
    }
    const formed = clamp((age - .35) / 1.35);
    const ease = 1 - Math.pow(1 - formed, 3);
    const dissolve = clamp((time - 8.6) / 2.7);
    const visibility = clamp(age / .45) * (1 - dissolve);
    canvas.dataset.messagePhase = formed < 1 ? 'forming' : dissolve > 0 ? 'dissolving' : 'readable';
    // A soft ocean veil lets the particle lettering take center stage.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = visibility * .88;
    const veil = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width * .65, height * .45));
    veil.addColorStop(0, '#020b22');
    veil.addColorStop(.55, 'rgba(2,11,34,.9)');
    veil.addColorStop(1, 'rgba(2,11,34,0)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    const radius = Math.min(width, height) * .58;
    const expansion = 1 - Math.exp(-age * 1.5);
    for (let ring = 0; ring < 3; ring++) {
      ctx.globalAlpha = Math.max(0, 1 - age / 3.1) * .65;
      ctx.strokeStyle = colors[ring];
      ctx.lineWidth = ring === 0 ? 3 : 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * expansion * (1 + ring * .16), radius * expansion * (.72 + ring * .13), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let j = 0; j < (compact ? 90 : 160); j++) {
      const angle = j * 2.39996;
      const distance = radius * expansion * (.6 + random(j + 880) * .5);
      ctx.globalAlpha = Math.max(0, 1 - age / 4) * .95;
      ctx.drawImage(sprites[j % 5][j % 3], cx + Math.cos(angle) * distance - 12, cy + Math.sin(angle) * distance * .8 - 12, 24, 24);
    }
    for (const point of lettering) {
      const launchRadius = radius * (.35 + point.spread * .6);
      const originX = cx + Math.cos(point.angle) * launchRadius;
      const originY = cy + Math.sin(point.angle) * launchRadius * .7;
      const drift = dissolve * dissolve * (55 + point.spread * 140);
      const x = originX + (point.x - originX) * ease + Math.cos(point.angle) * drift;
      const y = originY + (point.y - originY) * ease + Math.sin(point.angle) * drift - dissolve * 45;
      ctx.globalAlpha = visibility * (.78 + .22 * Math.sin(time * 3 + point.flicker * 12));
      const size = compact ? 3.7 : 6;
      ctx.drawImage(glow, x - size / 2, y - size / 2, size, size);
    }
  }
  const random = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const sprites = colors.map(color => ['star', 'heart', 'petal'].map(shape => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 48;
    const c = sprite.getContext('2d');
    c.translate(24, 24);
    c.fillStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 8;
    c.beginPath();
    if (shape === 'heart') {
      c.moveTo(0, 11);
      c.bezierCurveTo(-24, -3, -9, -20, 0, -8);
      c.bezierCurveTo(9, -20, 24, -3, 0, 11);
    } else if (shape === 'petal') {
      c.ellipse(0, 0, 5, 13, .5, 0, Math.PI * 2);
    } else {
      for (let j = 0; j < 10; j++) {
        const angle = j * Math.PI / 5 - Math.PI / 2;
        const radius = j % 2 ? 5 : 13;
        c.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
    }
    c.closePath();
    c.fill();
    return sprite;
  }));

  function reset() {
    canvas.hidden = true;
    canvas.dataset.active = 'false';
    ctx?.clearRect(0, 0, width, height);
    bursts = [];
    bubbles = [];
    lettering = [];
    canvas.dataset.messagePhase = 'hidden';
  }

  function start() {
    if (!ctx) return;
    canvas.hidden = false;
    canvas.dataset.active = 'true';
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, compact ? 1 : 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    buildLettering();
    bursts = Array.from({ length: compact ? 14 : 22 }, (_, i) => ({
      x: ((i % 2 ? .68 : .1) + random(i + 1) * .22) * width,
      y: (.12 + random(i + 40) * .48) * height,
      time: 1.05 + i * .24,
      color: i % colors.length,
      radius: Math.min(width, height) * (.15 + random(i + 60) * .1),
    }));
    bubbles = Array.from({ length: compact ? 160 : 260 }, (_, i) => ({
      x: random(i + 100) * width,
      endY: (.15 + random(i + 700) * .65) * height,
      delay: random(i + 300) * 2.1,
      life: 1.3 + random(i + 400) * 1.2,
      size: 1.5 + random(i + 500) * 4,
      color: colors[i % colors.length],
    }));
    render(0);
  }

  function render(time) {
    if (!ctx || canvas.hidden) return;
    ctx.clearRect(0, 0, width, height);
    const fade = Math.min(1, Math.max(0, (FIREWORKS_DURATION - time) / 1.3));
    ctx.globalCompositeOperation = 'lighter';
    for (const bubble of bubbles) {
      const p = (time - bubble.delay) / bubble.life;
      if (p < 0 || p > 1) continue;
      const x = bubble.x + Math.sin(p * 5 + bubble.x) * 12;
      const y = height + 12 - (height + 12 - bubble.endY) * p;
      ctx.globalAlpha = Math.sin(p * Math.PI) * .65 * fade;
      ctx.strokeStyle = bubble.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, bubble.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#efffff';
      ctx.fillRect(x - 1, y - bubble.size / 2, 1.5, 1.5);
    }
    for (const burst of bursts) {
      const age = time - burst.time;
      if (age < 0) {
        const p = Math.max(0, 1 + age / 1.2);
        if (!p) continue;
        const y = height + 15 - (height + 15 - burst.y) * p;
        ctx.globalAlpha = p * .9;
        ctx.drawImage(sprites[burst.color][0], burst.x - 14, y - 14, 28, 28);
        continue;
      }
      if (age > 3.7) continue;
      const spread = 1 - Math.exp(-age * 1.25);
      for (let ring = 0; ring < 2; ring++) {
        const r = burst.radius * (spread + ring * .13);
        ctx.globalAlpha = Math.max(0, 1 - age / 2.4) * .35 * fade;
        ctx.strokeStyle = colors[burst.color];
        ctx.lineWidth = ring ? 1 : 2;
        ctx.beginPath();
        ctx.ellipse(burst.x, burst.y, r, r * .72, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      const count = compact ? 34 : 54;
      for (let j = 0; j < count; j++) {
        const angle = j / count * Math.PI * 2 + burst.time;
        const radius = burst.radius * spread * (.4 + random(j + burst.time * 10) * .6);
        const x = burst.x + Math.cos(angle) * radius;
        const y = burst.y + Math.sin(angle) * radius * .8 + age * age * 6;
        // Keep the center portrait readable while stars bloom around it.
        const central = Math.abs(x / width - .5) < .15 && y / height > .2 && y / height < .7;
        ctx.globalAlpha = Math.max(0, 1 - age / 3.7) * fade * (central ? .24 : .9);
        const size = (j % 4 === 0 ? 28 : 15) * (compact ? .75 : 1);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + age * .35);
        ctx.drawImage(sprites[(burst.color + j % 2) % colors.length][j % 3], -size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }
    renderCenterpiece(time);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  return { start, render, reset };
}
