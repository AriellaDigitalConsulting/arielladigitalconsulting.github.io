// Google Analytics behind a cookie banner. Nothing loads, and no cookie is set, until the visitor accepts.
// Set PUBLIC_GA_ID (a G-XXXXXXXXXX measurement ID) at build time; without it there is no banner and no analytics.
const KEY = 'adc-analytics-consent';

const read = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const write = (value: string) => {
  try {
    localStorage.setItem(KEY, value);
  } catch {}
};

const loadAnalytics = (id: string) => {
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    // gtag.js reads the Arguments object itself, not an array
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag('js', new Date());
  w.gtag('config', id, { anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
};

const showBanner = (onChoice: (accepted: boolean) => void) => {
  const banner = document.createElement('div');
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.style.cssText =
    'position:fixed;left:16px;right:16px;bottom:16px;z-index:2000;max-width:520px;padding:16px 18px;border-radius:12px;' +
    'background:#fff;color:#14132b;border:1px solid #e6e6f2;box-shadow:0 10px 30px rgba(5,0,108,.18);font:14px/1.5 system-ui,sans-serif';
  banner.innerHTML =
    '<p style="margin:0 0 12px">We use Google Analytics cookies to understand how this site is used. They are only set if you accept.</p>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end"></div>';
  const button = (label: string, accepted: boolean, primary: boolean) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText =
      'cursor:pointer;padding:8px 16px;border-radius:8px;font:600 14px system-ui,sans-serif;' +
      (primary ? 'background:#362dff;color:#fff;border:1px solid #362dff' : 'background:#fff;color:#362dff;border:1px solid #362dff');
    b.addEventListener('click', () => {
      banner.remove();
      onChoice(accepted);
    });
    return b;
  };
  banner.lastElementChild!.append(button('Decline', false, false), button('Accept', true, true));
  document.body.append(banner);
};

export function initConsent(id: string | undefined) {
  if (!id) return;
  const stored = read();
  if (stored === 'granted') loadAnalytics(id);
  else if (stored !== 'denied')
    showBanner((accepted) => {
      write(accepted ? 'granted' : 'denied');
      if (accepted) loadAnalytics(id);
    });
}
