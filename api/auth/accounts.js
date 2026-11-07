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
    const db = getDb();
    const publicAccounts = db.accounts.map((a) => ({
      username: a.username,
      createdAt: a.createdAt,
      lastLoginAt: a.lastLoginAt,
      isCloud: true,
    }));
    return res.status(200).json({ accounts: publicAccounts });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Ошибка списка аккаунтов' });
  }
}
