import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isAdminUser } from '@/app/lib/adminAuth';

const recalculateMasterRating = async (serviceClient: ReturnType<typeof createClient<Database>>, masterId: string) => {
  const { data: ratings, error } = await (serviceClient as any)
    .from('master_ratings')
    .select('stars')
    .eq('master_id', masterId);

  if (error) throw error;

  const count = ratings?.length ?? 0;
  const average = count > 0
    ? ratings.reduce((sum: number, rating: { stars: number }) => sum + Number(rating.stars || 0), 0) / count
    : 0;

  const { error: updateError } = await (serviceClient as any)
    .from('masters')
    .update({ rating_avg: Number(average.toFixed(2)), ratings_count: count })
    .eq('id', masterId);

  if (updateError) throw updateError;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const authClient = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user } } = await authClient.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id : null;
  if (!id) return NextResponse.json({ error: 'Missing rating id' }, { status: 400 });

  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: rating, error: fetchError } = await (serviceClient as any)
    .from('master_ratings')
    .select('id, master_id')
    .eq('id', id)
    .single();

  if (fetchError || !rating?.master_id) {
    return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
  }

  const { error } = await (serviceClient as any).from('master_ratings').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await recalculateMasterRating(serviceClient, rating.master_id);
  } catch (recalculateError) {
    const message = recalculateError instanceof Error ? recalculateError.message : 'Rating deleted, aggregation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
