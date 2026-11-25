import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/api-guard';
import { updateDatabase } from '@/lib/db/local-store';
import type { AiConfig, AiProvider } from '@/types/nutrifit';

const ENV_LOCAL_PATH = path.join(process.cwd(), '.env.local');

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const dbConfig = guard.db.aiConfig;
  const currentKey = dbConfig?.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
  const provider = dbConfig?.provider || (process.env.OPENAI_API_KEY ? 'openai' : 'gemini');
  const model = dbConfig?.model || (provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
  const baseUrl = dbConfig?.baseUrl || '';

  return NextResponse.json({
    provider,
    model,
    baseUrl,
    configured: Boolean(currentKey),
    maskedKey: currentKey ? `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}` : '',
  });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const provider = (body.provider || 'gemini') as AiProvider;
    const apiKey = String(body.apiKey || '').trim();
    const model = String(body.model || '').trim() || (provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');
    const baseUrl = String(body.baseUrl || '').trim();

    // Update in-memory runtime
    if (provider === 'gemini') {
      process.env.GEMINI_API_KEY = apiKey;
      process.env.GEMINI_MODEL = model;
    } else if (provider === 'openai') {
      process.env.OPENAI_API_KEY = apiKey;
    }

    const newConfig: AiConfig = {
      provider,
      apiKey,
      model,
      baseUrl,
      configured: Boolean(apiKey),
    };

    // Update database state
    updateDatabase((draft) => {
      draft.aiConfig = newConfig;
    });

    // Try persisting to .env.local if file system is writable
    try {
      let content = '';
      if (fs.existsSync(ENV_LOCAL_PATH)) {
        content = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
      }

      const keyName = provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY';
      if (content.includes(`${keyName}=`)) {
        content = content.replace(new RegExp(`${keyName}=.*$`, 'm'), `${keyName}=${apiKey}`);
      } else {
        content += `\n${keyName}=${apiKey}\n`;
      }
      fs.writeFileSync(ENV_LOCAL_PATH, content, 'utf8');
    } catch {
      // In serverless, memory update is maintained
    }

    return NextResponse.json({
      ok: true,
      provider,
      model,
      baseUrl,
      configured: Boolean(apiKey),
      maskedKey: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : '',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
