import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'questlog-backend-api',
        configureServer(server) {
          const dbPath = path.resolve(process.cwd(), 'data', 'accounts.json');

          function getDb(): { accounts: any[] } {
            try {
              if (fs.existsSync(dbPath)) {
                const raw = fs.readFileSync(dbPath, 'utf-8');
                return JSON.parse(raw);
              }
            } catch (e) {
              console.error('Error reading db:', e);
            }
            return { accounts: [] };
          }

          function saveDb(data: { accounts: any[] }) {
            try {
              const dir = path.dirname(dbPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
            } catch (e) {
              console.error('Error saving db:', e);
            }
          }

          function parseJson(req: any): Promise<any> {
            return new Promise((resolve) => {
              let body = '';
              req.on('data', (chunk: Buffer) => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  resolve(body ? JSON.parse(body) : {});
                } catch {
                  resolve({});
                }
              });
            });
          }

          function hashPassword(password: string, salt: string): string {
            return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
          }

          server.middlewares.use(async (req, res, next) => {
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.end();
              return;
            }

            // 1. Calendar proxy
            if (req.url && req.url.startsWith('/api/calendar-proxy')) {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost');
                const targetUrl = parsedUrl.searchParams.get('url');
                if (!targetUrl) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
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
                res.end(text);
              } catch (err: unknown) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                const message = err instanceof Error ? err.message : 'Proxy fetch failed';
                res.end(JSON.stringify({ error: message }));
              }
              return;
            }

            // 2. Auth: Register
            if (req.url && req.url.startsWith('/api/auth/register') && req.method === 'POST') {
              try {
                const body = await parseJson(req);
                const username = (body.username || '').trim();
                const password = (body.password || '').trim();

                if (!username || username.length < 2) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Никнейм должен содержать не менее 2 символов' }));
                  return;
                }
                if (!password || password.length < 4) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Пароль должен содержать не менее 4 символов' }));
                  return;
                }

                const db = getDb();
                const existing = db.accounts.find(
                  (a) => a.username.toLowerCase() === username.toLowerCase()
                );
                if (existing) {
                  res.statusCode = 409;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: `Аккаунт с ником «${username}» уже существует. Войдите с паролем.` }));
                  return;
                }

                const salt = crypto.randomBytes(16).toString('hex');
                const hash = hashPassword(password, salt);
                const token = crypto.randomBytes(32).toString('hex');
                const now = Date.now();

                const newAccount = {
                  username,
                  salt,
                  hash,
                  token,
                  createdAt: now,
                  lastLoginAt: now,
                  data: body.initialData || {},
                };

                db.accounts.push(newAccount);
                saveDb(db);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  ok: true,
                  username,
                  token,
                  data: newAccount.data,
                }));
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message || 'Ошибка регистрации' }));
              }
              return;
            }

            // 3. Auth: Login
            if (req.url && req.url.startsWith('/api/auth/login') && req.method === 'POST') {
              try {
                const body = await parseJson(req);
                const username = (body.username || '').trim();
                const password = (body.password || '').trim();

                if (!username) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Введите никнейм' }));
                  return;
                }
                if (!password) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Введите пароль' }));
                  return;
                }

                const db = getDb();
                const account = db.accounts.find(
                  (a) => a.username.toLowerCase() === username.toLowerCase()
                );
                if (!account) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: `Аккаунт «${username}» не найден. Зарегистрируйтесь, если у вас еще нет аккаунта.` }));
                  return;
                }

                const computed = hashPassword(password, account.salt);
                if (computed !== account.hash) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Неверный пароль. Попробуйте снова.' }));
                  return;
                }

                // Generate new session token
                const token = crypto.randomBytes(32).toString('hex');
                account.token = token;
                account.lastLoginAt = Date.now();
                saveDb(db);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  ok: true,
                  username: account.username,
                  token,
                  data: account.data || null,
                }));
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message || 'Ошибка входа' }));
              }
              return;
            }

            // 4. Auth: Sync Data (Cloud persistence across devices)
            if (req.url && req.url.startsWith('/api/auth/sync') && req.method === 'POST') {
              try {
                const body = await parseJson(req);
                const username = (body.username || '').trim();
                const token = (body.token || '').trim();

                const db = getDb();
                const account = db.accounts.find(
                  (a) => a.username.toLowerCase() === username.toLowerCase()
                );

                if (!account) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Аккаунт не найден на сервере' }));
                  return;
                }

                // If token is provided, verify it (or allow sync for same user)
                if (token && account.token && account.token !== token) {
                  // Token expired or mismatch
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Сессия истекла. Пожалуйста, войдите снова.' }));
                  return;
                }

                if (body.data) {
                  account.data = body.data;
                }
                account.lastLoginAt = Date.now();
                saveDb(db);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true, timestamp: Date.now() }));
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message || 'Ошибка синхронизации' }));
              }
              return;
            }

            // 5. Auth: Get User Cloud Data (on app load or device switch)
            if (req.url && req.url.startsWith('/api/auth/user') && req.method === 'GET') {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost');
                const username = parsedUrl.searchParams.get('username') || '';
                const token = parsedUrl.searchParams.get('token') || '';

                const db = getDb();
                const account = db.accounts.find(
                  (a) => a.username.toLowerCase() === username.toLowerCase()
                );

                if (!account) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Пользователь не найден' }));
                  return;
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  ok: true,
                  username: account.username,
                  data: account.data || null,
                  lastLoginAt: account.lastLoginAt,
                }));
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message || 'Ошибка загрузки данных' }));
              }
              return;
            }

            // 6. Auth: List registered accounts (for switcher)
            if (req.url && req.url.startsWith('/api/auth/accounts') && req.method === 'GET') {
              try {
                const db = getDb();
                const publicAccounts = db.accounts.map((a) => ({
                  username: a.username,
                  createdAt: a.createdAt,
                  lastLoginAt: a.lastLoginAt,
                  isCloud: true,
                }));

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ accounts: publicAccounts }));
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message }));
              }
              return;
            }

            // 7. Auth: Delete Account
            if (req.url && req.url.startsWith('/api/auth/delete') && req.method === 'POST') {
              try {
                const body = await parseJson(req);
                const username = (body.username || '').trim();
                const password = (body.password || '').trim();

                const db = getDb();
                const index = db.accounts.findIndex(
                  (a) => a.username.toLowerCase() === username.toLowerCase()
                );
                if (index === -1) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Аккаунт не найден' }));
                  return;
                }

                // If password is provided, verify it
                if (password) {
                  const computed = hashPassword(password, db.accounts[index].salt);
                  if (computed !== db.accounts[index].hash) {
                    res.statusCode = 401;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Неверный пароль' }));
                    return;
                  }
                }

                db.accounts.splice(index, 1);
                saveDb(db);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message }));
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
