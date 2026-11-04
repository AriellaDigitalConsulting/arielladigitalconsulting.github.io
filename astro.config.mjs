import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import articles from './src/data/articles.json' with { type: 'json' };

// Under /news/ only the articles themselves belong in the sitemap; the old Wix URLs are noindex redirect stubs.
const newsPages = new Set(['/news/', ...articles.map((a) => `/news/${a.slug}/`)]);
const inSitemap = (page) => {
  const { pathname } = new URL(page);
  return !pathname.startsWith('/news/') || newsPages.has(pathname);
};

export default defineConfig({
  site: 'https://www.adc.dev',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  integrations: [sitemap({ filter: inSitemap })],
  redirects: {
    '/holiday-spirits-widget': '/holiday-spirits',
    '/search-enhancements': '/products',
    '/services': '/implementations',
    '/third-party-integrations': '/integrations',
  },
});
