import crypto from 'crypto';
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

    return res.status(200).json({
      ok: true,
      username: account.username,
      token,
      data: account.data || null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Ошибка входа' });
  }
}
