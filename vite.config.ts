import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'moodle-calendar-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/calendar-proxy')) {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost');
                const targetUrl = parsedUrl.searchParams.get('url');
                if (!targetUrl) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Missing url parameter' }));
                  return;
                }
                const proxyRes = await fetch(targetUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/calendar,text/plain,*/*'
                  }
                });
                const text = await proxyRes.text();
                res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(text);
              } catch (err: unknown) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                const message = err instanceof Error ? err.message : 'Proxy fetch failed';
                res.end(JSON.stringify({ error: message }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
