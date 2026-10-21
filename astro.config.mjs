import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.adc.dev',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  integrations: [sitemap()],
});
