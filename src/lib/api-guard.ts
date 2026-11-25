import { NextResponse } from 'next/server';
import { getServerSession, type SessionPayload } from '@/lib/auth';
import { readDatabase } from '@/lib/db/local-store';
import type { DatabaseState } from '@/types/nutrifit';

export async function requireAuth(): Promise<
  { session: SessionPayload; db: DatabaseState; error?: never } | { error: NextResponse; session?: never; db?: never }
> {
  const session = await getServerSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 }),
    };
  }
  const db = readDatabase();
  if (db.auth.userId !== session.userId) {
    return {
      error: NextResponse.json({ error: 'Forbidden: private user data.' }, { status: 403 }),
    };
  }
  return { session, db };
}
