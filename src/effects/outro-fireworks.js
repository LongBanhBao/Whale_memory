// Small recurring blooms, confined to the empty space around the final layout.
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
  const colors = ['#afefff', '#ffc4e7', '#dabaff', '#fff0bb'];

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
      for (let i = 0; i < 100; i++) {
        const x = 25 + Math.random() * Math.max(1, width - 50);
        const y = 25 + Math.random() * Math.max(1, height - 50);
        const clearance = Math.min(x, y, width - x, height - y, ...boxes.map(b =>
          Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom))));
        if (clearance > 25) options.push({ x, y, radius: Math.min(clearance - 8, compact ? 55 : 100) });
      }
      if (options.length) {
        burst = { ...options[Math.floor(Math.random() * options.length)], born: elapsed, color: colors[count % colors.length] };
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
    if (age < .65) {
      const y = height - (height - burst.y) * age / .65;
      ctx.globalAlpha = .85;
      ctx.beginPath();
      ctx.moveTo(burst.x, y + 22);
      ctx.lineTo(burst.x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(burst.x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const t = (age - .65) / 2.15;
      const radius = burst.radius * (1 - Math.pow(1 - t, 3));
      ctx.globalAlpha = (1 - t) * .7;
      ctx.beginPath();
      ctx.ellipse(burst.x, burst.y, radius, radius * .8, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let j = 0; j < 42; j++) {
        const a = j * 2.39996;
        const r = radius * (.45 + (j % 7) / 12);
        const x = burst.x + Math.cos(a) * r;
        const y = burst.y + Math.sin(a) * r * .8;
        ctx.globalAlpha = (1 - t) * .9;
        ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
        if (j % 4 === 0) {
          ctx.beginPath();
          ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
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
