/**
 * BattleTab v2 — Device Detection
 * Breakpoints, touch detection, safe areas.
 */

export function getDeviceType(width = window.innerWidth) {
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
}

export function isMobile(width = window.innerWidth) { return width < 768; }
export function isTablet(width = window.innerWidth) { return width >= 768 && width < 1200; }
export function isDesktop(width = window.innerWidth) { return width >= 1200; }

export function isTouch() {
  return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}

export function pick(width, mobile, tablet, desktop) {
  if (width < 768) return mobile;
  if (width < 1200) return tablet;
  return desktop;
}

export function getVerticalScale(height = window.innerHeight) {
  return Math.min(1, height / 700);
}

export function isCompactHeight(height = window.innerHeight) {
  return height < 500;
}

export function getSafeAreaInsets() {
  const el = document.documentElement;
  const style = getComputedStyle(el);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0,
  };
}
