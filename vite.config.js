import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin: inject dynamic canonical <link> into each entry point
function canonicalPlugin() {
    const BASE_URL = 'https://ledlink.co.il';

  const entryCanonicals = {
        'index.html':   `${BASE_URL}/`,
        'catalog.html': `${BASE_URL}/catalog.html`,
        'guides.html':  `${BASE_URL}/guides.html`,
        'tools.html':   `${BASE_URL}/tools.html`,
  };

  return {
        name: 'inject-canonical',
        transformIndexHtml(html, ctx) {
                const filename = ctx.filename?.split('/').pop() || '';
                const canonical = entryCanonicals[filename];
                if (!canonical) return html;

          // Remove any existing canonical tags first (cleanup)
          html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');

          // Inject fresh canonical right after <head>
          return html.replace(
                    '<head>',
                    `<head>\n    <link rel="canonical" href="${canonical}">`
                  );
        },
  };
}

export default defineConfig({
    plugins: [react(), canonicalPlugin()],
    base: '/',
    build: {
          outDir: 'dist',
          rollupOptions: {
                  input: {
                            catalog: 'catalog.html',
                            index:   'index.html',
                            guides:  'guides.html',
                            tools:   'tools.html',
                  },
          },
    },
});
