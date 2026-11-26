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
    
    // Check if the result is from local estimate mode and add a helpful message
    if (result.mode === 'local_estimate' && !result.dishTitle.includes('Local Estimate')) {
      // This means AI vision failed and fell back to local estimates
      result.disclaimer = 'AI vision analysis unavailable (configure GEMINI_API_KEY for live photo analysis). Using local estimates based on your description. Please review and adjust each item before saving.';
    }
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('[API/scan] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Analysis failed. Please try again.' }, { status: 400 });
  }
}
