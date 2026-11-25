import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { DEFAULT_USER_ID, todayIsoDate, updateDatabase } from '@/lib/db/local-store';
import { supabaseAdmin, isSupabaseEnabled } from '@/lib/db/supabase-client';
import type { FoodLog, MealSlot } from '@/types/nutrifit';

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayIsoDate();
  const logs = guard.db.foodLogs.filter((l) => l.logDate === date);
  return NextResponse.json({ date, logs });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const targetDate = String(body.logDate || todayIsoDate());
    const isSupabaseUser = Boolean(isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID);

    // Action: copy yesterday's meals
    if (body.action === 'copy_yesterday') {
      const d = new Date(targetDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const yStr = d.toISOString().slice(0, 10);

      const yesterdayLogs = guard.db.foodLogs.filter((l) => l.logDate === yStr);
      if (yesterdayLogs.length === 0) {
        return NextResponse.json({ error: 'No meals logged yesterday to copy.' }, { status: 404 });
      }

      if (isSupabaseUser && supabaseAdmin) {
        const rowsToInsert = yesterdayLogs.map((l) => ({
          user_id: guard.session.userId,
          log_date: targetDate,
          meal_slot: l.mealSlot,
          food_id: l.foodId || null,
          food_name: l.foodName,
          quantity: l.quantity,
          unit: l.unit,
          weight_grams: l.weightGrams,
          calories: l.calories,
          protein_g: l.proteinG,
          carbs_g: l.carbsG,
          fat_g: l.fatG,
          logging_method: 'quick_copy',
          confidence: l.confidence,
          oil_ghee_grams: l.oilGheeGrams || 0,
        }));
        const { data: inserted, error: insertErr } = await supabaseAdmin.from('food_logs').insert(rowsToInsert).select();
        if (insertErr) throw new Error(insertErr.message);
        return NextResponse.json({ logs: inserted }, { status: 201 });
      }

      const copied: FoodLog[] = yesterdayLogs.map((l) => ({
        ...l,
        id: `log-${crypto.randomBytes(5).toString('hex')}`,
        logDate: targetDate,
        loggingMethod: 'quick_copy',
        loggedAt: new Date().toISOString(),
      }));
      updateDatabase((draft) => {
        draft.foodLogs.push(...copied);
      });
      return NextResponse.json({ logs: copied }, { status: 201 });
    }

    // Action: save favorite meal template
    if (body.action === 'save_favorite') {
      const favId = `fav-${crypto.randomBytes(4).toString('hex')}`;
      if (isSupabaseUser && supabaseAdmin) {
        await supabaseAdmin.from('meals').insert({
          user_id: guard.session.userId,
          name: String(body.name || 'Saved Meal'),
          meal_slot: (body.mealSlot || 'lunch') as MealSlot,
          items: body.items || [],
          total_calories: Number(body.totalCalories || 0),
          total_protein_g: Number(body.totalProteinG || 0),
        });
        return NextResponse.json({ ok: true, id: favId }, { status: 201 });
      }

      updateDatabase((draft) => {
        draft.favoriteMeals.unshift({
          id: favId,
          userId: guard.session.userId,
          name: String(body.name || 'Saved Meal'),
          mealSlot: (body.mealSlot || 'lunch') as MealSlot,
          items: body.items || [],
          totalCalories: Number(body.totalCalories || 0),
          totalProteinG: Number(body.totalProteinG || 0),
          createdAt: new Date().toISOString(),
        });
      });
      return NextResponse.json({ ok: true, id: favId }, { status: 201 });
    }

    const incomingItems = Array.isArray(body.items) ? body.items : [body];

    if (isSupabaseUser && supabaseAdmin) {
      const rows = incomingItems.map((item: Partial<FoodLog>) => ({
        user_id: guard.session.userId,
        log_date: item.logDate || targetDate,
        meal_slot: (item.mealSlot || body.mealSlot || 'lunch') as MealSlot,
        food_id: item.foodId || null,
        food_name: String(item.foodName || 'Homemade Meal'),
        quantity: Number(item.quantity || 1),
        unit: item.unit || 'bowl',
        weight_grams: Number(item.weightGrams || 100),
        calories: Math.round(Number(item.calories || 0)),
        protein_g: Number(Number(item.proteinG || 0).toFixed(1)),
        carbs_g: Number(Number(item.carbsG || 0).toFixed(1)),
        fat_g: Number(Number(item.fatG || 0).toFixed(1)),
        logging_method: item.loggingMethod || 'manual',
        confidence: item.confidence || 'verified',
        oil_ghee_grams: Number(item.oilGheeGrams || 0),
        notes: item.notes || null,
      }));

      const { data: created, error } = await supabaseAdmin.from('food_logs').insert(rows).select();
      if (error) throw new Error(error.message);
      return NextResponse.json({ logs: created }, { status: 201 });
    }

    const created: FoodLog[] = incomingItems.map((item: Partial<FoodLog>) => ({
      id: `log-${crypto.randomBytes(5).toString('hex')}`,
      userId: guard.session.userId,
      logDate: item.logDate || targetDate,
      mealSlot: (item.mealSlot || body.mealSlot || 'lunch') as MealSlot,
      foodId: item.foodId || null,
      foodName: String(item.foodName || 'Homemade Meal'),
      quantity: Number(item.quantity || 1),
      unit: item.unit || 'serving',
      weightGrams: Number(item.weightGrams || 100),
      calories: Math.round(Number(item.calories || 0)),
      proteinG: Number(Number(item.proteinG || 0).toFixed(1)),
      carbsG: Number(Number(item.carbsG || 0).toFixed(1)),
      fatG: Number(Number(item.fatG || 0).toFixed(1)),
      loggingMethod: item.loggingMethod || 'manual',
      confidence: item.confidence || 'verified',
      oilGheeGrams: Number(item.oilGheeGrams || 0),
      notes: item.notes,
      loggedAt: new Date().toISOString(),
    }));

    updateDatabase((draft) => {
      draft.foodLogs.push(...created);
    });

    return NextResponse.json({ logs: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Log id required.' }, { status: 400 });

    if (isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID) {
      const { data: updated, error } = await supabaseAdmin
        .from('food_logs')
        .update({
          food_name: body.foodName,
          quantity: body.quantity,
          weight_grams: body.weightGrams,
          calories: body.calories,
          protein_g: body.proteinG,
          carbs_g: body.carbsG,
          fat_g: body.fatG,
          oil_ghee_grams: body.oilGheeGrams,
        })
        .eq('id', id)
        .eq('user_id', guard.session.userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ log: updated });
    }

    let updatedLog: FoodLog | null = null;
    updateDatabase((draft) => {
      const idx = draft.foodLogs.findIndex((l) => l.id === id);
      if (idx !== -1) {
        draft.foodLogs[idx] = {
          ...draft.foodLogs[idx],
          ...body,
          id,
        };
        updatedLog = draft.foodLogs[idx];
      }
    });

    if (!updatedLog) return NextResponse.json({ error: 'Food log not found.' }, { status: 404 });
    return NextResponse.json({ log: updatedLog });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param required.' }, { status: 400 });

  if (isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID) {
    const { error } = await supabaseAdmin.from('food_logs').delete().eq('id', id).eq('user_id', guard.session.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, deletedId: id });
  }

  let removed: FoodLog | null = null;
  updateDatabase((draft) => {
    const idx = draft.foodLogs.findIndex((l) => l.id === id);
    if (idx !== -1) {
      removed = draft.foodLogs[idx];
      draft.foodLogs.splice(idx, 1);
    }
  });

  if (!removed) return NextResponse.json({ error: 'Food log not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: removed });
}
