import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const TYPE_CONFIG = {
  grape: {
    category: 'აგრო-ბირჟის განაცხადი',
    label: 'აგრო-ბირჟა',
  },
  grain: {
    category: 'მარცვლეულის განაცხადი',
    label: 'მარცვლეული',
  },
} as const;

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
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const type = body?.type === 'grain' ? 'grain' : 'grape';
  const product = typeof body?.product === 'string' ? body.product.trim() : '';
  const price = typeof body?.price === 'string' ? body.price.trim() : '';
  const location = typeof body?.location === 'string' ? body.location.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const note = typeof body?.note === 'string' ? body.note.trim() : '';

  if (!product || !price || !location) {
    return NextResponse.json({ error: 'აუცილებელია პროდუქტის, ფასის და ლოკაციის შევსება.' }, { status: 400 });
  }

  const config = TYPE_CONFIG[type];
  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const description = [
    `${config.label}: მომხმარებლის მიერ გაგზავნილი ფასის განაცხადი`,
    note ? `შენიშვნა: ${note}` : '',
  ].filter(Boolean).join('\n\n');

  const { data, error } = await serviceClient
    .from('announcements')
    .insert({
      title: product,
      description,
      category: config.category,
      location,
      price,
      currency: 'GEL',
      phone: phone || null,
      is_approved: false,
      is_archived: false,
      user_id: user.id,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/admin/moderate');
  revalidatePath('/admin/announcements');

  return NextResponse.json({ success: true, announcement: data });
}
