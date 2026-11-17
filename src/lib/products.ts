import { categories, extensions, type Extension } from '../data/extensions';

const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));

// A product keeps its existing page when that local URL belongs to one product only. Shared pages (bundles, the wiki,
// the MicroApps page) and docs links get a generated product page instead, so every product has exactly one URL.
const pageUses = new Map<string, number>();
for (const ext of extensions) {
  if (ext.href?.startsWith('/')) pageUses.set(ext.href, (pageUses.get(ext.href) ?? 0) + 1);
}

export const productSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const hasOwnPage = (ext: Extension) => Boolean(ext.href?.startsWith('/') && pageUses.get(ext.href) === 1);

/** The single URL a product is linked and indexed under. */
export const productHref = (ext: Extension) => (hasOwnPage(ext) ? ext.href! : `/products/${productSlug(ext.n)}/`);

export const productCategories = (ext: Extension) => ext.c.map((id) => categoryLabel[id]).filter(Boolean);
