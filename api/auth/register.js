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
      data: body.initialData || {},
    };

    db.accounts.push(newAccount);
    saveDb(db);

    return res.status(200).json({
      ok: true,
      username,
      token,
      data: newAccount.data,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Ошибка регистрации' });
  }
}
