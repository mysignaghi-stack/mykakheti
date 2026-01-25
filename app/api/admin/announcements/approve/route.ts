import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../types/supabase';
import { isAdminUser } from '../../../../lib/adminAuth';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing Supabase env vars.' },
      { status: 500 }
    );
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

  if (!id) {
    return NextResponse.json({ error: 'Missing announcement id' }, { status: 400 });
  }

  let serviceClient;
  try {
    serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create Supabase client' }, { status: 500 });
  }

  const { data, error } = await serviceClient
    .from('announcements')
    .update({ is_approved: true })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const announcement = data;

  // Mirror to community tables based on category so cards show approved items
  const images = Array.isArray(announcement.all_images) && announcement.all_images.length > 0
    ? announcement.all_images
    : announcement.image_url
      ? [announcement.image_url]
      : [];

  const category = announcement.category;

  if (category === 'სამძიმარი') {
    await serviceClient.from('obituaries').upsert({
      id: announcement.id,
      full_name: announcement.title,
      funeral_place: announcement.location,
      notes: announcement.description,
      contacts: announcement.phone,
      image_url: images[0] || null,
      is_approved: true,
      user_id: announcement.user_id,
    }, { onConflict: 'id' });
  } else if (category === 'დაკარგული/ნაპოვნი') {
    await serviceClient.from('lost_found').upsert({
      id: announcement.id,
      title: announcement.title,
      location: announcement.location,
      description: announcement.description,
      image_url: images[0] || null,
      all_images: images.length ? images : null,
      contact: announcement.phone,
      kind: 'lost',
      is_approved: true,
      user_id: announcement.user_id,
    }, { onConflict: 'id' });
  } else if (category === 'ოსტატი/სპეციალისტი') {
    await serviceClient.from('masters').upsert({
      id: announcement.id,
      full_name: announcement.title,
      profession: announcement.description || 'სპეციალისტი',
      location: announcement.location,
      phone: announcement.phone,
      photo_url: images[0] || null,
      is_approved: true,
      user_id: announcement.user_id,
    }, { onConflict: 'id' });
  } else if (category === 'მილოცვა') {
    await serviceClient.from('congratulations').upsert({
      id: announcement.id,
      sender_name: 'მომხმარებელი',
      recipient_name: announcement.title || 'მისალოცი',
      message: announcement.description || announcement.title || 'მისალოცი',
      occasion: 'სათემო ჩართულობა',
      image_url: images[0] || null,
      all_images: images.length ? images : null,
      is_approved: true,
      user_id: announcement.user_id,
    }, { onConflict: 'id' });
  }

  revalidatePath('/admin/moderate');
  revalidatePath('/');
  return NextResponse.json({ data: announcement });
}
