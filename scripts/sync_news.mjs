// Re-syncs src/data/articles.json from the live news pages.
// Usage: node scripts/sync_news.mjs            (only new articles are fetched in full)
//        node scripts/sync_news.mjs --all      (re-fetch every article body)
// Afterwards run `python3 scripts/fetch_images.py` to download new images.
import fs from 'node:fs';
import { openPage } from './lib/cdp.mjs';

const ORIGIN = process.env.ORIGIN || 'https://www.adc.dev';
const FILE = new URL('../src/data/articles.json', import.meta.url);
const all = process.argv.includes('--all');
// Wix slugs carry brackets, colons, curly quotes…; the static site uses plain ASCII ones.
const slugify = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const listItems = () => {
  const media = (u) => (u?.match(/static\.wixstatic\.com\/media\/([^/?")]+)/) || [])[1];
  const seen = new Set();
  const out = [];
  for (const h2 of document.querySelectorAll('#PAGES_CONTAINER h2')) {
    // each news item is a repeater cell holding image, author, date, category, title, excerpt
    let cell = h2;
    while (cell && !cell.querySelector('a[href*="/news/"]')) cell = cell.parentElement;
    const a = cell?.querySelector('a[href*="/news/"]');
    if (!a) continue;
    const slug = decodeURIComponent(a.getAttribute('href').split('/news/')[1] || '');
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const texts = [...cell.querySelectorAll('[data-testid="richTextElement"]')].map((e) => e.innerText.replace(/​/g, '').trim());
    const imgs = [...cell.querySelectorAll('img')].map((i) => ({ id: media(i.currentSrc || i.src), w: i.getBoundingClientRect().width }));
    const thumb = imgs.find((i) => i.w > 100)?.id;
    const avatar = imgs.find((i) => i.w <= 60)?.id;
    const title = h2.innerText.trim();
    const ti = texts.indexOf(title);
    out.push({ slug, title, author: texts[0], date: texts[1], category: ti > 2 ? texts[ti - 1] : '', excerpt: texts[ti + 1] || '', thumb, avatar });
  }
  return out;
};

const articleBody = () => {
  const media = (u) => (u?.match(/static\.wixstatic\.com\/media\/([^/?")]+)/) || [])[1];
  const root = document.querySelector('#PAGES_CONTAINER') || document.body;
  const rich = [...root.querySelectorAll('[data-testid="richTextElement"]')];
  const title = rich[0]?.innerText.trim();
  const date = rich.find((e) => /\b\d{4}\b/.test(e.innerText) && /(January|February|March|April|May|June|July|August|September|October|November|December)/.test(e.innerText) && e.innerText.length < 60)?.innerText.trim();
  const hero = [...root.querySelectorAll('img')].find((i) => i.getBoundingClientRect().width > 600);
  const KEEP = new Set(['P', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'U', 'A', 'BR', 'BLOCKQUOTE', 'FIGURE', 'FIGCAPTION']);
  const esc = (t) => t.replace(/​/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const clean = (n) => {
    if (n.nodeType === 3) return esc(n.textContent);
    if (n.nodeType !== 1) return '';
    const s = getComputedStyle(n);
    if (s.display === 'none') return '';
    if (n.getAttribute('data-hook') === 'figure-VIDEO') {
      // click-to-play YouTube poster: the video id is in the thumbnail URL
      const yt = n.innerHTML.match(/i\.ytimg\.com\/vi\/([\w-]+)/) || n.innerHTML.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
      if (yt) return `<figure class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Video" loading="lazy" allowfullscreen></iframe></figure>`;
    }
    if (n.tagName === 'IFRAME') {
      const yt = n.src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
      return yt ? `<figure class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Video" loading="lazy" allowfullscreen></iframe></figure>` : '';
    }
    if (n.tagName === 'VIDEO') {
      const src = n.currentSrc || n.src;
      return src && !src.startsWith('blob:') ? `<figure class="video"><video src="${src}" controls preload="none"></video></figure>` : '';
    }
    if (n.tagName === 'IMG') {
      const id = media(n.currentSrc || n.src);
      return id && n.getBoundingClientRect().width > 80 ? `<figure><img src="wix:${id}" alt="${esc(n.alt || '')}"></figure>` : '';
    }
    let inner = [...n.childNodes].map(clean).join('');
    let tag = n.tagName === 'H1' ? 'H2' : n.tagName;
    if (!KEEP.has(tag)) {
      if (+s.fontWeight >= 600 && n.parentElement && +getComputedStyle(n.parentElement).fontWeight < 600 && inner.trim()) return `<strong>${inner}</strong>`;
      if (s.fontStyle === 'italic' && n.parentElement && getComputedStyle(n.parentElement).fontStyle !== 'italic' && inner.trim()) return `<em>${inner}</em>`;
      return inner;
    }
    tag = tag.toLowerCase();
    if (tag === 'br') return '<br>';
    if (['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tag) && !inner.replace(/<br>/g, '').trim()) return '';
    if (tag === 'a') {
      const href = n.getAttribute('href') || '';
      return href ? `<a href="${href.replace(/^https?:\/\/(www\.)?adc\.dev/, '')}">${inner}</a>` : inner;
    }
    return `<${tag}>${inner}</${tag}>`;
  };
  // lead paragraph(s): rich text blocks after the date, then the rich content viewer body
  const after = rich.slice(rich.findIndex((e) => e.innerText.trim() === date) + 1);
  const lead = after.map((e) => clean(e)).join('');
  const rcv = root.querySelector('[class*="RichContentViewer"]');
  const body = rcv ? clean(rcv) : '';
  return { title, date, hero: hero ? media(hero.currentSrc || hero.src) : null, lead, body };
};

const existing = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : [];
const bySlug = new Map(existing.map((a) => [a.wixSlug, a]));

const list = await openPage(`${ORIGIN}/news`);
const items = await list.evaluate(`(${listItems.toString()})()`);
list.close();
console.log(items.length, 'articles listed');

if (process.env.LIST_ONLY) { console.log(JSON.stringify(items.slice(0, 4), null, 1)); process.exit(0); }

const isoOf = (s) => { const d = new Date(`${s} 12:00 UTC`); return isNaN(d) ? undefined : d.toISOString().slice(0, 10); };

const fetchArticle = async (it) => {
  const prev = bySlug.get(it.slug);
  if (prev && !all && prev.html) return prev;
  const page = await openPage(`${ORIGIN}/news/${encodeURIComponent(it.slug)}`);
  try {
    const a = await page.evaluate(`(${articleBody.toString()})()`);
    // some live articles answer 403: keep what we had, or fall back to the list entry
    if (!a.title) return prev ?? { iso: isoOf(it.date), lead: '', html: `<p>${it.excerpt}</p>` };
    const d = new Date(a.date?.replace(/ at .*/, '') + ' 12:00 UTC');
    console.log('fetched', it.slug);
    return { title: a.title, iso: isNaN(d) ? prev?.iso ?? isoOf(it.date) : d.toISOString().slice(0, 10), hero: a.hero, lead: a.lead, html: a.body };
  } finally {
    page.close();
  }
};

const full = new Array(items.length);
const queue = items.map((it, i) => [it, i]);
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) { const [it, i] = queue.shift(); full[i] = await fetchArticle(it); }
}));
const out = items.map((it, i) => ({
  slug: slugify(it.slug),
  wixSlug: it.slug,
  title: full[i].title || it.title,
  author: it.author,
  avatar: it.avatar,
  category: it.category,
  iso: full[i].iso,
  excerpt: it.excerpt,
  thumb: it.thumb,
  hero: full[i].hero,
  lead: full[i].lead,
  html: full[i].html,
}));
fs.writeFileSync(FILE, JSON.stringify(out, null, 1));
console.log('wrote', out.length);
process.exit(0);
