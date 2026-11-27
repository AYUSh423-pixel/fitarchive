import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.STORAGE_URL ||
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.STORAGE_ANON_KEY ||
  process.env.NEXT_PUBLIC_STORAGE_ANON_KEY ||
  '';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.STORAGE_SERVICE_ROLE_KEY ||
  process.env.STORAGE_SERVICE_KEY ||
  '';

export function isSupabaseEnabled(): boolean {
  return Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));
}

// Client for anonymous/user authenticated requests
export const supabaseClient = isSupabaseEnabled()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin/Server client for secure server-side mutations with full privileges
export const supabaseAdmin = isSupabaseEnabled() && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
