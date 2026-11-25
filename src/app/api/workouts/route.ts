import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { todayIsoDate, updateDatabase } from '@/lib/db/local-store';
import type { WorkoutLog } from '@/types/nutrifit';

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const { db } = guard;
  // Compute Personal Records (max weight lifted per exercise)
  const prs: Record<string, { weightKg: number; reps: number; date: string }> = {};
  for (const log of db.workoutLogs) {
    for (const ex of log.exercises) {
      const current = prs[ex.exerciseName];
      if (!current || ex.weightKg > current.weightKg) {
        prs[ex.exerciseName] = { weightKg: ex.weightKg, reps: ex.reps, date: log.workoutDate };
      }
    }
  }

  return NextResponse.json({
    exercises: db.exercises,
    routine: db.workoutRoutine,
    logs: db.workoutLogs,
    personalRecords: prs,
  });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const newLog: WorkoutLog = {
      id: `wlog-${crypto.randomBytes(4).toString('hex')}`,
      userId: guard.session.userId,
      workoutDate: String(body.workoutDate || todayIsoDate()),
      title: String(body.title || (body.isRestDay ? 'Rest & Recovery Day' : 'Gym Session')),
      durationMin: Number(body.durationMin || 45),
      isRestDay: Boolean(body.isRestDay),
      exercises: Array.isArray(body.exercises) ? body.exercises : [],
      cardioType: body.cardioType ? String(body.cardioType) : undefined,
      cardioMinutes: body.cardioMinutes ? Number(body.cardioMinutes) : 0,
      recoveryNotes: body.recoveryNotes ? String(body.recoveryNotes) : undefined,
      createdAt: new Date().toISOString(),
    };

    updateDatabase((draft) => {
      draft.workoutLogs.unshift(newLog);
      // Also update today's habit log workoutCompleted
      const existingHabit = draft.habitLogs.find((h) => h.logDate === newLog.workoutDate);
      if (existingHabit) {
        existingHabit.workoutCompleted = true;
      }
    });

    return NextResponse.json({ log: newLog }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    if (!body.dayId) return NextResponse.json({ error: 'dayId required.' }, { status: 400 });
    updateDatabase((draft) => {
      const idx = draft.workoutRoutine.findIndex((d) => d.id === body.dayId);
      if (idx !== -1) {
        draft.workoutRoutine[idx] = { ...draft.workoutRoutine[idx], ...body };
      }
    });
    return NextResponse.json({ routine: guard.db.workoutRoutine });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
