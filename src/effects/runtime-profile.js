const compactWidthQuery = window.matchMedia('(max-width: 760px)');
const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

export function isCompactRuntime() {
  return compactWidthQuery.matches || coarsePointerQuery.matches;
}

export function renderPixelRatio(desktopCap = 2, compactCap = 1.25) {
  const cap = isCompactRuntime() ? compactCap : desktopCap;
  return Math.min(window.devicePixelRatio || 1, cap);
}

export function syncRuntimeProfile() {
  document.documentElement.dataset.runtimeProfile = isCompactRuntime() ? 'compact' : 'full';
}
