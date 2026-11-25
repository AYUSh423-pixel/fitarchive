import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { todayIsoDate, updateDatabase } from '@/lib/db/local-store';
import type { HabitLog } from '@/types/nutrifit';

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayIsoDate();

  const waterLogs = guard.db.waterLogs.filter((w) => w.logDate === date);
  const totalWaterMl = waterLogs.reduce((s, w) => s + w.amountMl, 0);
  const habit = guard.db.habitLogs.find((h) => h.logDate === date) ?? {
    id: 'draft',
    userId: guard.session.userId,
    logDate: date,
    sleepHours: 7.5,
    steps: 0,
    workoutCompleted: false,
    mealsLoggedCompleted: guard.db.foodLogs.some((l) => l.logDate === date),
    proteinTargetHit: false,
    consistencyScore: 0,
  };

  return NextResponse.json({
    date,
    waterLogs,
    totalWaterMl,
    waterTargetMl: guard.db.nutritionTargets.waterMl,
    habit,
    recentHabits: guard.db.habitLogs.slice(0, 14),
  });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const date = String(body.logDate || todayIsoDate());

    if (body.type === 'water') {
      const amountMl = Number(body.amountMl || 250);
      updateDatabase((draft) => {
        draft.waterLogs.push({
          id: `water-${crypto.randomBytes(4).toString('hex')}`,
          userId: guard.session.userId,
          logDate: date,
          amountMl,
          loggedAt: new Date().toISOString(),
        });
      });
      return NextResponse.json({ ok: true });
    }

    // Upsert daily habit log and compute encouraging consistency score (0-100)
    let savedHabit: HabitLog | null = null;
    updateDatabase((draft) => {
      const totalWater = draft.waterLogs
        .filter((w) => w.logDate === date)
        .reduce((s, w) => s + w.amountMl, 0);
      const dayLogs = draft.foodLogs.filter((l) => l.logDate === date);
      const dayProtein = dayLogs.reduce((s, l) => s + l.proteinG, 0);

      const sleepHours = Number(body.sleepHours ?? 7.5);
      const steps = Number(body.steps ?? 0);
      const workoutCompleted = Boolean(body.workoutCompleted);
      const mealsLoggedCompleted = body.mealsLoggedCompleted ?? dayLogs.length > 0;
      const proteinTargetHit = body.proteinTargetHit ?? dayProtein >= draft.nutritionTargets.proteinG * 0.85;

      let score = 0;
      if (totalWater >= draft.nutritionTargets.waterMl * 0.8) score += 20;
      if (sleepHours >= 7) score += 20;
      if (steps >= 7000) score += 20;
      if (workoutCompleted) score += 20;
      if (mealsLoggedCompleted) score += 10;
      if (proteinTargetHit) score += 10;

      const idx = draft.habitLogs.findIndex((h) => h.logDate === date);
      const entry: HabitLog = {
        id: idx !== -1 ? draft.habitLogs[idx].id : `hab-${crypto.randomBytes(4).toString('hex')}`,
        userId: guard.session.userId,
        logDate: date,
        sleepHours,
        steps,
        workoutCompleted,
        mealsLoggedCompleted,
        proteinTargetHit,
        consistencyScore: score,
        notes: body.notes ? String(body.notes) : undefined,
      };
      if (idx !== -1) draft.habitLogs[idx] = entry;
      else draft.habitLogs.unshift(entry);
      savedHabit = entry;
    });

    return NextResponse.json({ habit: savedHabit });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
