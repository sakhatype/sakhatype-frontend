import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

/** После сборки: абсолютные og:image / canonical при VITE_SITE_URL (Docker и прод). */
function embedAbsoluteSeoUrls(siteUrl) {
  return {
    name: 'embed-absolute-seo-urls',
    enforce: 'post',
    apply: 'build',
    closeBundle() {
      const indexPath = path.resolve('build/index.html');
      if (!fs.existsSync(indexPath)) return;

      let html = fs.readFileSync(indexPath, 'utf8');
      const base = (siteUrl || '').replace(/\/$/, '');
      if (!base) return;

      const absImg = `${base}/og-image.png`;
      html = html.replaceAll('content="/og-image.png"', `content="${absImg}"`);

      if (!html.includes('rel="canonical"')) {
        html = html.replace(
          '<title>Sakhatype</title>',
          `<title>Sakhatype</title>\n    <link rel="canonical" href="${base}" />\n    <meta property="og:url" content="${base}" />`
        );
      }

      fs.writeFileSync(indexPath, html);
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = env.VITE_SITE_URL || '';

  return {
    plugins: [sveltekit(), embedAbsoluteSeoUrls(siteUrl)],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        },
        '/api/arena/ws': {
          target: 'ws://localhost:8000',
          ws: true
        }
      }
    }
  };
});
