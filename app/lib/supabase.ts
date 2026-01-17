import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase'; // 👈 ეს იმპორტი აუცილებელია!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 👇 აქ Database ტიპის მითითება აგვარებს 'never' შეცდომებს მთელ პროექტში
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);