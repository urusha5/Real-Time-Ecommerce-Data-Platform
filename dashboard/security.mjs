import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const digest = value => createHash('sha256').update(String(value)).digest('hex');
export const equal = (a, b) => timingSafeEqual(Buffer.from(digest(a), 'hex'), Buffer.from(digest(b), 'hex'));
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 14 || password.length > 256) throw new Error('Use a password between 14 and 256 characters.');
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const [, salt, expected] = encoded.split('$');
  const actual = await scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export function cookieName(config) { return config.production ? '__Host-commerce_session' : 'commerce_session'; }
export function sessionToken(req, config) {
  const cookie = String(req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName(config)}=`));
  const token = cookie?.slice(cookie.indexOf('=') + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function newSession(repository, config) {
  const token = randomBytes(32).toString('hex');
  await repository.putSession(digest(token), { username: config.admin, expiresAt: Date.now() + config.sessionSeconds * 1000 });
  return token;
}
export function sessionCookie(config, token = '') {
  return `${cookieName(config)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token ? config.sessionSeconds : 0}${config.production ? '; Secure' : ''}`;
}
export async function readJSON(req, maxBytes = 131072) {
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Content-Type must be application/json.');
  if (Number(req.headers['content-length']) > maxBytes) throw new HttpError(413, 'Request body is too large.');
  const parts = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > maxBytes) throw new HttpError(413, 'Request body is too large.'); parts.push(chunk); }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); } catch { throw new HttpError(400, 'Invalid JSON body.'); }
}
export function requireOrigin(req, config) {
  if (req.headers.origin !== config.origin || req.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Request origin is not allowed.');
}
export class RateLimiter {
  constructor(limit, windowMs, maxKeys = 10000) { this.limit = limit; this.windowMs = windowMs; this.maxKeys = maxKeys; this.entries = new Map(); }
  take(key, now = Date.now()) {
    let entry = this.entries.get(key);
    if (!entry || entry.reset <= now) {
      if (this.entries.size >= this.maxKeys) for (const [id, value] of this.entries) if (value.reset <= now) this.entries.delete(id);
      if (!entry && this.entries.size >= this.maxKeys) return false;
      entry = { count: 0, reset: now + this.windowMs }; this.entries.set(key, entry);
    }
    entry.count++; return entry.count <= this.limit;
  }
}
