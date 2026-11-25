import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/api-guard';
import { todayIsoDate, updateDatabase, UPLOADS_DIR } from '@/lib/db/local-store';
import { calculateBmi, calculateBmr, calculateTee, evaluateWeeklyProgress } from '@/lib/nutrition-engine';
import type { BodyMeasurement, BodyScan, ProgressPhoto } from '@/types/nutrifit';

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
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), Buffer.from(base64, 'base64'));

      const photo: ProgressPhoto = {
        id: `photo-${crypto.randomBytes(4).toString('hex')}`,
        userId: guard.session.userId,
        photoDate: String(body.photoDate || todayIsoDate()),
        pose: body.pose || 'front',
        url: `/api/files/progress/${filename}`,
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
      const heightCm = guard.db.profile.heightCm;
      const bmi = body.bmi ? Number(body.bmi) : calculateBmi(weightKg, heightCm);
      const bmrKcal = body.bmrKcal
        ? Number(body.bmrKcal)
        : calculateBmr(weightKg, heightCm, guard.db.profile.age, guard.db.profile.gender);
      const teeKcal = body.teeKcal ? Number(body.teeKcal) : calculateTee(bmrKcal, guard.db.profile.activityLevel);

      let reportUrl: string | undefined;
      if (body.reportBase64) {
        const ext = body.reportMime === 'application/pdf' ? 'pdf' : 'jpg';
        const filename = `scan-${Date.now()}.${ext}`;
        const dir = path.join(UPLOADS_DIR, 'scans');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, filename), Buffer.from(String(body.reportBase64), 'base64'));
        reportUrl = `/api/files/scans/${filename}`;
      }

      const scan: BodyScan = {
        id: `scan-${crypto.randomBytes(4).toString('hex')}`,
        userId: guard.session.userId,
        scanDate: String(body.scanDate || todayIsoDate()),
        deviceName: String(body.deviceName || 'EVOLT 360'),
        weightKg,
        bmi,
        bodyFatPct: Number(body.bodyFatPct || guard.db.profile.bodyFatPct),
        skeletalMuscleMassKg: Number(body.skeletalMuscleMassKg || guard.db.profile.skeletalMuscleMassKg),
        waistCm: Number(body.waistCm || guard.db.profile.waistCm),
        visceralFatLevel: Number(body.visceralFatLevel || guard.db.profile.visceralFatLevel),
        bmrKcal,
        teeKcal,
        reportUrl,
        notes: body.notes ? String(body.notes) : 'Informational BIA estimate — not a medical diagnosis.',
        createdAt: new Date().toISOString(),
      };

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
