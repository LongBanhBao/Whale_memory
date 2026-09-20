const compactWidthQuery = window.matchMedia('(max-width: 760px)');
const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

let stableViewport = null;

function measureViewport() {
  const root = document.documentElement;
  const body = document.body;
  return {
    width: Math.round(root.clientWidth || window.innerWidth || 1),
    // The body is sized with 100svh. Unlike innerHeight, this value does not
    // bounce whenever a mobile browser shows or hides its address bar.
    height: Math.round(body?.clientHeight || root.clientHeight || window.innerHeight || 1),
    liveHeight: Math.round(window.visualViewport?.height || window.innerHeight || root.clientHeight || 1),
  };
}

function orientationOf({ width, height }) {
  return width > height ? 'landscape' : 'portrait';
}

export function isCompactRuntime() {
  return compactWidthQuery.matches || coarsePointerQuery.matches;
}

export function renderPixelRatio(desktopCap = 2, compactCap = 1.25) {
  const cap = isCompactRuntime() ? compactCap : desktopCap;
  return Math.min(window.devicePixelRatio || 1, cap);
}

export function syncRuntimeProfile(force = false) {
  const root = document.documentElement;
  const measured = measureViewport();
  const compact = isCompactRuntime();
  const widthChanged = !stableViewport || Math.abs(measured.width - stableViewport.width) > 2;
  const candidate = {
    width: measured.width,
    height: !stableViewport
      ? (compact ? measured.height : measured.liveHeight)
      : (!compact || force === true || widthChanged ? measured.liveHeight : stableViewport.height),
  };
  const nextOrientation = orientationOf(candidate);
  const orientationChanged = !stableViewport || nextOrientation !== stableViewport.orientation;
  const heightChanged = !stableViewport || Math.abs(candidate.height - stableViewport.height) > 2;

  // Mobile URL bars emit resize events that only change innerHeight. Freezing
  // the cinematic viewport within one orientation prevents every full-screen
  // canvas and backdrop from being reallocated mid-animation.
  if (force === true || widthChanged || orientationChanged || (!compact && heightChanged)) {
    stableViewport = { ...candidate, orientation: nextOrientation };
  }

  const profile = compact ? 'compact' : 'full';
  const width = `${stableViewport.width}px`;
  const height = `${stableViewport.height}px`;
  if (root.dataset.runtimeProfile !== profile) root.dataset.runtimeProfile = profile;
  if (root.dataset.runtimeOrientation !== stableViewport.orientation) {
    root.dataset.runtimeOrientation = stableViewport.orientation;
  }
  if (root.style.getPropertyValue('--app-width') !== width) root.style.setProperty('--app-width', width);
  if (root.style.getPropertyValue('--app-height') !== height) root.style.setProperty('--app-height', height);
  return { width: stableViewport.width, height: stableViewport.height };
}

export function runtimeViewport() {
  if (!stableViewport) syncRuntimeProfile(true);
  return { width: stableViewport.width, height: stableViewport.height };
}
