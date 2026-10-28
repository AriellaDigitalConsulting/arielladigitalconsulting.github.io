// Site rule: every link that leaves adc.dev (docs.adc.dev included) opens in a new tab.
// Applied to each page's HTML as it's built, so it covers templates, article bodies and imported layouts alike.
import { defineMiddleware } from 'astro:middleware';

const SITE_HOSTS = new Set(['adc.dev', 'www.adc.dev']);

const isExternal = (href: string) => {
  const m = /^(?:https?:)?\/\/([^/:?#]+)/i.exec(href.trim());
  return !!m && !SITE_HOSTS.has(m[1].toLowerCase());
};

/** Add target="_blank" rel="noopener noreferrer" to external <a> tags, keeping any rel values already there. */
export function openExternalInNewTab(html: string) {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    if (!href || !isExternal(href[1] ?? href[2])) return tag;
    let out = tag.replace(/\starget\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
    const rel = /\srel\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(out);
    const values = new Set(((rel?.[1] ?? rel?.[2]) || '').split(/\s+/).filter(Boolean));
    values.add('noopener').add('noreferrer');
    if (rel) out = out.replace(rel[0], '');
    return out.replace(/\s*\/?>$/, (end) => ` target="_blank" rel="${[...values].join(' ')}"${end.trim() === '/>' ? ' />' : '>'}`);
  });
}

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const html = openExternalInNewTab(await response.text());
  return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
});
