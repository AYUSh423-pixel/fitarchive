import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { DEFAULT_USER_ID, todayIsoDate, updateDatabase } from '@/lib/db/local-store';
import { supabaseAdmin, isSupabaseEnabled } from '@/lib/db/supabase-client';
import type { FoodLog, MealSlot, FoodUnit } from '@/types/nutrifit';
import { validateRequest, foodLogSchema } from '@/lib/validation';
import { logger, generateRequestId } from '@/lib/logger';
import { apiRateLimiter, applyRateLimit, getClientKey } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  const rateLimitResult = applyRateLimit(req, apiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || todayIsoDate();
    const logs = guard.db.foodLogs.filter((l) => l.logDate === date);

    const headers = rateLimitResult?.headers || {};
    return NextResponse.json({ date, logs }, { headers });
  } catch (err) {
    logger.error('Food logs GET error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  const rateLimitResult = applyRateLimit(req, apiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;

    const body = await req.json();
    const targetDate = String(body.logDate || todayIsoDate());
    const isSupabaseUser = Boolean(isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID);
    const headers = rateLimitResult?.headers || {};

    // Action: copy yesterday's meals
    if (body.action === 'copy_yesterday') {
      const d = new Date(targetDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const yStr = d.toISOString().slice(0, 10);

      const yesterdayLogs = guard.db.foodLogs.filter((l) => l.logDate === yStr);
      if (yesterdayLogs.length === 0) {
        return NextResponse.json({ error: 'No meals logged yesterday to copy.' }, { status: 404, headers });
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
        logger.audit('Food logs copied from yesterday', { count: inserted.length }, guard.session.userId, requestId);
        return NextResponse.json({ logs: inserted }, { status: 201, headers });
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
      logger.audit('Food logs copied from yesterday (local)', { count: copied.length }, guard.session.userId, requestId);
      return NextResponse.json({ logs: copied }, { status: 201, headers });
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
        logger.audit('Favorite meal saved', { name: body.name }, guard.session.userId, requestId);
        return NextResponse.json({ ok: true, id: favId }, { status: 201, headers });
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
      logger.audit('Favorite meal saved (local)', { name: body.name }, guard.session.userId, requestId);
      return NextResponse.json({ ok: true, id: favId }, { status: 201, headers });
    }

    // Validate food log items
    const incomingItems = Array.isArray(body.items) ? body.items : [body];
    const validatedItems: FoodLog[] = [];

    for (const item of incomingItems) {
      const validation = foodLogSchema.safeParse({
        foodId: item.foodId,
        foodName: item.foodName,
        mealSlot: item.mealSlot || body.mealSlot || 'lunch',
        quantity: item.quantity,
        unit: item.unit,
        weightGrams: item.weightGrams,
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        oilGheeGrams: item.oilGheeGrams,
        loggingMethod: item.loggingMethod,
        confidence: item.confidence,
        notes: item.notes,
      });

      if (!validation.success) {
        return NextResponse.json(
          { error: `Invalid food log item: ${validation.error.issues[0].message}` },
          { status: 400, headers }
        );
      }
      validatedItems.push({ ...validation.data, logDate: item.logDate || targetDate, userId: guard.session.userId } as FoodLog);
    }

    if (isSupabaseUser && supabaseAdmin) {
      const rows = validatedItems.map((item) => ({
        user_id: guard.session.userId,
        log_date: item.logDate,
        meal_slot: item.mealSlot,
        food_id: item.foodId || null,
        food_name: item.foodName,
        quantity: item.quantity,
        unit: item.unit,
        weight_grams: item.weightGrams,
        calories: Math.round(item.calories),
        protein_g: Number(item.proteinG.toFixed(1)),
        carbs_g: Number(item.carbsG.toFixed(1)),
        fat_g: Number(item.fatG.toFixed(1)),
        logging_method: item.loggingMethod,
        confidence: item.confidence,
        oil_ghee_grams: item.oilGheeGrams || 0,
        notes: item.notes || null,
      }));

      const { data: created, error } = await supabaseAdmin.from('food_logs').insert(rows).select();
      if (error) throw new Error(error.message);
      logger.audit('Food logs created', { count: created.length }, guard.session.userId, requestId);
      return NextResponse.json({ logs: created }, { status: 201, headers });
    }

    const created: FoodLog[] = validatedItems.map((item) => ({
      id: `log-${crypto.randomBytes(5).toString('hex')}`,
      userId: guard.session.userId,
      logDate: item.logDate,
      mealSlot: item.mealSlot,
      foodId: item.foodId || null,
      foodName: item.foodName,
      quantity: item.quantity,
      unit: item.unit as FoodUnit,
      weightGrams: item.weightGrams,
      calories: Math.round(item.calories),
      proteinG: Number(item.proteinG.toFixed(1)),
      carbsG: Number(item.carbsG.toFixed(1)),
      fatG: Number(item.fatG.toFixed(1)),
      loggingMethod: item.loggingMethod,
      confidence: item.confidence,
      oilGheeGrams: item.oilGheeGrams || 0,
      notes: item.notes,
      loggedAt: new Date().toISOString(),
    } as FoodLog));

    updateDatabase((draft) => {
      draft.foodLogs.push(...created);
    });

    logger.audit('Food logs created (local)', { count: created.length }, guard.session.userId, requestId);
    return NextResponse.json({ logs: created }, { status: 201, headers });
  } catch (err) {
    logger.error('Food logs POST error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimitResult?.headers || {} });
  }
}

export async function PATCH(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  const rateLimitResult = applyRateLimit(req, apiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;

    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Log id required.' }, { status: 400, headers: rateLimitResult?.headers || {} });

    // Validate update fields
    const updateSchema = foodLogSchema.partial();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: `Invalid update: ${validation.error.issues[0].message}` },
        { status: 400, headers: rateLimitResult?.headers || {} }
      );
    }

    const headers = rateLimitResult?.headers || {};

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
      if (!updated) return NextResponse.json({ error: 'Food log not found.' }, { status: 404, headers });

      logger.audit('Food log updated', { logId: id }, guard.session.userId, requestId);
      return NextResponse.json({ log: updated }, { headers });
    }

    let updatedLog: FoodLog | null = null;
    updateDatabase((draft) => {
      const idx = draft.foodLogs.findIndex((l) => l.id === id);
      if (idx !== -1) {
        draft.foodLogs[idx] = {
          ...draft.foodLogs[idx],
          ...validation.data,
          id,
        } as FoodLog;
        updatedLog = draft.foodLogs[idx];
      }
    });

    if (!updatedLog) return NextResponse.json({ error: 'Food log not found.' }, { status: 404, headers });
    logger.audit('Food log updated (local)', { logId: id }, guard.session.userId, requestId);
    return NextResponse.json({ log: updatedLog }, { headers });
  } catch (err) {
    logger.error('Food logs PATCH error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimitResult?.headers || {} });
  }
}

export async function DELETE(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  const rateLimitResult = applyRateLimit(req, apiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id query param required.' }, { status: 400, headers: rateLimitResult?.headers || {} });

    const headers = rateLimitResult?.headers || {};

    if (isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID) {
      const { error } = await supabaseAdmin.from('food_logs').delete().eq('id', id).eq('user_id', guard.session.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400, headers });
      logger.audit('Food log deleted', { logId: id }, guard.session.userId, requestId);
      return NextResponse.json({ ok: true, deletedId: id }, { headers });
    }

    let removed: FoodLog | null = null;
    updateDatabase((draft) => {
      const idx = draft.foodLogs.findIndex((l) => l.id === id);
      if (idx !== -1) {
        removed = draft.foodLogs[idx];
        draft.foodLogs.splice(idx, 1);
      }
    });

    if (!removed) return NextResponse.json({ error: 'Food log not found.' }, { status: 404, headers });
    logger.audit('Food log deleted (local)', { logId: id }, guard.session.userId, requestId);
    return NextResponse.json({ ok: true, deleted: removed }, { headers });
  } catch (err) {
    logger.error('Food logs DELETE error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimitResult?.headers || {} });
  }
}