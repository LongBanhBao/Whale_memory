const lerp = (from, to, amount) => from + (to - from) * amount;

export function createWhalePlayer(canvas, manifest, spriteUrl, reducedMotion = false) {
  const context = canvas.getContext('2d', { alpha: true });
  const sprite = new Image();
  const target = {
    x: 0.5,
    y: 0.53,
    scale: 1,
    rotation: 0,
    opacity: 0,
    glow: 0.45,
    brightness: 1,
  };
  const current = { ...target };
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let ready = false;
  let frameHandle = 0;

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function render(time) {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const ease = reducedMotion ? 1 : 0.08;
    for (const key of Object.keys(current)) {
      current[key] = lerp(current[key], target[key], ease);
    }

    if (ready && current.opacity > 0.005) {
      const frame = reducedMotion ? 0 : Math.floor(time / (1000 / manifest.fps)) % manifest.frameCount;
      const column = frame % manifest.columns;
      const row = Math.floor(frame / manifest.columns);
      const responsiveWidth = Math.min(width * (width < 720 ? 0.82 : 0.52), 760);
      const drawWidth = responsiveWidth * current.scale;
      const drawHeight = drawWidth * (manifest.frameHeight / manifest.frameWidth);
      const swimY = reducedMotion ? 0 : Math.sin(time * 0.0017) * Math.min(10, height * 0.012);
      const swimRotation = reducedMotion ? 0 : Math.sin(time * 0.0011) * 0.8;

      context.save();
      context.globalAlpha = Math.max(0, Math.min(1, current.opacity));
      context.translate(current.x * width, current.y * height + swimY);
      context.rotate(((current.rotation + swimRotation) * Math.PI) / 180);
      context.filter = `brightness(${current.brightness}) drop-shadow(0 0 ${18 + current.glow * 34}px rgba(57, 218, 255, ${0.22 + current.glow * 0.34}))`;
      context.drawImage(
        sprite,
        column * manifest.frameWidth,
        row * manifest.frameHeight,
        manifest.frameWidth,
        manifest.frameHeight,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight,
      );
      context.restore();
    }

    frameHandle = requestAnimationFrame(render);
  }

  sprite.onload = () => {
    ready = true;
  };
  sprite.onerror = () => {
    canvas.classList.add('is-unavailable');
    window.__blueVoyageEmergencyUnlock?.();
  };
  sprite.src = spriteUrl;
  resize();
  window.addEventListener('resize', resize, { passive: true });
  frameHandle = requestAnimationFrame(render);

  return {
    setPose(pose) {
      Object.assign(target, pose);
    },
    destroy() {
      cancelAnimationFrame(frameHandle);
      window.removeEventListener('resize', resize);
    },
  };
}
