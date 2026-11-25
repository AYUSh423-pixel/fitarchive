import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { clearServerSessionCookie } from '@/lib/auth';
import { readDatabase, resetDatabase, writeDatabase } from '@/lib/db/local-store';

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const db = readDatabase();
  const safeExport = {
    exportedAt: new Date().toISOString(),
    app: 'NutriFit AI',
    version: '1.0',
    data: {
      profile: db.profile,
      bodyScans: db.bodyScans,
      bodyMeasurements: db.bodyMeasurements,
      nutritionTargets: db.nutritionTargets,
      foodLogs: db.foodLogs,
      favoriteMeals: db.favoriteMeals,
      mealPlans: db.mealPlans,
      groceryLists: db.groceryLists,
      workoutRoutine: db.workoutRoutine,
      workoutLogs: db.workoutLogs,
      waterLogs: db.waterLogs,
      habitLogs: db.habitLogs,
      aiConversations: db.aiConversations,
      preferences: db.preferences,
    },
  };

  return new NextResponse(JSON.stringify(safeExport, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="nutrifit-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    if (body.action === 'delete_account') {
      resetDatabase();
      await clearServerSessionCookie();
      return NextResponse.json({ ok: true, message: 'Account data cleared and reset.' });
    }

    if (body.action === 'restore_backup' && body.data) {
      const current = readDatabase();
      const restored = {
        ...current,
        ...body.data,
        auth: current.auth,
      };
      writeDatabase(restored);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid account action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
