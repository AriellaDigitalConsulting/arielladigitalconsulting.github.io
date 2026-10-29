# adc.dev

Static rebuild of the Ariella Digital Consulting website, originally built on Wix.

Built with [Astro](https://astro.build), deployed to GitHub Pages, served at `www.adc.dev`.

## Development

Astro 7 needs Node ≥ 22.22.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # → dist/
npm run preview   # serve dist/
```

## How pages are built

- **Hand-built pages** — `index`, `products`, `services`, `about`, `contact` and the news pages are
  regular Astro pages in `src/pages/`, styled to match the original design (`src/styles/global.css`).
  Edit their copy directly in the page files.
- **Snapshotted pages** — every other page (analytics, design, search, third-party integrations, blog
  and the 30 product/widget pages) is rendered by `src/pages/[...slug].astro` from a layout snapshot in
  `src/data/layouts/<slug>.json`. A snapshot records the original page's boxes, images, rich text and
  icons with their exact geometry, once for desktop (1440px stage) and once for Wix's mobile layout
  (320px stage, scaled to the viewport). `src/components/LayoutPage.astro` renders them.

```
src/
  pages/            hand-built pages, news/, [...slug].astro (snapshotted pages)
  components/       Header, Footer, LayoutPage + LayoutNode (snapshot renderer)
  layouts/Base.astro
  lib/              img() lookup for migrated images, news helpers
  data/
    layouts/        page snapshots (generated)
    articles.json   news posts (generated)
    images.json     original Wix media id → optimized local file
    site.ts         navigation, footer links, contact details
public/
  images/           optimized WebP images
  fonts/            the original Wix fonts + self-hosted Open Sans
scripts/            snapshot and sync tooling (needs Google Chrome)
```

## Refreshing content from the Wix site

While the Wix site is still live, its content can be pulled again:

```bash
node scripts/snapshot.mjs org-chart looker   # re-snapshot specific pages (slug "index" = home)
node scripts/sync_news.mjs                   # add new news posts (--all re-fetches every post)
python3 scripts/fetch_images.py              # download any newly referenced images (needs Pillow)
```

News posts can also be added by hand: append an entry to `src/data/articles.json` with `slug`, `title`,
`author`, `avatar`, `category`, `iso` date, `excerpt`, `thumb`, `hero`, `lead` and `html` (images are
referenced by Wix media id, see `images.json`).

Original Wix article URLs keep working through redirect stubs (`src/pages/news/[...wix].astro`).

## Form

The contact form has no backend: on submit it sends the visitor to the Calendly event in
`booking` (`src/data/site.ts`) with their answers pre-filled. Name and email map natively; company,
region, topics and message map to the event's custom questions `a1`–`a4`, so keep them in that order on Calendly.

## Deployment

Push to `main`; `.github/workflows/deploy.yml` builds and publishes to GitHub Pages. `public/CNAME`
pins the custom domain to `www.adc.dev`.
