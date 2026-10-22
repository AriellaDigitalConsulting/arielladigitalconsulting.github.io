// Snapshots the rendered layout of live adc.dev pages into src/data/layouts/<slug>.json.
// Usage: node scripts/snapshot.mjs <slug> [<slug> ...]   (slug "index" = home page)
// Needs Google Chrome. Captures boxes, images, rich text and inline SVG icons with their
// absolute geometry at a 1440px viewport, nested by containment, header/footer excluded.
import fs from 'node:fs';
import { openPage } from './lib/cdp.mjs';

const ORIGIN = process.env.ORIGIN || 'https://www.adc.dev';
const OUT = new URL('../src/data/layouts/', import.meta.url);

const collect = (STAGE) => {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const top = header ? header.getBoundingClientRect().bottom + scrollY : 0;
  const bottom = footer ? footer.getBoundingClientRect().top + scrollY : document.body.scrollHeight;
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y + scrollY - top), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const y = r.y + scrollY;
    return y + r.height > top && y < bottom;
  };
  const media = (u) => (u.match(/static\.wixstatic\.com\/media\/([^/?")]+)/) || [])[1];
  const px = (v) => Math.round(parseFloat(v) * 10) / 10;
  const blockStyle = (s) => {
    const o = [`--fs:${px(s.fontSize)}px`, `font-family:${s.fontFamily.replace(/"/g, "'")}`, `color:${s.color}`];
    if (s.fontWeight !== '400') o.push(`font-weight:${s.fontWeight}`);
    if (s.fontStyle !== 'normal') o.push(`font-style:${s.fontStyle}`);
    if (s.lineHeight !== 'normal') o.push(`line-height:${s.lineHeight}`);
    if (s.letterSpacing !== 'normal' && parseFloat(s.letterSpacing)) o.push(`letter-spacing:${s.letterSpacing}`);
    if (s.textAlign !== 'start' && s.textAlign !== 'left') o.push(`text-align:${s.textAlign}`);
    if (s.textDecorationLine !== 'none') o.push(`text-decoration:${s.textDecorationLine}`);
    if (s.textTransform !== 'none') o.push(`text-transform:${s.textTransform}`);
    if (s.whiteSpace === 'nowrap' || s.whiteSpace === 'pre') o.push(`white-space:${s.whiteSpace}`);
    if (s.textOverflow === 'ellipsis') o.push('text-overflow:ellipsis', 'overflow:hidden');
    return o.join(';');
  };
  const inlineDiff = (s, p) => {
    const o = [];
    if (s.fontSize !== p.fontSize) o.push(`--fs:${px(s.fontSize)}px`);
    if (s.fontFamily !== p.fontFamily) o.push(`font-family:${s.fontFamily.replace(/"/g, "'")}`);
    if (s.color !== p.color) o.push(`color:${s.color}`);
    if (s.fontWeight !== p.fontWeight) o.push(`font-weight:${s.fontWeight}`);
    if (s.fontStyle !== p.fontStyle) o.push(`font-style:${s.fontStyle}`);
    if (s.textDecorationLine !== p.textDecorationLine) o.push(`text-decoration:${s.textDecorationLine}`);
    if (s.letterSpacing !== p.letterSpacing && parseFloat(s.letterSpacing)) o.push(`letter-spacing:${s.letterSpacing}`);
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') o.push(`background:${s.backgroundColor}`);
    return o.join(';');
  };
  const esc = (t) => t.replace(/​/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const BLOCK = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE']);
  const rich = (root) => {
    const walk = (n, parentStyle) => {
      if (n.nodeType === 3) return esc(n.textContent);
      if (n.nodeType !== 1) return '';
      if (n.tagName === 'BR') return '<br>';
      if (['SCRIPT', 'STYLE', 'svg'].includes(n.tagName)) return '';
      const s = getComputedStyle(n);
      if (s.display === 'none') return '';
      const inner = [...n.childNodes].map((c) => walk(c, s)).join('');
      if (BLOCK.has(n.tagName)) {
        const tag = n.tagName.toLowerCase();
        const extra = [];
        if (tag === 'ul' || tag === 'ol') extra.push(`padding-left:${s.paddingLeft}`, `list-style:${s.listStyleType}`);
        if (s.marginTop !== '0px') extra.push(`margin-top:${s.marginTop}`);
        if (s.marginBottom !== '0px') extra.push(`margin-bottom:${s.marginBottom}`);
        return `<${tag} style="${[blockStyle(s), ...extra].join(';')}">${inner}</${tag}>`;
      }
      const d = inlineDiff(s, parentStyle);
      let out = d ? `<span style="${d}">${inner}</span>` : inner;
      if (n.tagName === 'A' && n.getAttribute('href')) out = `<a href="${n.getAttribute('href')}">${out}</a>`;
      return out;
    };
    const s = getComputedStyle(root);
    return [...root.childNodes].map((c) => walk(c, s)).join('');
  };
  const rotOf = (el) => {
    for (let e = el, i = 0; e && i < 3; e = e.parentElement, i++) {
      const t = getComputedStyle(e).transform;
      if (t && t !== 'none') {
        const m = t.match(/matrix\(([^,]+),\s*([^,]+)/);
        if (m) { const a = Math.round((Math.atan2(+m[2], +m[1]) * 180) / Math.PI); if (Math.abs(a) > 0) return a; }
      }
    }
    return undefined;
  };
  // intersect the element's box with every clipping ancestor (overflow != visible)
  const clipOf = (el, r) => {
    let x1 = r.x, y1 = r.y, x2 = r.x + r.w, y2 = r.y + r.h;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.overflowX === 'visible' && s.overflowY === 'visible' && s.clipPath === 'none') continue;
      const c = rect(e);
      if (s.overflowX !== 'visible' || s.clipPath !== 'none') { x1 = Math.max(x1, c.x); x2 = Math.min(x2, c.x + c.w); }
      if (s.overflowY !== 'visible' || s.clipPath !== 'none') { y1 = Math.max(y1, c.y); y2 = Math.min(y2, c.y + c.h); }
    }
    if (x2 <= x1 || y2 <= y1) return null;
    if (x1 === r.x && y1 === r.y && x2 === r.x + r.w && y2 === r.y + r.h) return undefined;
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  };
  const radiusOf = (el) => {
    for (let e = el, i = 0; e && i < 4; e = e.parentElement, i++) {
      const s = getComputedStyle(e);
      if (s.borderRadius && s.borderRadius !== '0px' && (e === el || s.overflow !== 'visible')) return s.borderRadius;
    }
    return undefined;
  };
  const svgHtml = (svg) => {
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')];
    const dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((e, i) => {
      const s = getComputedStyle(e);
      if (['path', 'circle', 'rect', 'polygon', 'ellipse', 'line', 'polyline', 'g', 'svg'].includes(e.tagName)) {
        dst[i].setAttribute('fill', s.fill);
        if (s.fillOpacity !== '1') dst[i].setAttribute('fill-opacity', s.fillOpacity);
        if (s.opacity !== '1') dst[i].setAttribute('opacity', s.opacity);
        if (s.stroke !== 'none') { dst[i].setAttribute('stroke', s.stroke); dst[i].setAttribute('stroke-width', s.strokeWidth); }
      }
      dst[i].removeAttribute('class');
      dst[i].removeAttribute('data-bbox');
      dst[i].removeAttribute('data-type');
    });
    clone.querySelectorAll('style,script').forEach((e) => e.remove());
    clone.removeAttribute('style');
    clone.setAttribute('width', '100%');
    clone.setAttribute('height', '100%');
    if (!clone.getAttribute('preserveAspectRatio')) clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    return clone.outerHTML;
  };

  const items = [];
  const skip = new Set();
  const all = document.body.querySelectorAll('*');
  for (const el of all) {
    if (skip.has(el)) continue;
    if (el.closest('header, footer') || el.closest('[id^="SITE_HEADER"], [id^="SITE_FOOTER"]')) continue;
    if (el.closest('svg') && el.tagName !== 'svg') continue;
    if (!visible(el)) { if (el.tagName === 'svg') continue; continue; }
    const s = getComputedStyle(el);
    const r = rect(el);
    if (el.tagName === 'IMG') {
      const src = media(el.currentSrc || el.src);
      if (!src) continue;
      // Wix crops server-side (/v1/crop/x_,y_,w_,h_/); keep the crop and the original size
      const cm = (el.currentSrc || el.src).match(/\/v1\/crop\/x_(\d+),y_(\d+),w_(\d+),h_(\d+)/);
      let info = null;
      try { info = JSON.parse(el.closest('wow-image')?.dataset.imageInfo || 'null')?.imageData; } catch {}
      const crop = cm && info ? { x: +cm[1], y: +cm[2], w: +cm[3], h: +cm[4], ow: info.width, oh: info.height } : undefined;
      // section backgrounds are sticky/parallax: their box depends on scroll, so use the layer's box
      const layer = el.closest('[id^="bgLayers_"]');
      if (layer) {
        items.push({ k: 'img', ...rect(layer), src, alt: '', fit: 'cover', pos: s.objectPosition, crop, op: +s.opacity < 1 ? +s.opacity : undefined });
        continue;
      }
      const clip = clipOf(el, r);
      if (clip === null) continue;
      // when an ancestor clips the image, the node takes the visible rect and keeps the full one as `inner`
      const geo = clip ? { ...clip, inner: { x: r.x - clip.x, y: r.y - clip.y, w: r.w, h: r.h } } : r;
      items.push({ k: 'img', ...geo, src, alt: el.alt || '', fit: s.objectFit, pos: s.objectPosition, crop, radius: radiusOf(el), rot: rotOf(el), op: +s.opacity < 1 ? +s.opacity : undefined });
      continue;
    }
    if (el.tagName === 'svg') {
      if (r.w < 6 || r.h < 6) continue;
      const html = svgHtml(el);
      if (html.length > 60000) continue;
      items.push({ k: 'svg', ...r, html, rot: rotOf(el) });
      continue;
    }
    if (el.tagName === 'IFRAME' || el.tagName === 'VIDEO') {
      items.push({ k: 'embed', ...r, src: el.src || el.currentSrc, tag: el.tagName.toLowerCase(), poster: el.poster ? media(el.poster) : undefined });
      continue;
    }
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      items.push({ k: 'input', ...r, tag: el.tagName.toLowerCase(), type: el.type, ph: el.placeholder || '', style: blockStyle(s), border: s.borderBottom, bg: s.backgroundColor });
      continue;
    }
    // decoration boxes
    const bg = s.backgroundColor;
    const bi = s.backgroundImage;
    const border = ['Top', 'Right', 'Bottom', 'Left'].map((side) => s[`border${side}Width`] !== '0px' && s[`border${side}Style`] !== 'none' ? `${s[`border${side}Width`]} ${s[`border${side}Style`]} ${s[`border${side}Color`]}` : '0');
    const hasBorder = border.some((b) => b !== '0');
    if ((bg !== 'rgba(0, 0, 0, 0)' || (bi && bi !== 'none') || hasBorder || s.boxShadow !== 'none') && r.w >= 6 && r.h >= 6) {
      const clip = clipOf(el, r);
      if (clip === null) continue;
      if (clip) Object.assign(r, clip);
      const bimg = bi && bi !== 'none' ? (media(bi) ? { src: media(bi), size: s.backgroundSize, pos: s.backgroundPosition, repeat: s.backgroundRepeat } : { css: bi }) : undefined;
      items.push({ k: 'box', ...r, bg: bg !== 'rgba(0, 0, 0, 0)' ? bg : undefined, bimg, border: hasBorder ? border : undefined, radius: s.borderRadius !== '0px' ? s.borderRadius : undefined, shadow: s.boxShadow !== 'none' ? s.boxShadow : undefined, op: +s.opacity < 1 ? +s.opacity : undefined, link: el.tagName === 'A' ? el.getAttribute('href') : undefined });
    }
    // text
    const isRich = el.matches('[data-testid="richTextElement"], .wixui-rich-text');
    const hasText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.replace(/​/g, '').trim());
    if (isRich || hasText) {
      const target = isRich ? el : el;
      const html = rich(target);
      if (!target.innerText.replace(/​/g, '').trim()) continue;
      items.push({ k: 'text', ...r, html, style: blockStyle(s), link: el.closest('a')?.getAttribute('href') || undefined });
      target.querySelectorAll('*').forEach((d) => skip.add(d));
    }
  }
  return { height: Math.round(bottom - top), items };
};

const nest = (items, STAGE) => {
  // full-bleed (x<=0 & w>=1430) nodes stay top-level and never become parents
  const isFull = (n) => n.x <= 2 && n.w >= STAGE - 10;
  const contains = (a, b) => a !== b && a.k === 'box' && !isFull(a) && b.x >= a.x - 1 && b.y >= a.y - 1 && b.x + b.w <= a.x + a.w + 1 && b.y + b.h <= a.y + a.h + 1 && (a.w * a.h > b.w * b.h || items.indexOf(a) < items.indexOf(b));
  const roots = [];
  items.forEach((n, i) => { n.i = i; n.c = []; });
  for (const n of items) {
    let best = null;
    for (const p of items) if (contains(p, n) && (!best || p.w * p.h < best.w * best.h)) best = p;
    (best ? best.c : roots).push(n);
    n.full = isFull(n) || undefined;
  }
  const rel = (n, px, py) => {
    const ax = n.x, ay = n.y;
    n.x -= px; n.y -= py;
    n.c.forEach((c) => rel(c, ax, ay));
    if (!n.c.length) delete n.c;
    delete n.i;
  };
  roots.forEach((n) => rel(n, 0, 0));
  return roots;
};

async function snapshot(slug, mode) {
  const STAGE = mode === 'mobile' ? 320 : 1440;
  const page = await openPage(`${ORIGIN}/${slug === 'index' ? '' : slug}`, { mobile: mode === 'mobile' });
  try {
    const at = decodeURIComponent(await page.evaluate('location.pathname'));
    if (at.replace(/^\/|\/$/g, '') !== (slug === 'index' ? '' : slug)) throw new Error(`landed on ${at} instead of /${slug}`);
    const title = await page.evaluate('document.title');
    const description = await page.evaluate(`document.querySelector('meta[name=description]')?.content || ''`);
    const data = await page.evaluate(`(${collect.toString()})(${STAGE})`);
    const nodes = nest(data.items, STAGE);
    console.log(slug, mode, data.height, data.items.length);
    return { title, description, width: STAGE, height: data.height, nodes };
  } finally {
    page.close();
  }
}

const withRetry = async (fn, tries = 3) => {
  for (let i = 1; ; i++) {
    try { return await fn(); } catch (e) { if (i >= tries) throw e; console.warn('retrying after', e.message.slice(0, 120)); }
  }
};

const slugs = process.argv.slice(2);
const queue = [...slugs];
fs.mkdirSync(OUT, { recursive: true });
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const slug = queue.shift();
    const desktop = await withRetry(() => snapshot(slug, 'desktop'));
    const mobile = await withRetry(() => snapshot(slug, 'mobile'));
    const { title, description } = desktop;
    for (const v of [desktop, mobile]) { delete v.title; delete v.description; }
    fs.writeFileSync(new URL(`${slug}.json`, OUT), JSON.stringify({ slug, title, description, desktop, mobile }));
  }
}));
process.exit(0);
