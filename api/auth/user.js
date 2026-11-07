import { getDb, setCors } from './_db.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Missing username parameter' });
    }

    const db = getDb();
    const account = db.accounts.find((a) => a.username.toLowerCase() === (username || '').toLowerCase());
    if (!account) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    return res.status(200).json({
      ok: true,
      username: account.username,
      data: account.data || null,
      lastLoginAt: account.lastLoginAt,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Ошибка загрузки данных' });
  }
}
