import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// In serverless environments like Vercel Lambda, the root is read-only and only /tmp is writable
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const dbDir = isServerless ? '/tmp' : path.resolve(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'accounts.json');

export function getDb() {
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

export function saveDb(data) {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db:', e);
  }
}

export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
