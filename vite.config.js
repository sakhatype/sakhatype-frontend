import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

/** Дефолтный прод-домен в app.html; при другом VITE_SITE_URL подменяется после сборки. */
const BAKED_SITE_ORIGIN = 'https://sakhatype.ru';

function seoSiteOriginOverride(desiredOrigin) {
  return {
    name: 'seo-site-origin-override',
    enforce: 'post',
    apply: 'build',
    closeBundle() {
      const indexPath = path.resolve('build/index.html');
      if (!fs.existsSync(indexPath)) return;

      const target = (desiredOrigin || '').replace(/\/$/, '');
      if (!target || target === BAKED_SITE_ORIGIN) return;

      let html = fs.readFileSync(indexPath, 'utf8');
      html = html.replaceAll(BAKED_SITE_ORIGIN, target);
      fs.writeFileSync(indexPath, html);
    }
  };
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const siteUrl = (process.env.VITE_SITE_URL || fileEnv.VITE_SITE_URL || '').trim();

  const apiProxy = {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true
    },
    '/api/arena/ws': {
      target: 'ws://localhost:8000',
      ws: true
    }
  };

  return {
    plugins: [sveltekit(), seoSiteOriginOverride(siteUrl)],
    server: {
      proxy: { ...apiProxy }
    },
    preview: {
      proxy: { ...apiProxy }
    }
  };
});
