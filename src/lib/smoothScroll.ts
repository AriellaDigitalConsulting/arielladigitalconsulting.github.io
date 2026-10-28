// Eased scrolling for in-page links (#section). Browsers' built-in smooth scroll can't be tuned, so we animate it.

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let frame = 0;

/** Height of the sticky site header, so jumps land just below it. */
export const headerOffset = () => document.querySelector<HTMLElement>('.mh')?.offsetHeight ?? 0;

/** Scroll so `el` sits just below the sticky header, easing in and out. Longer trips take a little longer. */
export function scrollToElement(el: Element, offset = headerOffset()) {
  const start = window.scrollY;
  const end = Math.max(0, Math.min(el.getBoundingClientRect().top + start - offset, document.documentElement.scrollHeight - window.innerHeight));
  const distance = end - start;
  cancelAnimationFrame(frame);
  if (reducedMotion() || Math.abs(distance) < 2) {
    window.scrollTo(0, end);
    return;
  }
  const duration = Math.min(1200, Math.max(600, Math.abs(distance) * 0.5));
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, start + distance * easeInOutCubic(t));
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
}

/** Make every same-page "#id" link on the page use the eased scroll, keeping the URL and keyboard focus in sync. */
export function enableSmoothAnchors() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.origin !== location.origin || link.pathname !== location.pathname || link.hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    history.pushState(null, '', link.hash);
    scrollToElement(target);
    // Move focus for keyboard and screen-reader users without a second jump.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
  // A user scrolling with the wheel or touch takes over from the animation.
  for (const ev of ['wheel', 'touchstart'] as const) addEventListener(ev, () => cancelAnimationFrame(frame), { passive: true });
}
