import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient<Database> | null = null;

export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  if (!client) {
    client = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return client;
};
