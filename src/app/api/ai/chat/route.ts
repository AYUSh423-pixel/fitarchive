import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { updateDatabase } from '@/lib/db/local-store';
import { runDietitianChat } from '@/lib/ai-engine';
import type { AiMessage } from '@/types/nutrifit';

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  return NextResponse.json({
    messages: guard.db.aiConversations,
    aiConfigured: Boolean(
      guard.db.aiConfig?.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.AI_API_KEY
    ),
    provider: guard.db.aiConfig?.provider || 'gemini',
  });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const userMsg = {
      id: `msg-${crypto.randomBytes(4).toString('hex')}`,
      userId: guard.session.userId,
      role: 'user' as const,
      content: message,
      createdAt: new Date().toISOString(),
    };

    const { reply, mode } = await runDietitianChat(message, guard.db);
    const assistantMsg: AiMessage = {
      id: `msg-${crypto.randomBytes(4).toString('hex')}`,
      userId: guard.session.userId,
      role: 'assistant' as const,
      content: reply,
      mode: mode as AiMessage['mode'],
      createdAt: new Date().toISOString(),
    };

    updateDatabase((draft) => {
      draft.aiConversations.push(userMsg, assistantMsg);
    });

    return NextResponse.json({ userMsg, assistantMsg });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  updateDatabase((draft) => {
    draft.aiConversations = draft.aiConversations.slice(0, 1);
  });
  return NextResponse.json({ ok: true });
}
