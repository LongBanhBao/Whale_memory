export const GATE_TIMES = [4, 12, 20];
export const TAIL_CLEAR_DELAY = 2.4;
export const RETURN_START = 24;
export const JOURNEY_DURATION = 28;
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
// Quintic easing keeps both velocity and acceleration quiet at phase edges.
const glide = v => { const t = clamp(v); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a, b, t) => a + (b - a) * t;
const bell = (value, start, peak, end) => (
  glide((value - start) / (peak - start)) * (1 - glide((value - peak) / (end - peak)))
);

export function journeyMotion(progress) {
  const time = clamp(progress) * JOURNEY_DURATION;
  const returning = glide((time - RETURN_START) / (JOURNEY_DURATION - RETURN_START));
  const phase = Math.PI * time / 4;
  const wave = Math.cos(phase);
  const verticalVelocity = -.08 * Math.PI / 4 * Math.sin(phase);
  const waveY = .56 + wave * .08;
  const lift = (1 - wave) * .5;
  const gatePulse = Math.max(...GATE_TIMES.map(center => bell(time, center - 3, center - .2, center + TAIL_CLEAR_DELAY + .65)));
  const bank = Math.max(-9, Math.min(9, verticalVelocity * 125)) * (1 - returning);
  const travelRotation = -4 + verticalVelocity * 155;
  const bend = -verticalVelocity * 4.2;
  return {
    time, returning, lift,
    x: mix(mix(.18, .47, glide(time / 2.2)), .55, returning),
    y: waveY + returning * .01,
    scale: mix(.48 + gatePulse * .008, 1, returning),
    rotation: mix(travelRotation, -9, returning),
    bend: bend * (1 - returning),
    bank,
    effort: clamp((.12 + Math.abs(verticalVelocity) * 5.6 + gatePulse * .08) * (1 - returning)),
    wake: (.18 + Math.abs(verticalVelocity) * 5 + gatePulse * .16) * (1 - returning),
    passed: GATE_TIMES.filter(center => time >= center + TAIL_CLEAR_DELAY).length,
    gates: GATE_TIMES.map((center, index) => {
      const offset = time - center;
      const fadeDuration = index === GATE_TIMES.length - 1 ? 1.25 : 2;
      // Nine seconds between gates. No clamped travel at the final gate.
      return {
        x: .55 - offset * .082,
        y: .48 - Math.max(0, -offset - 1) * .008,
        scale: Math.exp(offset * .082),
        opacity: 1 - ease((offset - TAIL_CLEAR_DELAY) / fadeDuration),
        memories: ease((offset + 4.1) / 1.65) * (1 - ease((offset - TAIL_CLEAR_DELAY) / fadeDuration)),
        recall: [0, 1, 2, 3].map(slot => ease((offset + 3.85 - slot * .2) / 1.1)),
        pulse: bell(time, center - 3.4, center - .2, center + TAIL_CLEAR_DELAY + .8),
        cleared: offset >= TAIL_CLEAR_DELAY,
      };
    }),
  };
}
