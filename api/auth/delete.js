import { getDb, saveDb, hashPassword, setCors } from './_db.js';

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
    const password = (body.password || '').trim();

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
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Ошибка удаления аккаунта' });
  }
}
