export const STORM_DURATION = 24;

export const STORM_PHASES = Object.freeze({
  ENTRY: [0, .08],
  STRUGGLE_ONE: [.08, .225],
  STRUGGLE_TWO: [.225, .37],
  STRUGGLE_THREE: [.37, .52],
  FATIGUE: [.52, .585],
  FAMILY_ARRIVAL: [.585, .735],
  BREAKTHROUGH: [.735, .95],
  LIGHT_WIPE: [.95, 1],
});

export const STORM_OBSTACLES = Object.freeze([
  { label: 'TOXIC', detail: 'bình luận tiêu cực', impact: .155, expel: .735 },
  { label: 'ÁP LỰC', detail: 'phải luôn hoàn hảo', impact: .3, expel: .762 },
  { label: 'BẾU', detail: 'lời chê bai ngoại hình', impact: .445, expel: .79 },
  { label: 'MỆT MỎI', detail: 'những ngày không thể nghỉ', impact: .505, expel: .818 },
  { label: 'SO SÁNH', detail: 'những con số lạnh lùng', impact: .545, expel: .845 },
  { label: 'TỰ NGHI NGỜ', detail: 'mình có đủ tốt không?', impact: .575, expel: .872 },
]);

export const STORM_COMPANION_COUNT = 24;
export const STORM_MOBILE_COMPANION_COUNT = 16;

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
const pulse = (value, center, width = .018) => bell(
  value, center - width, center, center + width * 1.35,
);

const whaleFrames = [
  { p: 0, x: .2, y: .76, mx: .23, my: .79, scale: .46, rotation: -24 },
  { p: .08, x: .24, y: .73, mx: .26, my: .77, scale: .47, rotation: -24 },
  { p: .155, x: .43, y: .59, mx: .45, my: .64, scale: .52, rotation: -22 },
  { p: .225, x: .27, y: .72, mx: .27, my: .77, scale: .46, rotation: -31 },
  { p: .3, x: .48, y: .51, mx: .49, my: .57, scale: .52, rotation: -22 },
  { p: .37, x: .28, y: .71, mx: .27, my: .76, scale: .45, rotation: -32 },
  { p: .445, x: .53, y: .45, mx: .53, my: .51, scale: .53, rotation: -21 },
  { p: .52, x: .25, y: .74, mx: .25, my: .79, scale: .43, rotation: -35 },
  { p: .585, x: .27, y: .755, mx: .27, my: .795, scale: .43, rotation: -32 },
  { p: .735, x: .36, y: .64, mx: .35, my: .69, scale: .49, rotation: -27 },
  { p: .95, x: .84, y: .1, mx: .735, my: .165, scale: .56, rotation: -32 },
  { p: 1, x: .87, y: .055, mx: .76, my: .095, scale: .47, rotation: -35 },
];

const obstacleLayout = [
  { start: [1.12, .39], block: [.56, .58], mobile: [.67, .63], scatter: [-.84, .42], rotation: -8 },
  { start: [1.08, .12], block: [.64, .48], mobile: [.73, .53], scatter: [.83, -.51], rotation: 7 },
  { start: [.96, -.13], block: [.7, .39], mobile: [.79, .45], scatter: [.8, .49], rotation: -5 },
  { start: [1.15, .5], block: [.67, .34], mobile: [.71, .4], scatter: [-.94, -.5], rotation: 9 },
  { start: [.86, -.16], block: [.73, .24], mobile: [.76, .3], scatter: [.78, -.6], rotation: -10 },
  { start: [1.18, .68], block: [.8, .17], mobile: [.82, .23], scatter: [.74, .6], rotation: 5 },
];

// Local coordinates follow the main whale's swimming axis. The first sixteen
// slots form the compact mobile school; the final eight add depth on desktop.
const companionSlots = [
  [-.16, -.03], [-.16, .03], [-.13, -.08], [-.13, .08],
  [-.085, -.12], [-.085, .12], [-.03, -.145], [-.03, .145],
  [.03, -.145], [.03, .145], [.085, -.12], [.085, .12],
  [.13, -.08], [.13, .08], [.16, -.03], [.16, .03],
  [-.075, -.055], [-.075, .055], [-.015, -.075], [-.015, .075],
  [.045, -.07], [.045, .07], [.105, -.04], [.105, .04],
];

