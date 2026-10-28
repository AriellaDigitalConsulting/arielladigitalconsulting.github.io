// Shapes an imported article body for the editorial article template: tidies spacing, gives section
// headings ids for the "On this page" menu, and turns a few recurring sections into callout boxes.

export interface TocEntry {
  id: string;
  text: string;
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const slugify = (s: string) =>
  stripTags(s)
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

const BLOCK = '(?:p|h[1-6]|ul|ol|li|figure|div|section|blockquote)';

/** Drop the <br> spacers the old CMS put between blocks; the template's margins handle rhythm now. */
const tidy = (html: string) =>
  html
    .replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '')
    .replace(new RegExp(`(</${BLOCK}>)\\s*(?:<br\\s*/?>\\s*)+`, 'gi'), '$1')
    .replace(new RegExp(`(?:<br\\s*/?>\\s*)+(<${BLOCK}[\\s>])`, 'gi'), '$1')
    .replace(/^(?:\s*<br\s*\/?>)+|(?:<br\s*\/?>\s*)+$/gi, '');

// Sections whose heading starts with one of these become a styled callout. Matching is on the heading text.
const callouts: { match: RegExp; kind: 'tip' | 'help' | 'next'; label?: string }[] = [
  { match: /^pro tip:?\s*/i, kind: 'tip', label: 'Pro tip' },
  { match: /^where we can help/i, kind: 'help' },
  { match: /^coming up next:?\s*/i, kind: 'next', label: 'Next episode' },
];

const icons = {
  tip: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#05006C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z"/></svg>',
  next: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#05006C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
  arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
};

export function shapeArticle(html: string, contactHref: string) {
  const toc: TocEntry[] = [];
  const used = new Set<string>();
  let body = tidy(html);

  // Split into the intro plus one chunk per <h2> section.
  const parts = body.split(/(?=<h2[\s>])/i);
  body = parts
    .map((part) => {
      const h = /^<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(part);
      if (!h) return part;
      const text = stripTags(h[1]);
      let id = slugify(text) || 'section';
      while (used.has(id)) id += '-2';
      used.add(id);
      const rest = part.slice(h[0].length);
      const callout = callouts.find((c) => c.match.test(text));
      toc.push({ id, text: callout?.kind === 'tip' ? text.replace(/^pro tip:?\s*/i, 'Pro tip: ') : text });

      if (!callout) return `<h2 id="${id}">${h[1]}</h2>${rest}`;
      const title = callout.label ? text.replace(callout.match, '') || text : text;
      const heading = title.charAt(0).toUpperCase() + title.slice(1);
      if (callout.kind === 'tip')
        return `<section id="${id}" class="ar-callout ar-callout--tip"><div class="ar-callout__label"><span class="ar-callout__icon">${icons.tip}</span>${callout.label}</div><h2>${heading}</h2>${rest}</section>`;
      if (callout.kind === 'help')
        return `<section id="${id}" class="ar-callout ar-callout--help"><h2>${h[1]}</h2>${rest}<a class="ar-callout__btn" href="${contactHref}">Let's talk${icons.arrow}</a></section>`;
      return `<section id="${id}" class="ar-callout ar-callout--next"><div class="ar-callout__icon ar-callout__icon--lg">${icons.next}</div><div><div class="ar-callout__label">${callout.label}</div><h2>${h[1]}</h2>${rest}</div></section>`;
    })
    .join('');

  // The first embedded video is the "watch" target for the hero's play button.
  let videoId: string | undefined;
  body = body.replace(/<figure class="video">/i, () => {
    videoId = 'watch-video';
    return '<figure class="video" id="watch-video">';
  });

  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return { body, toc, videoId, readMinutes: Math.max(1, Math.round(words / 200)) };
}
