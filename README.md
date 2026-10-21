# adc.dev

Static rebuild of the Ariella Digital Consulting website, originally built on Wix.

Built with [Astro](https://astro.build), deployed to GitHub Pages, served at `www.adc.dev`.

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # → dist/
npm run preview   # serve dist/
```

## Structure

```
src/
  pages/          # one file per route; [...slug].astro covers the 30+ product/widget pages
  layouts/Base.astro
  components/     # Header, Footer, Blocks (generic content renderer)
  data/
    pages.json    # extracted content for the generic pages
    articles.json # news posts (title, date, author, body)
    images.json   # original Wix URI → optimized local file
  styles/global.css
public/
  images/         # 64 optimized WebP images
  fonts/          # Archivo, Archivo Black, DIN Next
```

## Content

News posts live in `src/data/articles.json`. To add a post, append an entry with `slug`, `title`,
`iso` date, `author`, `excerpt`, `image` (`uri` copied from `images.json`'s key or `null`) and a
`body` array of `{ type: 'p' | 'h2' | 'list', text | items }`.

The `scripts/` folder holds the one-off Wix extraction scripts used for the initial migration. They
read from `/tmp/adc-scrape` and are not part of the build.

## Form

The contact form posts to [FormSubmit](https://formsubmit.co) at `hello@adc.dev`. The first
submission triggers a confirmation email to that address — activate it before relying on the form.

## Deployment

Push to `main`; `.github/workflows/deploy.yml` builds and publishes to GitHub Pages. `public/CNAME`
pins the custom domain to `www.adc.dev`.

### DNS cutover from Wix

Replace the Wix records at the apex/`www` with:

```
www    CNAME  <org>.github.io.
@      A      185.199.108.153
@      A      185.199.109.153
@      A      185.199.110.153
@      A      185.199.111.153
```

Then enable "Enforce HTTPS" in the repo's Pages settings.
