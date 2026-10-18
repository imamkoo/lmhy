import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createClient as createServerClient } from './server';

/**
 * Creates an admin Supabase client using SUPABASE_SERVICE_ROLE_KEY for
 * server-to-server operations that need to bypass RLS (e.g. Litera Webhooks).
 * If SUPABASE_SERVICE_ROLE_KEY is not configured, safely falls back to
 * the standard server client.
 */
export async function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceRoleKey && supabaseUrl) {
    return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return await createServerClient();
}
