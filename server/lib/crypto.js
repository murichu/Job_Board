import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = process.env.SECRET_ENCRYPTION_KEY; // must be 32 bytes (base64 or utf-8)

if (!KEY) {
  console.warn('SECRET_ENCRYPTION_KEY is not set - calendar tokens will not be encrypted securely');
}

export function encrypt(text) {
  if (!KEY) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY, 'utf-8').slice(0,32), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const ivBase64 = iv.toString('base64');
  return `${ivBase64}:${encrypted}`;
}

export function decrypt(data) {
  if (!KEY) return data;
  if (!data) return null;
  const parts = data.split(':');
  if (parts.length !== 2) return null;
  const iv = Buffer.from(parts[0], 'base64');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY, 'utf-8').slice(0,32), iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
