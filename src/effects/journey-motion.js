export const GATE_TIMES = [4.5, 13.5, 22.5];
export const TAIL_CLEAR_DELAY = 2.4;
export const RETURN_START = GATE_TIMES.at(-1) + TAIL_CLEAR_DELAY;
export const JOURNEY_DURATION = RETURN_START + 2.1;
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
// Quintic easing keeps both velocity and acceleration quiet at phase edges.
const glide = v => { const t = clamp(v); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a, b, t) => a + (b - a) * t;
const bell = (value, start, peak, end) => (
  glide((value - start) / (peak - start)) * (1 - glide((value - peak) / (end - peak)))
);

function elevation(time) {
  return GATE_TIMES.reduce((height, center, index) => {
    const rise = glide((time - center + 3.1) / 2.7);
    // After the last passage, stay at gate height and approach the viewer.
    // There is no fourth low-cruise cycle or idle pause to wait through.
    const descend = index === GATE_TIMES.length - 1 ? 0 : glide((time - center - TAIL_CLEAR_DELAY) / 1.6);
    return height + rise * (1 - descend);
  }, 0);
}

export function journeyMotion(progress) {
  const time = clamp(progress) * JOURNEY_DURATION;
  const returning = glide((time - RETURN_START) / 2.1);
  const lift = elevation(time);
  const slope = (elevation(time + .08) - elevation(time - .08)) / .16;
  const bend = (lift - elevation(time - .5)) * 2.55;
  const entry = glide(time / 1.4);
  const gatePulse = Math.max(...GATE_TIMES.map(center => bell(time, center - 3, center - .2, center + TAIL_CLEAR_DELAY + .65)));
  const cruise = 1 - gatePulse;
  const breathing = Math.sin(time * 1.08) * .0032 * cruise * (1 - returning);
  const bank = Math.max(-11, Math.min(11, -slope * 20)) * (1 - returning);
  const stroke = (.5 + .5 * Math.sin(time * 2.35)) * (.015 + gatePulse * .18);
  return {
    time, returning, lift,
    x: mix(mix(.18, .47, glide(time / 2.2)), .55, returning),
    y: mix(mix(.57, .64, entry) - lift * .16 + breathing, .49, returning),
    scale: mix(.48 - lift * .012 + gatePulse * .008, 1, returning),
    rotation: mix(-4 - slope * 30 + bank * .16, -9, returning),
    bend: bend * (1 - returning),
    bank,
    effort: clamp((.11 + Math.abs(slope) * 1.42 + stroke) * (1 - returning)),
    wake: (.2 + gatePulse * .43 + Math.abs(slope) * .48) * (1 - returning),
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
