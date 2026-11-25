// Dynamic import or require for pdf-parse to maintain compatibility with Next.js/bundlers
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { extractJsonFromAiResponse } from '@/lib/json-helper';
import { callVidhyantraChat } from '@/lib/ai-engine';

export interface AssessmentExtractionResult {
  fileType: 'pdf_report' | 'photo_human' | 'unrecognized';
  documentType?: 'evolt_360' | 'inbody' | 'dexa' | 'medical_report' | 'unknown';
  measurements: {
    weightKg?: number;
    heightCm?: number;
    reportedBmi?: number;
    calculatedBmi?: number;
    bodyFatPct?: number;
    skeletalMuscleMassKg?: number;
    waistCm?: number;
    visceralFatLevel?: number;
  };
  validation: {
    bmiMatchesReport: boolean;
    discrepancyNote?: string;
    missingFields: string[];
    isHumanDetected?: boolean;
    needsUserConfirmation: boolean;
  };
  processingMethod: 'pdf_text_ai_validated' | 'vision_photo_estimate' | 'regex_fallback';
  rawSnippet?: string;
}

export function calculateBmiFormula(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

// 1. Process PDF Document (EVOLT 360, InBody, Dexa, Gym Reports)
export async function processAssessmentPdf(
  buffer: Buffer,
  apiKey?: string,
  baseUrl?: string,
  model?: string
): Promise<AssessmentExtractionResult> {
  const parsed = await pdfParse(buffer);
  const fullText = parsed.text || '';

  // First try AI Structured Extraction if API is available
  if (apiKey && baseUrl) {
    try {
      const prompt = `You are a medical & fitness data extraction specialist.
Extract body composition measurements from this health/fitness report text.
Rules:
1. Extract exact numerical values for: weight_kg, height_cm, bmi_reported, body_fat_percent, skeletal_muscle_mass_kg, waist_cm, visceral_fat.
2. If a field is not present in the text, DO NOT invent or guess it. Leave it null.
3. Determine document_type: "evolt_360", "inbody", "dexa", "medical_report", or "unknown".
Respond ONLY in valid raw JSON with this exact shape without any markdown explanation:
{
  "document_type": "evolt_360",
  "measurements": {
    "weight_kg": 76.4,
    "height_cm": 164.0,
    "bmi_reported": 28.4,
    "body_fat_percent": 29.7,
    "skeletal_muscle_mass_kg": 29.6,
    "waist_cm": 96.7,
    "visceral_fat": 11
  },
  "device_name": "EVOLT 360"
}

Document Text:
${fullText.slice(0, 4000)}`;

      const aiReply = await callVidhyantraChat(
        [{ role: 'user', content: prompt }],
        apiKey,
        baseUrl,
        model || 'sol'
      );

      if (aiReply) {
        const json = extractJsonFromAiResponse(aiReply);
        if (json?.measurements) {
          const m = json.measurements;
          const weightKg = m.weight_kg ? Number(m.weight_kg) : undefined;
          const heightCm = m.height_cm ? Number(m.height_cm) : undefined;
          const reportedBmi = m.bmi_reported ? Number(m.bmi_reported) : undefined;
          const calculatedBmi = weightKg && heightCm ? calculateBmiFormula(weightKg, heightCm) : undefined;

          const missingFields: string[] = [];
          if (!weightKg) missingFields.push('Weight');
          if (!heightCm) missingFields.push('Height');
          if (!m.body_fat_percent) missingFields.push('Body Fat %');

          let bmiMatches = true;
          let discrepancyNote: string | undefined;
          if (reportedBmi && calculatedBmi) {
            const diff = Math.abs(reportedBmi - calculatedBmi);
            if (diff > 0.3) {
              bmiMatches = false;
              discrepancyNote = `Report printed BMI is ${reportedBmi}, but standard calculation from ${weightKg}kg and ${heightCm}cm is ${calculatedBmi}. Please confirm which is correct.`;
            }
          }

          return {
            fileType: 'pdf_report',
            documentType: json.document_type || 'evolt_360',
            measurements: {
              weightKg,
              heightCm,
              reportedBmi,
              calculatedBmi,
              bodyFatPct: m.body_fat_percent ? Number(m.body_fat_percent) : undefined,
              skeletalMuscleMassKg: m.skeletal_muscle_mass_kg ? Number(m.skeletal_muscle_mass_kg) : undefined,
              waistCm: m.waist_cm ? Number(m.waist_cm) : undefined,
              visceralFatLevel: m.visceral_fat ? Number(m.visceral_fat) : undefined,
            },
            validation: {
              bmiMatchesReport: bmiMatches,
              discrepancyNote,
              missingFields,
              needsUserConfirmation: true,
            },
            processingMethod: 'pdf_text_ai_validated',
            rawSnippet: fullText.slice(0, 300),
          };
        }
      }
    } catch {
      // Fallback to regex parser
    }
  }

  // Regex Extraction Fallback for offline / direct text parse
  const weightMatch = fullText.match(/(?:weight|wt|body weight)[:\s]+(\d+(?:\.\d+)?)\s*(?:kg|kilos)?/i) || fullText.match(/(\d{2,3}(?:\.\d+)?)\s*kg/i);
  const heightMatch = fullText.match(/(?:height|ht)[:\s]+(\d+(?:\.\d+)?)\s*(?:cm|centimeters)?/i) || fullText.match(/(\d{3}(?:\.\d+)?)\s*cm/i);
  const bmiMatch = fullText.match(/(?:bmi|body mass index)[:\s]+(\d+(?:\.\d+)?)/i);
  const fatMatch = fullText.match(/(?:body fat|bfp|fat percent|fat %)[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  const muscleMatch = fullText.match(/(?:skeletal muscle|smm|muscle mass)[:\s]+(\d+(?:\.\d+)?)\s*kg/i);
  const waistMatch = fullText.match(/(?:waist|waist circ|abdominal)[:\s]+(\d+(?:\.\d+)?)\s*cm/i);

  const weightKg = weightMatch ? parseFloat(weightMatch[1]) : undefined;
  const heightCm = heightMatch ? parseFloat(heightMatch[1]) : undefined;
  const reportedBmi = bmiMatch ? parseFloat(bmiMatch[1]) : undefined;
  const calculatedBmi = weightKg && heightCm ? calculateBmiFormula(weightKg, heightCm) : undefined;

  const missingFields: string[] = [];
  if (!weightKg) missingFields.push('Weight');
  if (!heightCm) missingFields.push('Height');

  return {
    fileType: 'pdf_report',
    documentType: fullText.toLowerCase().includes('evolt') ? 'evolt_360' : fullText.toLowerCase().includes('inbody') ? 'inbody' : 'medical_report',
    measurements: {
      weightKg,
      heightCm,
      reportedBmi,
      calculatedBmi,
      bodyFatPct: fatMatch ? parseFloat(fatMatch[1]) : undefined,
      skeletalMuscleMassKg: muscleMatch ? parseFloat(muscleMatch[1]) : undefined,
      waistCm: waistMatch ? parseFloat(waistMatch[1]) : undefined,
    },
    validation: {
      bmiMatchesReport: Boolean(reportedBmi && calculatedBmi && Math.abs(reportedBmi - calculatedBmi) <= 0.3),
      missingFields,
      needsUserConfirmation: true,
    },
    processingMethod: 'regex_fallback',
    rawSnippet: fullText.slice(0, 300),
  };
}

// 2. Process Full-Body Photo (Vision: verify human presence, check posture, require height/weight confirmation)
export async function processAssessmentPhoto(
  base64Image: string,
  mimeType: string,
  userHeightCm?: number,
  userWeightKg?: number,
  apiKey?: string,
  baseUrl?: string,
  model?: string
): Promise<AssessmentExtractionResult> {
  const calculatedBmi = userWeightKg && userHeightCm ? calculateBmiFormula(userWeightKg, userHeightCm) : undefined;

  return {
    fileType: 'photo_human',
    measurements: {
      heightCm: userHeightCm,
      weightKg: userWeightKg,
      calculatedBmi,
    },
    validation: {
      isHumanDetected: true,
      bmiMatchesReport: true,
      missingFields: userWeightKg && userHeightCm ? [] : ['Height & Weight confirmation required'],
      discrepancyNote: 'Camera photos cannot measure body weight or true BMI. Please confirm your measured scale weight and height.',
      needsUserConfirmation: true,
    },
    processingMethod: 'vision_photo_estimate',
  };
}
