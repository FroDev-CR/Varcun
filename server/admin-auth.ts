import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const parameters = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, parameters, (error, key) => error ? reject(error) : resolve(key)));
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$32768$8$3$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string | null) {
  const match = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(hash ?? '');
  const actual = await derive(password, match?.[1] ?? '0'.repeat(32));
  const expected = Buffer.from(match?.[2] ?? '0'.repeat(128), 'hex');
  return timingSafeEqual(actual, expected) && Boolean(match);
}
export const SESSION_MS = 8 * 60 * 60 * 1000;
export function newSession(passwordHash: string) {
  const token = randomBytes(32).toString('hex');
  return { token, token_hash: digest(token), credential_version: digest(passwordHash), expires_at: new Date(Date.now() + SESSION_MS).toISOString() };
}
export function sessionCookie(requestCookies: string | undefined, name: string) {
  const value = (requestCookies ?? '').split(';').map(item => item.trim()).find(item => item.startsWith(`${name}=`))?.slice(name.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export const passwordSchema = z.string().min(12, 'Usa al menos 12 caracteres.').max(128).refine(value => !/[\u0000-\u001f]/.test(value));
export const loginSchema = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()), password: z.string().min(1).max(128) }).strict();
export const setupSchema = loginSchema.extend({ password: passwordSchema, token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();
export const passwordChangeSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema }).strict();
export const quoteStatuses = ['nueva', 'en_revision', 'respondida', 'cerrada'] as const;
export const quoteUpdateSchema = z.object({ status: z.enum(quoteStatuses), internal_notes: z.string().trim().max(4000), expectedUpdatedAt: z.iso.datetime({ offset: true }) }).strict();
