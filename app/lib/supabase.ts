import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key are missing in .env.local file!');
}

// Client component Supabase instance
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);