import articles from '../data/articles.json';
import images from '../data/images.json';

export interface Article {
  slug: string;
  wixSlug: string;
  title: string;
  author: string;
  avatar?: string;
  category: string;
  iso: string;
  excerpt: string;
  thumb?: string;
  hero?: string | null;
  lead: string;
  html: string;
}

const files = images as Record<string, { file: string; w?: number; h?: number }>;
export const imageFile = (id?: string | null) => (id ? files[id]?.file : undefined);
/** Width ÷ height of a stored image, if known. */
export const imageRatio = (id?: string | null) => {
  const f = id ? files[id] : undefined;
  return f?.w && f?.h ? f.w / f.h : undefined;
};
/** True when an image is roughly 16:9 (or unknown); off-ratio images (logos, square art) are shown whole instead of cropped. */
export const isWideImage = (id?: string | null) => {
  const r = imageRatio(id);
  return !r || Math.abs(r - 16 / 9) < 0.12;
};

export const posts = (articles as Article[]).slice().sort((a, b) => b.iso.localeCompare(a.iso));

export const shortDate = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
export const longDate = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Article HTML with Wix image placeholders and site links rewritten to local paths. */
export const localHtml = (html: string) =>
  html
    .replace(/src="wix:([^"]+)"/g, (_m, id) => `src="${imageFile(id) ?? ''}" loading="lazy"`)
    .replace(/href="\/news\/([^"]+)"/g, (_m, s) => {
      const hit = posts.find((p) => p.wixSlug === decodeURIComponent(s));
      return `href="/news/${hit ? hit.slug : s}"`;
    });
