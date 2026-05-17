import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Props = {
  params: Promise<{ id: string }>;
};

const getClients = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) return null;

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

  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return { authClient, serviceClient };
};

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

  const { data: master, error: updateError } = await (serviceClient as any)
    .from('masters')
    .update({
      rating_avg: Number(average.toFixed(2)),
      ratings_count: count,
    })
    .eq('id', masterId)
    .select('*')
    .single();

  if (updateError) throw updateError;
  return master;
};

export async function GET(_request: Request, { params }: Props) {
  const clients = await getClients();
  if (!clients) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const { id } = await params;
  const { data, error } = await (clients.serviceClient as any)
    .from('master_ratings')
    .select('id, master_id, stars, comment, created_at, rater_fingerprint')
    .eq('master_id', id)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ratings: data ?? [] });
}

export async function POST(request: Request, { params }: Props) {
  const clients = await getClients();
  if (!clients) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const { data: { user } } = await clients.authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const stars = Number(body?.stars);
  const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 700) : '';

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  }

  const { data: master, error: masterError } = await (clients.serviceClient as any)
    .from('masters')
    .select('id, is_approved')
    .eq('id', id)
    .single();

  if (masterError || !master?.is_approved) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const { data: existing, error: existingError } = await (clients.serviceClient as any)
    .from('master_ratings')
    .select('id')
    .eq('master_id', id)
    .eq('rater_fingerprint', user.id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const payload = {
    master_id: id,
    stars,
    comment: comment || null,
    rater_fingerprint: user.id,
  };

  const query = existing
    ? (clients.serviceClient as any).from('master_ratings').update(payload).eq('id', existing.id)
    : (clients.serviceClient as any).from('master_ratings').insert(payload);

  const { data: ratingData, error: ratingError } = await query.select('id, master_id, stars, comment, created_at, rater_fingerprint').single();
  if (ratingError) return NextResponse.json({ error: ratingError.message }, { status: 500 });

  try {
    const updatedMaster = await recalculateMasterRating(clients.serviceClient, id);
    return NextResponse.json({ success: true, rating: ratingData, master: updatedMaster });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rating saved, aggregation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
