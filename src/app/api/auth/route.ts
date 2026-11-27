import { NextResponse } from 'next/server';
import {
  clearServerSessionCookie,
  getServerSession,
  hashPassword,
  setServerSessionCookie,
  verifyPassword,
} from '@/lib/auth';
import { DEFAULT_USER_ID, readDatabase, updateDatabase } from '@/lib/db/local-store';
import { supabaseAdmin, supabaseClient, isSupabaseEnabled } from '@/lib/db/supabase-client';
import { authRateLimiter, applyRateLimit, getClientKey } from '@/lib/rate-limit';
import { validateRequest, authActionSchema } from '@/lib/validation';
import { logger, generateRequestId } from '@/lib/logger';

export async function GET() {
  const requestId = generateRequestId();
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, email: null, onboardingCompleted: false, name: null });
    }

    // If Supabase is connected and it's not the default local mock user
    if (isSupabaseEnabled() && session.userId !== DEFAULT_USER_ID) {
      if (supabaseAdmin) {
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

      return NextResponse.json({
        authenticated: true,
        email: session.email,
        onboardingCompleted: false,
        name: 'Member',
      });
    }

    const db = readDatabase();
    return NextResponse.json({
      authenticated: Boolean(session.userId === db.auth.userId || session.userId),
      email: session.email ?? db.auth.email,
      onboardingCompleted: db.profile.onboardingCompleted,
      name: db.profile.name,
    });
  } catch (err) {
    logger.error('Auth GET error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  // Apply rate limiting
  const rateLimitResult = applyRateLimit(req, authRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    logger.security('Auth rate limit exceeded', { clientKey }, undefined, requestId);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    // Validate request body
    const validation = await validateRequest(req, authActionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const body = validation.data;
    const action = body.action;
    const db = readDatabase();
    const headers = rateLimitResult?.headers || {};

    if (action === 'logout') {
      await clearServerSessionCookie();
      logger.audit('User logout', {}, undefined, requestId);
      return NextResponse.json({ ok: true, authenticated: false }, { headers });
    }

    if (action === 'quick_personal' || action === 'quick_enter') {
      await setServerSessionCookie({
        userId: db.auth.userId,
        email: db.auth.email,
        iat: Date.now(),
      });
      return NextResponse.json({
        ok: true,
        authenticated: true,
        email: db.auth.email,
        name: db.profile.name,
        user: { name: db.profile.name, email: db.auth.email },
      }, { headers });
    }

    if (action === 'login') {
      const { email, password } = body;

      // Check Supabase if enabled — works with anon client or admin client
      const authClient = supabaseClient || supabaseAdmin;
      if (isSupabaseEnabled() && authClient) {
        const { data: authData, error: authErr } = await authClient.auth.signInWithPassword({
          email,
          password,
        });

        if (authData?.user) {
          let profileName: string | null = null;
          let onboardingCompleted = false;

          if (supabaseAdmin) {
            const { data: profile } = await supabaseAdmin
              .from('user_profiles')
              .select('name, onboarding_completed')
              .eq('id', authData.user.id)
              .single();
            if (profile) {
              profileName = profile.name;
              onboardingCompleted = Boolean(profile.onboarding_completed);
            }
          }

          await setServerSessionCookie({
            userId: authData.user.id,
            email: authData.user.email || email,
            iat: Date.now(),
          });

          const userName = profileName || (authData.user.user_metadata?.name as string) || 'User';
          const userEmail = authData.user.email || email;

          logger.audit('User login', { email, supabase: true }, authData.user.id, requestId);
          return NextResponse.json({
            ok: true,
            authenticated: true,
            email: userEmail,
            name: userName,
            onboardingCompleted,
            user: { name: userName, email: userEmail },
          }, { headers });
        }

        if (authErr) {
          logger.security('Supabase login failed', { email, error: authErr.message }, undefined, requestId);
        }
      }

      // Fallback for demo Ayush local account
      if (email === db.auth.email.toLowerCase() && verifyPassword(password, db.auth.passwordHash)) {
        await setServerSessionCookie({
          userId: db.auth.userId,
          email: db.auth.email,
          iat: Date.now(),
        });
        logger.audit('User login', { email, supabase: false }, db.auth.userId, requestId);
        return NextResponse.json({
          ok: true,
          authenticated: true,
          email: db.auth.email,
          name: db.profile.name,
          user: { name: db.profile.name, email: db.auth.email },
        }, { headers });
      }

      logger.security('Failed login attempt', { email }, undefined, requestId);
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401, headers });
    }

    if (action === 'signup') {
      const { email, password, name } = body;

      // 1. Create in Supabase if configured — uses client-side signUp (works with anon key, no service role required)
      if (isSupabaseEnabled() && supabaseClient) {
        const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });

        if (authErr) {
          // Already-registered check
          if (
            authErr.message.toLowerCase().includes('already registered') ||
            authErr.message.toLowerCase().includes('user already registered') ||
            authErr.message.toLowerCase().includes('email already')
          ) {
            logger.security('Signup attempted with existing email', { email }, undefined, requestId);
            return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400, headers });
          }

          // For Supabase database errors (e.g. broken triggers on auth.users) or upstream issues,
          // fall back to local database so user signup is never blocked.
          const errInfo: Record<string, unknown> = { email, error: authErr.message };
          logger.warn('Supabase signup error — falling back to local account', errInfo, undefined, requestId);
          // fall through to local fallback below
        }

        // signUp returns a user even when email confirmation is pending.
        // identities?.length === 0 means the email already exists but is unconfirmed.
        const signedUpUser = authData?.user;
        if (signedUpUser && signedUpUser.identities && signedUpUser.identities.length === 0) {
          logger.security('Signup with existing (unconfirmed) email', { email }, undefined, requestId);
          return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400, headers });
        }

        if (signedUpUser) {
          const newUserId = signedUpUser.id;

          // Create base isolated user profile (non-blocking) — use supabaseAdmin if available, else skip
          if (supabaseAdmin) {
            try {
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
            } catch (profileErr) {
              logger.warn('Failed to create user_profiles row (non-blocking)', { error: profileErr, userId: newUserId }, newUserId, requestId);
            }

            try {
              await supabaseAdmin.from('nutrition_targets').insert({
                user_id: newUserId,
                calories_kcal: 1800,
                protein_g: 130,
                carbs_g: 155,
                fat_g: 65,
                water_ml: 3000,
              });
            } catch (targetsErr) {
              logger.warn('Failed to create nutrition_targets (non-blocking)', { error: targetsErr, userId: newUserId }, newUserId, requestId);
            }

            try {
              await supabaseAdmin.from('habit_logs').insert({
                user_id: newUserId,
                log_date: new Date().toISOString().slice(0, 10),
                water_target_completed: false,
                workout_completed: false,
                consistency_score: 50,
              });
            } catch (habitErr) {
              logger.warn('Failed to create habit_logs (non-blocking)', { error: habitErr, userId: newUserId }, newUserId, requestId);
            }
          }

          await setServerSessionCookie({ userId: newUserId, email, iat: Date.now() });
          logger.audit('User signup', { email, supabase: true }, newUserId, requestId);
          return NextResponse.json({
            ok: true,
            authenticated: true,
            email,
            name,
            onboardingCompleted: false,
            user: { name, email },
          }, { headers });
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
      logger.audit('User signup', { email, supabase: false }, db.auth.userId, requestId);
      return NextResponse.json({
        ok: true,
        authenticated: true,
        email,
        name: name || db.profile.name,
        onboardingCompleted: false,
        user: { name: name || db.profile.name, email },
      }, { headers });
    }

    if (action === 'change_password') {
      const session = await getServerSession();
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });

      const { newPassword } = body;

      if (isSupabaseEnabled() && supabaseAdmin && session.userId !== DEFAULT_USER_ID) {
        await supabaseAdmin.auth.admin.updateUserById(session.userId, { password: newPassword });
        logger.audit('Password changed', { supabase: true }, session.userId, requestId);
        return NextResponse.json({ ok: true }, { headers });
      }

      updateDatabase((draft) => {
        draft.auth.passwordHash = hashPassword(newPassword);
      });
      logger.audit('Password changed', { supabase: false }, session.userId, requestId);
      return NextResponse.json({ ok: true }, { headers });
    }

    return NextResponse.json({ error: 'Unsupported auth action.' }, { status: 400, headers });
  } catch (err) {
    logger.error('Auth POST error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimitResult?.headers || {} });
  }
}