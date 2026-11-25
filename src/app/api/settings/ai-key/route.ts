import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/api-guard';

const ENV_LOCAL_PATH = path.join(process.cwd(), '.env.local');

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const currentKey = process.env.GEMINI_API_KEY || '';
  return NextResponse.json({
    configured: Boolean(currentKey),
    maskedKey: currentKey ? `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}` : '',
  });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const apiKey = String(body.apiKey || '').trim();

    // Update in-memory runtime
    process.env.GEMINI_API_KEY = apiKey;

    // Persist to .env.local
    let content = '';
    if (fs.existsSync(ENV_LOCAL_PATH)) {
      content = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
    }

    if (content.includes('GEMINI_API_KEY=')) {
      content = content.replace(/GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${apiKey}`);
    } else {
      content += `\nGEMINI_API_KEY=${apiKey}\n`;
    }

    fs.writeFileSync(ENV_LOCAL_PATH, content, 'utf8');

    return NextResponse.json({
      ok: true,
      configured: Boolean(apiKey),
      maskedKey: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : '',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
