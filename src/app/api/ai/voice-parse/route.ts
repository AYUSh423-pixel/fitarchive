import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { parseNaturalLanguageFood } from '@/lib/ai-engine';

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const transcript = String(body.transcript || '').trim();
    if (!transcript) {
      return NextResponse.json({ error: 'Please speak or type what you ate.' }, { status: 400 });
    }
    const result = parseNaturalLanguageFood(transcript, guard.db.foods);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
