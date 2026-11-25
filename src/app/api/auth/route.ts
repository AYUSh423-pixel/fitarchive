import { NextResponse } from 'next/server';
import {
  clearServerSessionCookie,
  getServerSession,
  hashPassword,
  setServerSessionCookie,
  verifyPassword,
} from '@/lib/auth';
import { readDatabase, updateDatabase } from '@/lib/db/local-store';

export async function GET() {
  const session = await getServerSession();
  const db = readDatabase();
  return NextResponse.json({
    authenticated: Boolean(session && session.userId === db.auth.userId),
    email: session?.email ?? null,
    onboardingCompleted: db.profile.onboardingCompleted,
    name: db.profile.name,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as 'login' | 'quick_personal' | 'signup' | 'logout' | 'change_password';
    const db = readDatabase();

    if (action === 'logout') {
      await clearServerSessionCookie();
      return NextResponse.json({ ok: true, authenticated: false });
    }

    if (action === 'quick_personal') {
      await setServerSessionCookie({
        userId: db.auth.userId,
        email: db.auth.email,
        iat: Date.now(),
      });
      return NextResponse.json({ ok: true, authenticated: true, email: db.auth.email });
    }

    if (action === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }
      if (email !== db.auth.email.toLowerCase() || !verifyPassword(password, db.auth.passwordHash)) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }
      await setServerSessionCookie({
        userId: db.auth.userId,
        email: db.auth.email,
        iat: Date.now(),
      });
      return NextResponse.json({ ok: true, authenticated: true, email: db.auth.email });
    }

    if (action === 'signup') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || db.profile.name).trim();
      if (!email || password.length < 6) {
        return NextResponse.json({ error: 'Valid email and password (6+ chars) required.' }, { status: 400 });
      }
      updateDatabase((draft) => {
        draft.auth.email = email;
        draft.auth.passwordHash = hashPassword(password);
        draft.profile.email = email;
        if (name) draft.profile.name = name;
        draft.profile.updatedAt = new Date().toISOString();
      });
      await setServerSessionCookie({
        userId: db.auth.userId,
        email,
        iat: Date.now(),
      });
      return NextResponse.json({ ok: true, authenticated: true, email });
    }

    if (action === 'change_password') {
      const session = await getServerSession();
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const newPassword = String(body.newPassword || '');
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }
      updateDatabase((draft) => {
        draft.auth.passwordHash = hashPassword(newPassword);
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported auth action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
