// Layered recurring blooms, clipped around the final artwork and copy.
export function createOutroFireworks(canvas, protectedNodes, compact) {
  const ctx = canvas.getContext('2d');
  let frame = 0;
  let elapsed = 0;
  let last = 0;
  let next = 3;
  let burst = null;
  let count = 0;
  let width = 0;
  let height = 0;
  const colors = ['#7beaff', '#ff99d5', '#c9a0ff', '#ffe697', '#89ffd0', '#ffb590'];
  const glows = colors.map(color => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const c = sprite.getContext('2d');
    const light = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    light.addColorStop(0, '#fff');
    light.addColorStop(.16, color);
    light.addColorStop(.42, `${color}88`);
    light.addColorStop(1, `${color}00`);
    c.fillStyle = light;
    c.fillRect(0, 0, 32, 32);
    return sprite;
  });

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    burst = null;
    canvas.hidden = true;
    canvas.dataset.active = 'false';
    ctx?.clearRect(0, 0, width, height);
  }

  function draw(now) {
    frame = requestAnimationFrame(draw);
    const dt = last ? Math.min((now - last) / 1000, .1) : 0;
    last = now;
    if (document.hidden) return;
    elapsed += dt;
    const area = canvas.getBoundingClientRect();
    if (width !== area.width || height !== area.height) {
      width = area.width;
      height = area.height;
      const ratio = Math.min(devicePixelRatio || 1, compact ? 1 : 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    const boxes = protectedNodes.map(node => {
      const b = node.getBoundingClientRect();
      return { left: b.left - area.left - 16, top: b.top - area.top - 16,
        right: b.right - area.left + 16, bottom: b.bottom - area.top + 16 };
    });
    ctx.clearRect(0, 0, width, height);
    if (elapsed >= next) {
      next = elapsed + 3;
      const options = [];
      for (let i = 0; i < 200; i++) {
        const x = 25 + Math.random() * Math.max(1, width - 50);
        const y = 25 + Math.random() * Math.max(1, height - 50);
        const clearance = Math.min(x, y, width - x, height - y, ...boxes.map(b =>
          Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom))));
        if (clearance > 25) options.push({ x, y, clearance,
          radius: Math.min(clearance * 1.45, compact ? 130 : 240) });
      }
      if (options.length) {
        // Favor spacious locations so a random tiny corner cannot shrink a bloom.
        options.sort((a, b) => b.clearance - a.clearance);
        burst = { ...options[Math.floor(Math.random() * Math.min(8, options.length))], born: elapsed, color: colors[count % colors.length], palette: count % colors.length };
        canvas.dataset.burstCount = String(++count);
        canvas.dataset.burstBounds = JSON.stringify({ x: burst.x, y: burst.y, radius: burst.radius });
      }
    }
    if (!burst) return;
    const age = elapsed - burst.born;
    if (age > 2.8) { burst = null; return; }
    ctx.save();
    // Clip both the launch trail and bloom against the current moving artwork.
    for (const b of boxes) {
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.rect(b.left, b.top, b.right - b.left, b.bottom - b.top);
      ctx.clip('evenodd');
    }
    ctx.strokeStyle = burst.color;
    ctx.fillStyle = burst.color;
    ctx.globalCompositeOperation = 'lighter';
    if (age < .65) {
      const y = height - (height - burst.y) * age / .65;
      ctx.globalAlpha = .85;
      ctx.beginPath();
      ctx.moveTo(burst.x, y + 22);
      ctx.lineTo(burst.x, y);
      ctx.stroke();
      ctx.drawImage(glows[burst.palette], burst.x - 13, y - 13, 26, 26);
      for (let j = 1; j <= 5; j++) {
        ctx.globalAlpha = .65 * (1 - j / 6);
        ctx.drawImage(glows[(burst.palette + j) % colors.length], burst.x - 5 + Math.sin(j) * 3, y + j * 8, 10, 10);
      }
    } else {
      const t = (age - .65) / 2.15;
      const radius = burst.radius * (1 - Math.pow(1 - t, 3));
      for (let ring = 0; ring < 3; ring++) {
        ctx.globalAlpha = Math.pow(1 - t, 1.5) * .5;
        ctx.strokeStyle = colors[(burst.palette + ring * 2) % colors.length];
        ctx.lineWidth = ring ? 1 : 2;
        ctx.beginPath();
        ctx.ellipse(burst.x, burst.y, radius * (1 - ring * .16), radius * (.82 - ring * .12), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      const total = compact ? 100 : 180;
      for (let j = 0; j < total; j++) {
        const a = j * 2.39996;
        const r = radius * (.32 + (j % 13) / 18);
        const x = burst.x + Math.cos(a) * r;
        const y = burst.y + Math.sin(a) * r * .8 + t * t * 12;
        const colorIndex = (burst.palette + j % colors.length) % colors.length;
        ctx.strokeStyle = colors[colorIndex];
        ctx.lineWidth = j % 5 === 0 ? 1.6 : .8;
        ctx.globalAlpha = (1 - t) * .55;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(a) * radius * .12 * (1 - t), y - Math.sin(a) * radius * .1 * (1 - t));
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = Math.pow(1 - t, .7) * (.7 + .3 * Math.sin(j + t * 8));
        const size = j % 5 === 0 ? 17 : 10;
        ctx.drawImage(glows[colorIndex], x - size / 2, y - size / 2, size, size);
        if (j % 7 === 0) {
          ctx.beginPath();
          ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
          ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function start() {
    stop();
    if (!ctx) return;
    canvas.hidden = false;
    canvas.dataset.active = 'true';
    canvas.dataset.burstCount = '0';
    elapsed = last = count = 0;
    next = 3;
    frame = requestAnimationFrame(draw);
  }
  return { start, stop };
}
