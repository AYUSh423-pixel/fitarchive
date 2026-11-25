import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/api-guard';
import { UPLOADS_DIR } from '@/lib/db/local-store';

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const { path: segments } = await context.params;
  const safeRelative = segments.join('/');
  if (safeRelative.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const fullPath = path.join(UPLOADS_DIR, safeRelative);
  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const bytes = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
