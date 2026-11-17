# adc.dev: instructions for agents

This is the adc.dev marketing site (Astro, static, GitHub Pages). Several people edit it in their own sessions, so
keep changes to the files a task needs.

## Products: one page, one URL

The extension library is data-driven. `src/data/extensions.ts` is the only place a product is defined: the products
grid, the cards and the product URLs all come from it.

- Every product has **exactly one canonical URL**, resolved by `productHref()` in `src/lib/products.ts`:
  - a local `href` used by exactly one product is that product's page (for example `/looker`);
  - everything else gets a generated page at `/products/<slug>/` (for example `/products/algolia/`).
- `src/pages/products/[product].astro` generates those pages. Never create `/products/<slug>/` by hand, and never
  link a product with a query string or a fragment.
- Add a product by adding one entry to `extensions`: `n` is the name, `c` the categories, `d` the one-sentence
  description. `href` is optional — point it at a real dedicated page or at the docs, and leave it out when there is
  neither.
- Do not add product content anywhere else (a standalone page, a one-off card, a paragraph on `/products`). If it is
  not in `extensions.ts`, it is not a product and search will not find it.
- Adding an entry is enough: its URL appears in the sitemap on the next build and in search on the next index run.
- Renaming a product changes its generated slug. Add a redirect from the old URL in `astro.config.mjs`.
- Keep each product page's `<h1>` specific to the product and set a `description`; search uses both.

### When a product gets its own page

If a product needs a full page, create it (a hand-built page or a layout snapshot) and set `href` to it. A local
`href` must be used by only that one product; if two products share it, both get generated `/products/.../` pages
instead, and the shared page stays a collection page. The card links to the canonical URL either way.

## Search

The header search (`src/components/SiteSearch.astro`) answers from the `chatgpt-proxy` index. New and edited pages
reach it from `sitemap-index.xml` on the next index run — weekly, or when the job is run manually. Two consequences:

- A page that is not in the sitemap is not searchable. Do not exclude real pages.
- Mark repeated or reference blocks (related products, promos, cross-sell boxes) with `data-search-ignore` so the
  indexer skips them. Otherwise one product's copy makes many pages match that product.

The crawler reads each page's `<main>`, uses its `<h1>` as the title and its meta description as the summary. Keep
both specific to the page.

## Adding news

News posts live in `src/data/articles.json` (`slug`, `title`, `author`, `category`, `iso`, `excerpt`, `thumb`,
`hero`, `lead`, `html`). The page is generated at `/news/<slug>/`; the old Wix URL keeps working through a
redirect stub when `wixSlug` differs. Use `scripts/sync_news.mjs` to pull new posts, then
`python3 scripts/fetch_images.py`.

## Images and other pages

- Images go in `public/images/` (optimised WebP). Wix media IDs in snapshots and articles resolve through
  `src/data/images.json`.
- Hand-built pages live in `src/pages/`; legacy pages are layout snapshots in `src/data/layouts/` rendered by
  `src/pages/[...slug].astro`. Do not re-run the Wix snapshot scripts for normal edits.

## Before committing

```bash
npm run build
```

`main` deploys to GitHub Pages. Work on a branch and open a pull request.
