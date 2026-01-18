import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase'; // 👈 ეს იმპორტი აუცილებელია!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	const missing = [
		!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
		!supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
	].filter(Boolean).join(', ');
	throw new Error(`Supabase env missing: ${missing}. Ensure Vercel env vars are set.`);
}

// 👇 აქ Database ტიპის მითითება აგვარებს 'never' შეცდომებს მთელ პროექტში
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);