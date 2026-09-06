export const JOURNEY_DURATION = 36;
export const GATE_TIMES = [5, 15, 25];
export const TAIL_CLEAR_DELAY = 2.6;
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function elevation(time) {
  return GATE_TIMES.reduce((height, center) => {
    const rise = ease((time - center + 3.6) / 2.8);
    const descend = ease((time - center - TAIL_CLEAR_DELAY) / 1.8);
    return height + rise * (1 - descend);
  }, 0);
}

export function journeyMotion(progress) {
  const time = clamp(progress) * JOURNEY_DURATION;
  const returning = ease((time - 31) / 5);
  const lift = elevation(time);
  const slope = (elevation(time + .06) - elevation(time - .06)) / .12;
  const bend = (lift - elevation(time - .65)) * 2.4;
  const entry = ease(time / 1.4);
  return {
    time, returning, lift,
    x: mix(mix(.18, .47, ease(time / 2.3)), .55, returning),
    y: mix(mix(.57, .64, entry) - lift * .16, .49, returning),
    scale: mix(.48 - lift * .015, 1, returning),
    rotation: mix(-4 - slope * 32, -9, returning),
    bend: bend * (1 - returning),
    effort: (.18 + Math.abs(slope) * 1.2) * (1 - returning),
    passed: GATE_TIMES.filter(center => time >= center + TAIL_CLEAR_DELAY).length,
    gates: GATE_TIMES.map(center => {
      const offset = time - center;
      // Ten seconds between gates. No clamped travel at the final gate.
      return {
        x: .55 - offset * .075,
        y: .48 - Math.max(0, -offset - 1) * .008,
        scale: Math.exp(offset * .075),
        opacity: 1 - ease((offset - TAIL_CLEAR_DELAY) / 2.2),
        memories: ease((offset + 4.5) / 1.8) * (1 - ease((offset - TAIL_CLEAR_DELAY) / 2.2)),
        cleared: offset >= TAIL_CLEAR_DELAY,
      };
    }),
  };
}
