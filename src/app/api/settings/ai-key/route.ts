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
  const currentKey = dbConfig?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
  const provider = dbConfig?.provider || (process.env.AI_API_KEY ? 'custom' : process.env.OPENAI_API_KEY ? 'openai' : 'gemini');
  const model = dbConfig?.model || process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'custom' ? 'sol' : 'gpt-4o-mini');
  const baseUrl = dbConfig?.baseUrl || process.env.AI_BASE_URL || '';

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
    const model = String(body.model || '').trim() || (provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'groq' ? 'llama-3.3-70b-versatile' : provider === 'custom' ? 'sol' : 'gpt-4o-mini');
    const baseUrl = String(body.baseUrl || '').trim() || (provider === 'custom' ? 'https://www.vidhyantra.online/api/v1' : '');

    // Update in-memory runtime
    if (provider === 'gemini') {
      process.env.GEMINI_API_KEY = apiKey;
      process.env.GEMINI_MODEL = model;
    } else if (provider === 'openai') {
      process.env.OPENAI_API_KEY = apiKey;
    } else if (provider === 'custom') {
      process.env.AI_API_KEY = apiKey;
      process.env.AI_BASE_URL = baseUrl;
      process.env.AI_MODEL = model;
      process.env.AI_PROVIDER = 'custom';
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
