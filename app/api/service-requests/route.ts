import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { SERVICE_REQUEST_CATEGORY } from '@/app/lib/serviceCatalog';
import { notifyMatchingServiceProviders } from '@/app/lib/serviceRequestNotifications';
import type { Database } from '@/types/supabase';

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
  const services = Array.isArray(body?.services)
    ? body.services.map((item: unknown) => typeof item === 'string' ? item.trim() : '').filter(Boolean)
    : [];
  const service = typeof body?.service === 'string' ? body.service.trim() : '';
  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  const location = typeof body?.location === 'string' ? body.location.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const budget = typeof body?.budget === 'string' ? body.budget.trim() : '';
  const requester = typeof body?.requester === 'string' ? body.requester.trim() : '';
  const urgency = typeof body?.urgency === 'string' ? body.urgency.trim() : '';

  const selectedServices = services.length > 0 ? Array.from(new Set(services)) : service ? [service] : [];

  if (selectedServices.length === 0 || !category || !location || !phone || !description) {
    return NextResponse.json({ error: 'შეავსეთ სერვისი, კატეგორია, ლოკაცია, ტელეფონი და აღწერა.' }, { status: 400 });
  }

  const details = [
    `სერვისის კატეგორია: ${category}`,
    `მოთხოვნილი სერვისი: ${selectedServices.join(', ')}`,
    requester ? `მომთხოვნი: ${requester}` : '',
    urgency ? `სასურველი დრო: ${urgency}` : '',
    description,
  ].filter(Boolean).join('\n\n');

  const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await serviceClient
    .from('announcements')
    .insert({
      title: selectedServices.length === 1 ? selectedServices[0] : selectedServices.slice(0, 3).join(', '),
      description: details,
      category: SERVICE_REQUEST_CATEGORY,
      location,
      price: budget || 'შეთანხმებით',
      currency: 'GEL',
      phone,
      is_approved: false,
      is_archived: false,
      user_id: user.id,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  notifyMatchingServiceProviders({
    supabase: serviceClient,
    requestId: data?.id ?? null,
    category,
    services: selectedServices,
    location,
    budget: budget || 'შეთანხმებით',
    phone,
    description,
  }).catch((notifyError) => {
    console.warn('[service-requests] provider notification failed', notifyError);
  });

  revalidatePath('/');
  revalidatePath('/admin/moderate');
  revalidatePath('/profile');

  return NextResponse.json({ success: true, id: data?.id ?? null });
}
