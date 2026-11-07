import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

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

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// 1. Calendar proxy
app.get('/api/calendar-proxy', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  try {
    const proxyRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/calendar,text/plain,*/*',
      },
    });
    const text = await proxyRes.text();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    return res.status(200).send(text);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Proxy fetch failed' });
  }
});

// 2. Auth: Register
app.post('/api/auth/register', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();

  if (!username || username.length < 2) {
    return res.status(400).json({ error: 'Никнейм должен содержать не менее 2 символов' });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Пароль должен содержать не менее 4 символов' });
  }

  const db = getDb();
  const existing = db.accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: `Аккаунт с ником «${username}» уже существует. Войдите с паролем.` });
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
    data: req.body.initialData || {},
  };

  db.accounts.push(newAccount);
  saveDb(db);

  return res.json({
    ok: true,
    username,
    token,
    data: newAccount.data,
  });
});

// 3. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();

  if (!username) {
    return res.status(400).json({ error: 'Введите никнейм' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Введите пароль' });
  }

  const db = getDb();
  const account = db.accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
  if (!account) {
    return res.status(404).json({ error: `Аккаунт «${username}» не найден. Зарегистрируйтесь, если у вас еще нет аккаунта.` });
  }

  const computed = hashPassword(password, account.salt);
  if (computed !== account.hash) {
    return res.status(401).json({ error: 'Неверный пароль. Попробуйте снова.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  account.token = token;
  account.lastLoginAt = Date.now();
  saveDb(db);

  return res.json({
    ok: true,
    username: account.username,
    token,
    data: account.data || null,
  });
});

// 4. Auth: Sync Data
app.post('/api/auth/sync', (req, res) => {
  const username = (req.body.username || '').trim();
  const token = (req.body.token || '').trim();

  const db = getDb();
  const account = db.accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
  if (!account) {
    return res.status(404).json({ error: 'Аккаунт не найден на сервере' });
  }

  if (token && account.token && account.token !== token) {
    return res.status(401).json({ error: 'Сессия истекла. Пожалуйста, войдите снова.' });
  }

  if (req.body.data) {
    account.data = req.body.data;
  }
  account.lastLoginAt = Date.now();
  saveDb(db);

  return res.json({ ok: true, timestamp: Date.now() });
});

// 5. Auth: Get User Cloud Data
app.get('/api/auth/user', (req, res) => {
  const username = (req.query.username as string) || '';
  const db = getDb();
  const account = db.accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
  if (!account) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  return res.json({
    ok: true,
    username: account.username,
    data: account.data || null,
    lastLoginAt: account.lastLoginAt,
  });
});

// 6. Auth: List Accounts
app.get('/api/auth/accounts', (req, res) => {
  const db = getDb();
  const publicAccounts = db.accounts.map((a) => ({
    username: a.username,
    createdAt: a.createdAt,
    lastLoginAt: a.lastLoginAt,
    isCloud: true,
  }));
  return res.json({ accounts: publicAccounts });
});

// 7. Auth: Delete Account
app.post('/api/auth/delete', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();

  const db = getDb();
  const index = db.accounts.findIndex((a) => a.username.toLowerCase() === username.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: 'Аккаунт не найден' });
  }

  if (password) {
    const computed = hashPassword(password, db.accounts[index].salt);
    if (computed !== db.accounts[index].hash) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
  }

  db.accounts.splice(index, 1);
  saveDb(db);
  return res.json({ ok: true });
});

// Static files in production
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`QuestLog Server running on port ${PORT}`);
});
