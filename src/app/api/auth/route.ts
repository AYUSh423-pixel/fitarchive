import { NextResponse } from 'next/server';
import {
  clearServerSessionCookie,
  getServerSession,
  hashPassword,
  setServerSessionCookie,
  verifyPassword,
} from '@/lib/auth';
import { DEFAULT_USER_ID, readDatabase, updateDatabase } from '@/lib/db/local-store';
import { supabaseAdmin, isSupabaseEnabled } from '@/lib/db/supabase-client';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, email: null, onboardingCompleted: false, name: null });
  }

  // If Supabase is connected and it's not the default local mock user
  if (isSupabaseEnabled() && supabaseAdmin && session.userId !== DEFAULT_USER_ID) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('name, email, onboarding_completed')
      .eq('id', session.userId)
      .single();

    if (profile) {
      return NextResponse.json({
        authenticated: true,
        email: session.email,
        onboardingCompleted: Boolean(profile.onboarding_completed),
        name: profile.name,
      });
    }
  }

  const db = readDatabase();
  return NextResponse.json({
    authenticated: Boolean(session.userId === db.auth.userId || session.userId),
    email: session.email ?? db.auth.email,
    onboardingCompleted: db.profile.onboardingCompleted,
    name: db.profile.name,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as 'login' | 'quick_personal' | 'signup' | 'logout' | 'change_password';
    const db = readDatabase();

    if (action === 'logout') {
      await clearServerSessionCookie();
      return NextResponse.json({ ok: true, authenticated: false });
    }

    if (action === 'quick_personal') {
      await setServerSessionCookie({
        userId: db.auth.userId,
        email: db.auth.email,
        iat: Date.now(),
      });
      return NextResponse.json({ ok: true, authenticated: true, email: db.auth.email });
    }

    if (action === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      // Check Supabase if enabled
      if (isSupabaseEnabled() && supabaseAdmin) {
        const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (authData?.user) {
          const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('name, onboarding_completed')
            .eq('id', authData.user.id)
            .single();

          await setServerSessionCookie({
            userId: authData.user.id,
            email: authData.user.email || email,
            iat: Date.now(),
          });

          return NextResponse.json({
            ok: true,
            authenticated: true,
            email: authData.user.email,
            name: profile?.name || 'User',
            onboardingCompleted: Boolean(profile?.onboarding_completed),
          });
        }
      }

      // Fallback for demo Ayush local account
      if (email === db.auth.email.toLowerCase() && verifyPassword(password, db.auth.passwordHash)) {
        await setServerSessionCookie({
          userId: db.auth.userId,
          email: db.auth.email,
          iat: Date.now(),
        });
        return NextResponse.json({ ok: true, authenticated: true, email: db.auth.email });
      }

      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (action === 'signup') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || 'New Member').trim();
      if (!email || password.length < 6) {
        return NextResponse.json({ error: 'Valid email and password (6+ chars) required.' }, { status: 400 });
      }

      // 1. Create in Supabase if configured
      if (isSupabaseEnabled() && supabaseAdmin) {
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });

        if (authErr) {
          // If already exists, notify cleanly
          if (authErr.message.includes('already registered')) {
            return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 });
          }
          return NextResponse.json({ error: authErr.message }, { status: 400 });
        }

        if (authUser?.user) {
          const newUserId = authUser.user.id;

          // Create base isolated user profile
          await supabaseAdmin.from('user_profiles').insert({
            id: newUserId,
            name,
            email,
            age: 25,
            gender: 'male',
            height_cm: 170,
            weight_kg: 70,
            bmi: 24.2,
            diet_type: 'pure_veg_no_egg',
            activity_level: 'gym_4_5_days',
            food_preference: 'Homemade Indian food',
            goal: 'lean_athletic',
            onboarding_completed: false,
          });

          // Create initial baseline nutrition targets for this user
          await supabaseAdmin.from('nutrition_targets').insert({
            user_id: newUserId,
            calories_kcal: 1800,
            protein_g: 130,
            carbs_g: 155,
            fat_g: 65,
            water_ml: 3000,
          });

          // Create initial habit log
          await supabaseAdmin.from('habit_logs').insert({
            user_id: newUserId,
            log_date: new Date().toISOString().slice(0, 10),
            water_target_completed: false,
            workout_completed: false,
            consistency_score: 50,
          });

          await setServerSessionCookie({
            userId: newUserId,
            email,
            iat: Date.now(),
          });

          return NextResponse.json({ ok: true, authenticated: true, email, onboardingCompleted: false });
        }
      }

      // Fallback local mode
      updateDatabase((draft) => {
        draft.auth.email = email;
        draft.auth.passwordHash = hashPassword(password);
        draft.profile.email = email;
        if (name) draft.profile.name = name;
        draft.profile.onboardingCompleted = false;
        draft.profile.updatedAt = new Date().toISOString();
      });

      await setServerSessionCookie({
        userId: db.auth.userId,
        email,
        iat: Date.now(),
      });
      return NextResponse.json({ ok: true, authenticated: true, email, onboardingCompleted: false });
    }

    if (action === 'change_password') {
      const session = await getServerSession();
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const newPassword = String(body.newPassword || '');
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }

      if (isSupabaseEnabled() && supabaseAdmin && session.userId !== DEFAULT_USER_ID) {
        await supabaseAdmin.auth.admin.updateUserById(session.userId, { password: newPassword });
        return NextResponse.json({ ok: true });
      }

      updateDatabase((draft) => {
        draft.auth.passwordHash = hashPassword(newPassword);
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported auth action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
