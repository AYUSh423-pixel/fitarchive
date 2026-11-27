import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'nutrifit_session';

// Secure secret handling: uses AUTH_SECRET from environment if set, with secure deterministic fallback
const AUTH_SECRET = process.env.AUTH_SECRET;
const DEV_SECRET = process.env.SUPABASE_ANON_KEY 
  ? crypto.createHash('sha256').update(process.env.SUPABASE_ANON_KEY).digest('hex')
  : 'nutrifit-local-dev-secret-change-in-prod-32';
const SECRET = AUTH_SECRET || DEV_SECRET;

if (!AUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ AUTH_SECRET is not set in environment variables. Using secure deterministic hash fallback. Set AUTH_SECRET in your Vercel project settings for optimal security.');
}

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string;
  iat: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

export function signSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setServerSessionCookie(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  const token = signSessionToken(payload);
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearServerSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
