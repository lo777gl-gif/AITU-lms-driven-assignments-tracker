import { getDb, saveDb, setCors } from './_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const username = (body.username || '').trim();
    const token = (body.token || '').trim();

    const db = getDb();
    const account = db.accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
    if (!account) {
      return res.status(404).json({ error: 'Аккаунт не найден на сервере' });
    }

    if (token && account.token && account.token !== token) {
      return res.status(401).json({ error: 'Сессия истекла. Пожалуйста, войдите снова.' });
    }

    if (body.data) {
      account.data = body.data;
    }
    account.lastLoginAt = Date.now();
    saveDb(db);

    return res.status(200).json({ ok: true, timestamp: Date.now() });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Ошибка синхронизации' });
  }
}