const companionStarts = [
  [-.34, .82], [-.28, .67], [-.4, .93], [-.23, .52],
  [-.38, .76], [-.27, .38], [-.43, .6], [-.24, .9],
  [-.36, .47], [-.29, .72], [-.42, .3], [-.25, .57],
  [-.39, .86], [-.3, .43], [-.44, .69], [-.26, .27],
  [-.37, .55], [-.31, .96], [-.42, .4], [-.28, .8],
  [-.39, .62], [-.24, .34], [-.44, .88], [-.29, .5],
];

function interpolateWhale(progress, mobile) {
  if (progress >= STORM_PHASES.BREAKTHROUGH[0] && progress <= STORM_PHASES.BREAKTHROUGH[1]) {
    const previous = whaleFrames[9];
    const next = whaleFrames[10];
    const amount = smoothstep((progress - previous.p) / (next.p - previous.p));
    const arc = Math.sin(amount * Math.PI);
    const xKey = mobile ? 'mx' : 'x';
    const yKey = mobile ? 'my' : 'y';
    return {
      x: lerp(previous[xKey], next[xKey], amount),
      y: lerp(previous[yKey], next[yKey], amount) - arc * (mobile ? .018 : .028),
      scale: lerp(previous.scale, next.scale, amount) + arc * .04,
      rotation: lerp(previous.rotation, next.rotation, amount) - arc * 1.4,
    };
  }

  let nextIndex = whaleFrames.findIndex(frame => frame.p >= progress);
  if (nextIndex <= 0) nextIndex = 1;
  const previous = whaleFrames[nextIndex - 1];
  const next = whaleFrames[nextIndex] || whaleFrames[whaleFrames.length - 1];
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
  if (progress < .08) return 'entry';
  if (progress < .225) return 'struggle-1';
  if (progress < .37) return 'struggle-2';
  if (progress < .52) return 'struggle-3';
  if (progress < .585) return 'fatigue';
  if (progress < .735) return 'family-arrival';
  if (progress < .95) return 'breakthrough';
  return 'light-wipe';
}

function obstacleFrame(progress, definition, layout, mobile, index) {
  const appear = definition.impact - (index < 3 ? .105 : .07);
  const arrival = smootherstep((progress - appear) / (definition.impact - appear));
  const expel = smootherstep((progress - definition.expel) / .055);
  const block = mobile ? layout.mobile : layout.block;
  const settledDrift = Math.sin((progress - definition.impact) * 24 + index) * .006
    * (1 - expel) * (progress > definition.impact ? 1 : 0);
  return {
    x: lerp(layout.start[0], block[0], arrival) + layout.scatter[0] * expel + settledDrift,
    y: lerp(layout.start[1], block[1], arrival) + layout.scatter[1] * expel - settledDrift * .7,
    rotation: layout.rotation + arrival * (index % 2 ? -4 : 5) + expel * (index % 2 ? 58 : -62),
    scale: lerp(.7, 1, arrival) * lerp(1, .8, expel),
    opacity: smoothstep((progress - appear) / .035) * (1 - smoothstep((expel - .68) / .32)),
    impact: pulse(progress, definition.impact, .016),
    expel,
    state: progress < definition.impact - .018
      ? 'approach' : progress < definition.impact + .035
        ? 'impact' : progress < definition.expel
          ? 'blocked' : 'expelled',
  };
}

function companionFrames(progress, whale, mobile, wipe) {
  const heading = whale.rotation * Math.PI / 180;
  const cosine = Math.cos(heading);
  const sine = Math.sin(heading);
  return companionSlots.map(([along, cross], index) => {
    const wave = Math.floor(index / 6);
    const lane = index % 6;
    const revealStart = .575 + wave * .015 + lane * .004;
    const arrival = smootherstep((progress - revealStart) / .09);
    const localAlong = along * (mobile ? 1.02 : 1);
    const localCross = cross * (mobile ? .86 : 1);
    const formationX = whale.x + localAlong * cosine - localCross * sine;
    const formationY = whale.y + localAlong * sine + localCross * cosine;
    const swim = Math.sin(progress * 39 + index * 1.55);
    const entryArc = Math.sin(arrival * Math.PI) * (lane % 2 ? -.055 : .045);
    const visible = smoothstep((arrival - .08) / .72);
    return {
      x: lerp(companionStarts[index][0], formationX, arrival),
      y: lerp(companionStarts[index][1], formationY, arrival)
        + entryArc + swim * .004 * arrival,
      rotation: lerp(-8 + (lane % 3 - 1) * 2.5, whale.rotation, arrival)
        + (index % 3 - 1) * 3 + swim * 1.25,
      scale: (.76 + (index % 5) * .05) * lerp(.72, 1, arrival),
      opacity: visible * (.76 + (index % 5) * .055) * (1 - wipe * .68),
      front: index % 3 !== 0,
      arrival,
      wave,
    };
  });
}

