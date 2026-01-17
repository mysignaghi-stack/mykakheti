import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ეს არის ერთადერთი რამ, რაც ამ ფაილში უნდა იყოს
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);