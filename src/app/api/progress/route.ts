import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/api-guard';
import { todayIsoDate, updateDatabase, UPLOADS_DIR, DEFAULT_USER_ID } from '@/lib/db/local-store';
import { calculateBmi, calculateBmr, calculateTee, evaluateWeeklyProgress } from '@/lib/nutrition-engine';
import type { BodyMeasurement, BodyScan, ProgressPhoto } from '@/types/nutrifit';
import { supabaseAdmin, isSupabaseEnabled } from '@/lib/db/supabase-client';

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { db } = guard;

  const weeklyEvaluation = evaluateWeeklyProgress(db.bodyMeasurements, db.nutritionTargets);

  return NextResponse.json({
    profile: db.profile,
    bodyScans: db.bodyScans,
    measurements: db.bodyMeasurements,
    progressPhotos: db.progressPhotos,
    workoutLogs: db.workoutLogs,
    foodLogsCountByDate: db.foodLogs.reduce<Record<string, number>>((acc, l) => {
      acc[l.logDate] = (acc[l.logDate] || 0) + 1;
      return acc;
    }, {}),
    weeklyEvaluation,
  });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const kind = body.kind as 'measurement' | 'body_scan' | 'progress_photo';

    if (kind === 'progress_photo') {
      const base64 = String(body.imageBase64 || '');
      if (!base64) return NextResponse.json({ error: 'Image required.' }, { status: 400 });
      const filename = `progress-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.jpg`;
      const dir = path.join(UPLOADS_DIR, 'progress');
      let photoUrl = `data:image/jpeg;base64,${base64}`;

      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, filename), Buffer.from(base64, 'base64'));
        photoUrl = `/api/files/progress/${filename}`;
      } catch {
        // Fallback to data URI in serverless read-only environments
      }

      const photo: ProgressPhoto = {
        id: `photo-${crypto.randomBytes(4).toString('hex')}`,
        userId: guard.session.userId,
        photoDate: String(body.photoDate || todayIsoDate()),
        pose: body.pose || 'front',
        url: photoUrl,
        milestoneDay: body.milestoneDay ? Number(body.milestoneDay) : undefined,
        notes: body.notes ? String(body.notes) : undefined,
        createdAt: new Date().toISOString(),
      };
      updateDatabase((draft) => {
        draft.progressPhotos.unshift(photo);
      });
      return NextResponse.json({ photo }, { status: 201 });
    }

    if (kind === 'body_scan') {
      const weightKg = Number(body.weightKg);
      const heightCm = body.heightCm ? Number(body.heightCm) : guard.db.profile.heightCm;
      const reportedBmi = body.reportedBmi ? Number(body.reportedBmi) : undefined;
      const calculatedBmi = calculateBmi(weightKg, heightCm);
      const bmi = reportedBmi || calculatedBmi;
      const bmrKcal = body.bmrKcal
        ? Number(body.bmrKcal)
        : calculateBmr(weightKg, heightCm, guard.db.profile.age, guard.db.profile.gender);
      const teeKcal = body.teeKcal ? Number(body.teeKcal) : calculateTee(bmrKcal, guard.db.profile.activityLevel);

      let reportUrl: string | undefined;
      if (body.reportBase64) {
        const ext = body.reportMime === 'application/pdf' ? 'pdf' : 'jpg';
        const filename = `scan-${Date.now()}.${ext}`;
        const dir = path.join(UPLOADS_DIR, 'scans');
        reportUrl = `data:${body.reportMime || 'application/pdf'};base64,${body.reportBase64}`;
        try {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, filename), Buffer.from(String(body.reportBase64), 'base64'));
          reportUrl = `/api/files/scans/${filename}`;
        } catch {
          // Fallback to data URI in serverless read-only environments
        }
      }

      const scan: BodyScan = {
        id: `scan-${crypto.randomBytes(4).toString('hex')}`,
        userId: guard.session.userId,
        scanDate: String(body.scanDate || todayIsoDate()),
        deviceName: String(body.deviceName || 'EVOLT 360'),
        weightKg,
        heightCm,
        bmi,
        reportedBmi,
        calculatedBmi,
        fileType: body.fileType || 'pdf_report',
        rawExtractedJson: body.rawExtractedJson || null,
        validationStatus: body.validationStatus || 'verified',
        bodyFatPct: Number(body.bodyFatPct || guard.db.profile.bodyFatPct),
        skeletalMuscleMassKg: Number(body.skeletalMuscleMassKg || guard.db.profile.skeletalMuscleMassKg),
        waistCm: Number(body.waistCm || guard.db.profile.waistCm),
        visceralFatLevel: Number(body.visceralFatLevel || guard.db.profile.visceralFatLevel),
        bmrKcal,
        teeKcal,
        reportUrl,
        notes: body.notes ? String(body.notes) : 'Verified body composition assessment.',
        createdAt: new Date().toISOString(),
      };

      // 1. If Supabase user, persist directly to Supabase PostgreSQL
      if (isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID) {
        try {
          await supabaseAdmin.from('body_scans').insert({
            id: scan.id,
            user_id: guard.session.userId,
            scan_date: scan.scanDate,
            device_name: scan.deviceName,
            weight_kg: scan.weightKg,
            height_cm: scan.heightCm,
            bmi: scan.bmi,
            reported_bmi: scan.reportedBmi,
            calculated_bmi: scan.calculatedBmi,
            body_fat_pct: scan.bodyFatPct,
            skeletal_muscle_mass_kg: scan.skeletalMuscleMassKg,
            waist_cm: scan.waistCm,
            visceral_fat_level: scan.visceralFatLevel,
            bmr_kcal: scan.bmrKcal,
            tee_kcal: scan.teeKcal,
            report_url: scan.reportUrl,
            notes: scan.notes,
            file_type: scan.fileType,
            raw_extracted_json: scan.rawExtractedJson,
            validation_status: scan.validationStatus,
          });

          await supabaseAdmin.from('user_profiles').update({
            weight_kg: scan.weightKg,
            height_cm: scan.heightCm,
            bmi: scan.bmi,
            body_fat_pct: scan.bodyFatPct,
            skeletal_muscle_mass_kg: scan.skeletalMuscleMassKg,
            waist_cm: scan.waistCm,
            visceral_fat_level: scan.visceralFatLevel,
            bmr_kcal: scan.bmrKcal,
            tee_kcal: scan.teeKcal,
            updated_at: new Date().toISOString(),
          }).eq('id', guard.session.userId);
        } catch (supaErr) {
          console.error('Failed to sync body scan to Supabase:', supaErr);
        }
      }

      // 2. Also keep local state updated
      updateDatabase((draft) => {
        draft.bodyScans.unshift(scan);
        draft.bodyMeasurements.unshift({
          id: `meas-${crypto.randomBytes(4).toString('hex')}`,
          userId: guard.session.userId,
          measuredDate: scan.scanDate,
          weightKg: scan.weightKg,
          waistCm: scan.waistCm,
          bodyFatPct: scan.bodyFatPct,
          skeletalMuscleMassKg: scan.skeletalMuscleMassKg,
          visceralFatLevel: scan.visceralFatLevel,
          notes: `${scan.deviceName} Scan`,
          createdAt: scan.createdAt,
        });
        draft.profile = {
          ...draft.profile,
          weightKg: scan.weightKg,
          heightCm: scan.heightCm || draft.profile.heightCm,
          bmi: scan.bmi,
          bodyFatPct: scan.bodyFatPct,
          skeletalMuscleMassKg: scan.skeletalMuscleMassKg,
          waistCm: scan.waistCm,
          visceralFatLevel: scan.visceralFatLevel,
          bmrKcal: scan.bmrKcal,
          teeKcal: scan.teeKcal,
          updatedAt: new Date().toISOString(),
        };
      });
      return NextResponse.json({ scan }, { status: 201 });
    }

    // Standard measurement entry
    const meas: BodyMeasurement = {
      id: `meas-${crypto.randomBytes(4).toString('hex')}`,
      userId: guard.session.userId,
      measuredDate: String(body.measuredDate || todayIsoDate()),
      weightKg: Number(body.weightKg),
      waistCm: body.waistCm ? Number(body.waistCm) : undefined,
      bodyFatPct: body.bodyFatPct ? Number(body.bodyFatPct) : undefined,
      skeletalMuscleMassKg: body.skeletalMuscleMassKg ? Number(body.skeletalMuscleMassKg) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      createdAt: new Date().toISOString(),
    };

    updateDatabase((draft) => {
      draft.bodyMeasurements.unshift(meas);
      draft.profile.weightKg = meas.weightKg;
      draft.profile.bmi = calculateBmi(meas.weightKg, draft.profile.heightCm);
      if (meas.waistCm) draft.profile.waistCm = meas.waistCm;
      draft.profile.updatedAt = new Date().toISOString();
    });

    return NextResponse.json({ measurement: meas }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