export function stormMotion(value, { mobile = false } = {}) {
  const progress = clamp(value);
  const whale = interpolateWhale(progress, mobile);
  const impacts = STORM_OBSTACLES.slice(0, 3).map(obstacle => (
    pulse(progress, obstacle.impact, .016)
  ));
  const impact = Math.max(...impacts);
  const family = smoothstep((progress - .575) / .16);
  const hope = smoothstep((progress - .61) / .14);
  const breakthrough = smoothstep((progress - .72) / .23);
  const clear = smoothstep((progress - .76) / .19);
  // The light starts blooming just before contact, then surges on the exact
  // arrival frame so there is no visual pause between reaching it and flashing.
  const wipe = Math.pow(smoothstep((progress - .945) / .055), .24);
  const fatigue = bell(progress, .28, .545, .735);
  const lonely = 1 - smoothstep((progress - .595) / .14);
  const sadness = clamp((.28 + smoothstep((progress - .13) / .39) * .74) * lonely);

  const lightningFar = Math.max(
    pulse(progress, .075, .018), pulse(progress, .255, .016),
    pulse(progress, .39, .018), pulse(progress, .535, .017),
  ) * (1 - clear * .82);
  const lightningNear = Math.max(
    pulse(progress, .155, .014), pulse(progress, .3, .014),
    pulse(progress, .445, .014), pulse(progress, .575, .015),
  ) * (1 - clear * .9);
  const lightningSheet = Math.max(
    pulse(progress, .19, .026), pulse(progress, .345, .024),
    pulse(progress, .49, .025), pulse(progress, .63, .026),
  ) * (1 - clear * .84);
  const lightning = Math.max(lightningFar, lightningNear, lightningSheet * .72);
  const rainBase = (1 - clear) * (.86 + Math.sin(progress * Math.PI * 13) * .08);
  const obstacles = STORM_OBSTACLES.map((obstacle, index) => (
    obstacleFrame(progress, obstacle, obstacleLayout[index], mobile, index)
  ));

  whale.rotation += impact * 7.5 + fatigue * 1.4;
  whale.scale *= 1 - impact * .05;
  whale.opacity = 1 - smoothstep((progress - .955) / .045) * .86;
  whale.glow = .06 + family * .34 + breakthrough * .44;
  whale.brightness = .66 + clear * .52 - sadness * .09;
  whale.effort = clamp(.76 + impact * .24 - fatigue * .46 + hope * .28);
  whale.wake = .16 + breakthrough * .78 + impact * .14;
  whale.sadness = sadness;
  whale.hope = hope;
  whale.impact = impact;
  whale.bend = Math.sin(progress * Math.PI * 18) * .055 * whale.effort - sadness * .045;
  whale.bank = -fatigue * 5 + impact * 3;

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
      intensity: 1 - clear * .78,
      clear,
      rain: rainBase,
      rainFar: rainBase * .62,
      rainMid: rainBase * .82,
      rainNear: rainBase,
      lightning,
      lightningFar,
      lightningNear,
      lightningSheet,
      swell: (1 - clear * .7) * (.82 + Math.sin(progress * Math.PI * 10) * .1),
      spray: (1 - clear) * (.62 + lightningSheet * .25),
      flow: progress * 168,
      shakeX: Math.sin(progress * 740) * impact * (mobile ? 3 : 7),
      shakeY: Math.cos(progress * 610) * impact * (mobile ? 2 : 4.5),
    },
    light: {
      beacon: smoothstep((progress - .82) / .13),
      wipe,
      radius: wipe * 175,
      x: mobile ? 76 : 86,
      y: mobile ? 10 : 8,
    },
    copy: {
      struggle: bell(progress, .09, .18, .36),
      fatigue: bell(progress, .43, .535, .625),
      family: bell(progress, .575, .69, .9),
    },
  };
}
