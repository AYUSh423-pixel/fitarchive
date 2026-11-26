import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { updateDatabase, DEFAULT_USER_ID } from '@/lib/db/local-store';
import { supabaseAdmin, isSupabaseEnabled } from '@/lib/db/supabase-client';
import { runDietitianChat } from '@/lib/ai-engine';
import type { AiMessage } from '@/types/nutrifit';
import { validateRequest, aiChatSchema } from '@/lib/validation';
import { logger, generateRequestId } from '@/lib/logger';
import { aiRateLimiter, applyRateLimit, getClientKey } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  const rateLimitResult = applyRateLimit(req, aiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;

    const headers = rateLimitResult?.headers || {};
    return NextResponse.json({
      messages: guard.db.aiConversations,
      aiConfigured: Boolean(
        guard.db.aiConfig?.apiKey ||
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.GROQ_API_KEY ||
        process.env.AI_API_KEY
      ),
      provider: guard.db.aiConfig?.provider || 'custom',
    }, { headers });
  } catch (err) {
    logger.error('AI Chat GET error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  // Apply stricter rate limiting for AI calls
  const rateLimitResult = applyRateLimit(req, aiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    logger.security('AI rate limit exceeded', { clientKey }, undefined, requestId);
    return NextResponse.json(
      { error: 'Too many AI requests. Please wait before sending more messages.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;

    // Validate request body
    const validation = await validateRequest(req, aiChatSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { message } = validation.data;
    const headers = rateLimitResult?.headers || {};

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

    // 1. If Supabase is enabled, save to user-isolated Supabase table
    if (isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID) {
      try {
        await supabaseAdmin.from('ai_conversations').insert([
          {
            user_id: guard.session.userId,
            role: 'user',
            content: message,
            metadata: {},
          },
          {
            user_id: guard.session.userId,
            role: 'assistant',
            content: reply,
            metadata: { mode },
          },
        ]);
      } catch (err) {
        logger.error('Failed to save message to Supabase ai_conversations', { error: err }, guard.session.userId, requestId);
      }
    }

    // 2. Also keep local copy updated with userId attached
    updateDatabase((draft) => {
      draft.aiConversations.push(userMsg, assistantMsg);
    });

    logger.audit('AI chat message', { messageLength: message.length, mode }, guard.session.userId, requestId);
    return NextResponse.json({ userMsg, assistantMsg }, { headers });
  } catch (err) {
    logger.error('AI Chat POST error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimitResult?.headers || {} });
  }
}

export async function DELETE(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  const rateLimitResult = applyRateLimit(req, aiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;

    const headers = rateLimitResult?.headers || {};

    if (isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID) {
      try {
        await supabaseAdmin.from('ai_conversations').delete().eq('user_id', guard.session.userId);
      } catch (err) {
        logger.error('Failed to clear Supabase ai_conversations', { error: err }, guard.session.userId, requestId);
      }
    }

    updateDatabase((draft) => {
      draft.aiConversations = draft.aiConversations.filter((c) => c.userId !== guard.session.userId);
    });

    logger.audit('AI conversation cleared', {}, guard.session.userId, requestId);
    return NextResponse.json({ ok: true }, { headers });
  } catch (err) {
    logger.error('AI Chat DELETE error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimitResult?.headers || {} });
  }
}