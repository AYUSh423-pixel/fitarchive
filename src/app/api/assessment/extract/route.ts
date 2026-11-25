import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { resolveAiCredentials } from '@/lib/ai-engine';
import {
  processAssessmentPdf,
  processAssessmentPhoto,
  calculateBmiFormula,
} from '@/lib/assessment-pipeline';

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid upload payload.' }, { status: 400 });
    }

    const fileBase64 = String(body.fileBase64 || '');
    const fileName = String(body.fileName || 'report.pdf').toLowerCase();
    const mimeType = String(body.mimeType || 'application/pdf');
    const userHeight = body.currentHeightCm ? Number(body.currentHeightCm) : guard.db.profile.heightCm;
    const userWeight = body.currentWeightKg ? Number(body.currentWeightKg) : guard.db.profile.weightKg;

    if (!fileBase64) {
      return NextResponse.json({ error: 'No file data received.' }, { status: 400 });
    }

    const { apiKey, baseUrl, model } = resolveAiCredentials(guard.db.aiConfig);

    const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf');

    if (isPdf) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const extraction = await processAssessmentPdf(buffer, apiKey, baseUrl, model);

      // Recalculate BMI using standard scientific formula: weight (kg) / (height (m))^2
      const w = extraction.measurements.weightKg || userWeight;
      const h = extraction.measurements.heightCm || userHeight;
      const calculatedBmi = calculateBmiFormula(w, h);

      if (calculatedBmi > 0) {
        extraction.measurements.calculatedBmi = calculatedBmi;
        if (!extraction.measurements.weightKg && w > 0) extraction.measurements.weightKg = w;
        if (!extraction.measurements.heightCm && h > 0) extraction.measurements.heightCm = h;

        if (extraction.measurements.reportedBmi) {
          const diff = Math.abs(extraction.measurements.reportedBmi - calculatedBmi);
          extraction.validation.bmiMatchesReport = diff <= 0.3;
          if (diff > 0.3) {
            extraction.validation.discrepancyNote = `Report printed BMI is ${extraction.measurements.reportedBmi}, but standard scientific calculation (weight ÷ height²) is ${calculatedBmi} (difference of ${diff.toFixed(1)}). Please verify height & weight.`;
          }
        }
      }

      return NextResponse.json({
        success: true,
        extraction,
        audit: {
          formulaUsed: 'BMI = weight (kg) / (height (m))^2',
          evaluatedAt: new Date().toISOString(),
          sourceFile: fileName,
        },
      });
    }

    // Photo flow (JPG / PNG)
    const extraction = await processAssessmentPhoto(
      fileBase64,
      mimeType,
      userHeight,
      userWeight,
      apiKey,
      baseUrl,
      model
    );

    return NextResponse.json({
      success: true,
      extraction,
      audit: {
        formulaUsed: 'BMI = weight (kg) / (height (m))^2',
        evaluatedAt: new Date().toISOString(),
        sourceFile: fileName,
        note: 'Photos cannot determine scale weight. Required manual confirmation.',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
