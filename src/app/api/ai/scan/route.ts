import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { analyzeFoodPhoto } from '@/lib/ai-engine';

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid or oversized image payload. Please add a short food description or try taking a closer photo.' },
        { status: 400 }
      );
    }

    const base64Image = String(body.imageBase64 || '');
    const mimeType = String(body.mimeType || 'image/jpeg');
    const hintText = body.hintText ? String(body.hintText) : undefined;

    // Never saves unconfirmed AI estimates to food_logs; returns candidate items for user confirmation
    const result = await analyzeFoodPhoto(base64Image, mimeType, guard.db.foods, hintText, guard.db.aiConfig);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
