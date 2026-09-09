export const STORM_DURATION = 14;

export const STORM_PHASES = Object.freeze({
  STRUGGLE_ONE: [0, .2],
  STRUGGLE_TWO: [.2, .38],
  STRUGGLE_THREE: [.38, .54],
  FAMILY_ARRIVAL: [.54, .64],
  BREAKTHROUGH: [.64, .88],
  LIGHT_WIPE: [.88, 1],
});

export const STORM_OBSTACLES = Object.freeze([
  { label: 'LỜI NÓI TOXIC', detail: 'bình luận tiêu cực', impact: .12, expel: .64 },
  { label: 'ÁP LỰC', detail: 'phải luôn hoàn hảo', impact: .3, expel: .675 },
  { label: 'SO SÁNH', detail: 'những con số lạnh lùng', impact: .47, expel: .71 },
  { label: 'TIN ĐỒN', detail: 'những lời chưa từng đúng', impact: .52, expel: .745 },
  { label: 'MỆT MỎI', detail: 'những ngày không thể nghỉ', impact: .555, expel: .78 },
  { label: 'TỰ NGHI NGỜ', detail: 'mình có đủ tốt không?', impact: .59, expel: .81 },
]);

const clamp = value => Math.max(0, Math.min(1, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const smoothstep = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const smootherstep = (value) => {
  const x = clamp(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const bell = (value, start, peak, end) => (
  smoothstep((value - start) / (peak - start))
  * (1 - smoothstep((value - peak) / (end - peak)))
);

const whaleFrames = [
  { p: 0, x: .21, y: .76, mx: .23, my: .79, scale: .48, rotation: -25 },
  { p: .12, x: .41, y: .61, mx: .44, my: .65, scale: .52, rotation: -23 },
  { p: .2, x: .26, y: .72, mx: .25, my: .77, scale: .47, rotation: -30 },
  { p: .3, x: .48, y: .53, mx: .49, my: .57, scale: .52, rotation: -23 },
  { p: .38, x: .28, y: .7, mx: .26, my: .75, scale: .46, rotation: -30 },
  { p: .47, x: .52, y: .47, mx: .52, my: .51, scale: .53, rotation: -23 },
  { p: .54, x: .3, y: .68, mx: .28, my: .73, scale: .46, rotation: -31 },
  { p: .64, x: .38, y: .59, mx: .35, my: .66, scale: .5, rotation: -27 },
  { p: .88, x: .81, y: .15, mx: .7, my: .22, scale: .55, rotation: -32 },
  { p: 1, x: .86, y: .08, mx: .76, my: .1, scale: .48, rotation: -34 },
];

const obstacleLayout = [
  { start: [1.12, .34], block: [.56, .58], mobile: [.66, .62], scatter: [-.82, .46], rotation: -8 },
  { start: [1.08, .12], block: [.64, .49], mobile: [.72, .53], scatter: [.82, -.5], rotation: 7 },
  { start: [.94, -.12], block: [.7, .42], mobile: [.78, .46], scatter: [.78, .48], rotation: -5 },
  { start: [1.15, .48], block: [.66, .35], mobile: [.7, .4], scatter: [-.92, -.48], rotation: 9 },
  { start: [.84, -.16], block: [.72, .25], mobile: [.75, .3], scatter: [.76, -.58], rotation: -10 },
  { start: [1.18, .65], block: [.79, .18], mobile: [.81, .23], scatter: [.72, .58], rotation: 5 },
];

const companionSlots = [
  [-.14, .035], [-.1, -.095], [-.055, .125], [.025, -.145],
  [.105, .08], [-.155, .135], [.055, .155], [-.03, -.19], [.15, -.075],
];

const companionStarts = [
  [-.12, .84], [.03, 1.08], [-.08, .58], [.2, 1.12],
  [-.15, .96], [.39, 1.1], [-.1, .7], [.54, 1.08], [-.12, .48],
];

function interpolateWhale(progress, mobile) {
  if (progress >= .64 && progress <= .88) {
    const previous = whaleFrames[7];
    const next = whaleFrames[8];
    const amount = smoothstep((progress - previous.p) / (next.p - previous.p));
    const arc = Math.sin(amount * Math.PI);
    const xKey = mobile ? 'mx' : 'x';
    const yKey = mobile ? 'my' : 'y';
    return {
      x: lerp(previous[xKey], next[xKey], amount),
      y: lerp(previous[yKey], next[yKey], amount) - arc * (mobile ? .018 : .025),
      scale: lerp(previous.scale, next.scale, amount) + arc * .035,
      rotation: lerp(previous.rotation, next.rotation, amount) - arc,
    };
  }

  let nextIndex = whaleFrames.findIndex(frame => frame.p >= progress);
  if (nextIndex <= 0) nextIndex = 1;
  const previous = whaleFrames[nextIndex - 1];
  const next = whaleFrames[nextIndex] || whaleFrames.at(-1);
  const amount = smootherstep((progress - previous.p) / (next.p - previous.p));
  const xKey = mobile ? 'mx' : 'x';
  const yKey = mobile ? 'my' : 'y';
  return {
    x: lerp(previous[xKey], next[xKey], amount),
    y: lerp(previous[yKey], next[yKey], amount),
    scale: lerp(previous.scale, next.scale, amount),
    rotation: lerp(previous.rotation, next.rotation, amount),
  };
}

function phaseAt(progress) {
  if (progress < .2) return 'struggle-1';
  if (progress < .38) return 'struggle-2';
  if (progress < .54) return 'struggle-3';
  if (progress < .64) return 'family-arrival';
  if (progress < .88) return 'breakthrough';
  return 'light-wipe';
}

function obstacleFrame(progress, definition, layout, mobile, index) {
  const appear = definition.impact - (index < 3 ? .105 : .07);
  const arrival = smootherstep((progress - appear) / (definition.impact - appear));
  const expel = smootherstep((progress - definition.expel) / .06);
  const block = mobile ? layout.mobile : layout.block;
  const settledDrift = Math.sin((progress - definition.impact) * 18 + index) * .006
    * (1 - expel) * (progress > definition.impact ? 1 : 0);
  return {
    x: lerp(layout.start[0], block[0], arrival) + layout.scatter[0] * expel + settledDrift,
    y: lerp(layout.start[1], block[1], arrival) + layout.scatter[1] * expel - settledDrift * .7,
    rotation: layout.rotation + arrival * (index % 2 ? -4 : 5) + expel * (index % 2 ? 54 : -58),
    scale: lerp(.72, 1, arrival) * lerp(1, .82, expel),
    opacity: smoothstep((progress - appear) / .035) * (1 - smoothstep((expel - .72) / .28)),
    impact: bell(progress, definition.impact - .016, definition.impact, definition.impact + .032),
    expel,
    state: progress < definition.impact - .018
      ? 'approach' : progress < definition.impact + .032
        ? 'impact' : progress < definition.expel
          ? 'blocked' : 'expelled',
  };
}

function companionFrames(progress, whale, mobile, wipe) {
  return companionSlots.map(([offsetX, offsetY], index) => {
    const revealStart = .505 + index * .004;
    const arrival = smootherstep((progress - revealStart) / .1);
    const formationScale = mobile ? .82 : 1;
    const formationX = whale.x + offsetX * formationScale;
    const formationY = whale.y + offsetY * (mobile ? .76 : 1);
    const pulse = Math.sin(progress * 32 + index * 1.7);
    return {
      x: lerp(companionStarts[index][0], formationX, arrival),
      y: lerp(companionStarts[index][1], formationY, arrival) + pulse * .003 * arrival,
      rotation: whale.rotation + (index % 3 - 1) * 3 + pulse * 1.2,
      scale: (.64 + (index % 4) * .055) * lerp(.74, 1, arrival),
      opacity: arrival * (.48 + (index % 4) * .075) * (1 - wipe * .72),
      front: index % 3 !== 0,
      arrival,
    };
  });
}

export function stormMotion(value, { mobile = false } = {}) {
  const progress = clamp(value);
  const whale = interpolateWhale(progress, mobile);
  const impacts = STORM_OBSTACLES.slice(0, 3).map(obstacle => (
    bell(progress, obstacle.impact - .016, obstacle.impact, obstacle.impact + .032)
  ));
  const impact = Math.max(...impacts);
  const family = smoothstep((progress - .515) / .125);
  const breakthrough = smoothstep((progress - .63) / .25);
  const clear = smoothstep((progress - .66) / .25);
  const wipe = smootherstep((progress - .88) / .115);
  const lightning = Math.max(
    ...STORM_OBSTACLES.slice(0, 3).map(obstacle => (
      bell(progress, obstacle.impact - .02, obstacle.impact - .006, obstacle.impact + .025)
    )),
    bell(progress, .565, .578, .603) * (1 - family),
  );
  const obstacles = STORM_OBSTACLES.map((obstacle, index) => (
    obstacleFrame(progress, obstacle, obstacleLayout[index], mobile, index)
  ));

  whale.rotation += impact * 7;
  whale.scale *= 1 - impact * .045;
  whale.opacity = 1 - smoothstep((progress - .94) / .06) * .84;
  whale.glow = .08 + family * .38 + breakthrough * .38;
  whale.brightness = .56 + clear * .68;
  whale.effort = .46 + (1 - family) * .34 + impact * .2;
  whale.wake = .18 + breakthrough * .72 + impact * .12;

  return {
    progress,
    time: progress * STORM_DURATION,
    phase: phaseAt(progress),
    whale,
    impact,
    family,
    breakthrough,
    obstacles,
    companions: companionFrames(progress, whale, mobile, wipe),
    storm: {
      intensity: .94 - clear * .78,
      clear,
      rain: (1 - clear) * (.7 + Math.sin(progress * Math.PI * 9) * .12),
      lightning,
      flow: progress * 100,
    },
    light: {
      beacon: smoothstep((progress - .76) / .12),
      wipe,
      radius: wipe * 175,
      x: mobile ? 76 : 86,
      y: mobile ? 10 : 8,
    },
    copy: {
      struggle: bell(progress, .07, .15, .29),
      family: bell(progress, .49, .59, .74),
    },
  };
}
