const palettes = {
  intro: ['90, 220, 255', '64, 128, 196'],
  journey: ['95, 232, 255', '82, 151, 255'],
  storm: ['147, 132, 210', '80, 105, 145'],
  finale: ['139, 225, 255', '189, 153, 255'],
};

export function createAmbientCanvas(canvas, reducedMotion = false) {
  const context = canvas.getContext('2d', { alpha: true });
  const particleCount = reducedMotion ? 26 : window.innerWidth < 720 ? 52 : 88;
  const particles = [];
  let width = 0;
  let height = 0;
  let ratio = 1;
  let mood = 'intro';
  let intensity = 0.45;
  let animationFrame = 0;

  function randomParticle(initial = false) {
    return {
      x: Math.random(),
      y: initial ? Math.random() : 1.08,
      size: 0.6 + Math.random() * 2.3,
      speed: 0.00008 + Math.random() * 0.00022,
      drift: (Math.random() - 0.5) * 0.00008,
      alpha: 0.12 + Math.random() * 0.52,
      kind: Math.random() > 0.72 ? 'ring' : 'dot',
    };
  }

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(time) {
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const palette = palettes[mood] || palettes.intro;
    context.globalCompositeOperation = 'screen';

    for (const particle of particles) {
      if (!reducedMotion) {
        const direction = mood === 'storm' ? 1 : -1;
        particle.y += particle.speed * direction * (0.5 + intensity * 1.5);
        particle.x += particle.drift + Math.sin(time * 0.0005 + particle.y * 8) * 0.00004;
      }

      if (particle.y < -0.08 || particle.y > 1.1 || particle.x < -0.08 || particle.x > 1.08) {
        Object.assign(particle, randomParticle(false));
        if (mood === 'storm') particle.y = -0.05;
      }

      const x = particle.x * width;
      const y = particle.y * height;
      const color = palette[particle.kind === 'ring' ? 1 : 0];
      const alpha = particle.alpha * (0.35 + intensity * 0.65);
      context.beginPath();
      context.arc(x, y, particle.size * (mood === 'finale' ? 1.35 : 1), 0, Math.PI * 2);
      if (particle.kind === 'ring') {
        context.strokeStyle = `rgba(${color}, ${alpha * 0.6})`;
        context.lineWidth = 0.75;
        context.stroke();
      } else {
        context.fillStyle = `rgba(${color}, ${alpha})`;
        context.fill();
      }
    }

    animationFrame = requestAnimationFrame(draw);
  }

  for (let i = 0; i < particleCount; i += 1) particles.push(randomParticle(true));
  resize();
  window.addEventListener('resize', resize, { passive: true });
  animationFrame = requestAnimationFrame(draw);

  return {
    setMood(nextMood, nextIntensity = intensity) {
      mood = nextMood;
      intensity = Math.max(0, Math.min(1, nextIntensity));
    },
    destroy() {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    },
  };
}
