import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isAdminUser } from '@/app/lib/adminAuth';
import { SERVICE_REQUEST_CATEGORY } from '@/app/lib/specialAnnouncements';
import type { Database } from '@/types/supabase';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
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

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let isAdmin = isAdminUser(user);

    if (!isAdmin && serviceRoleKey) {
      const serviceClient = createServiceClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
      const { data: profile } = await (serviceClient as any)
        .from('profiles')
        .select('role,is_admin,roles')
        .eq('id', user.id)
        .single();
      const roles = Array.isArray((profile as any)?.roles) ? (profile as any).roles : [];
      isAdmin = profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin');
    }

    if (!isAdmin) {
      const email = (user.email ?? '').toLowerCase();
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (email && adminEmails.includes(email)) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!serviceRoleKey) {
      return NextResponse.json({
        usersCount: 0,
        activeAnnouncements: 0,
        pendingAnnouncements: 0,
        email: user.email ?? null,
      });
    }

    const serviceClient = createServiceClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const [
      { count: usersCount },
      { count: activeAnnouncements },
      { count: pendingAnnouncements },
      pendingAnnouncementsRows,
      { count: pendingMasters },
      { count: pendingLostFound },
    ] = await Promise.all([
      (serviceClient as any).schema('auth').from('users').select('id', { count: 'exact', head: true }),
      serviceClient
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true)
        .or('is_archived.is.null,is_archived.eq.false'),
      serviceClient
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false),
      serviceClient
        .from('announcements')
        .select('id,category,description')
        .eq('is_approved', false),
      serviceClient
        .from('masters')
        .select('id', { count: 'exact', head: true })
        .or('is_approved.is.null,is_approved.eq.false'),
      serviceClient
        .from('lost_found')
        .select('id', { count: 'exact', head: true })
        .or('is_approved.is.null,is_approved.eq.false'),
    ]);

    const pendingRows = pendingAnnouncementsRows.data ?? [];
    const isAgro = (row: { category?: string | null; description?: string | null }) =>
      row.category === 'აგრო-ბირჟის განაცხადი' || Boolean(row.description?.includes('აგრო-ბირჟა:'));
    const isGrain = (row: { category?: string | null; description?: string | null }) =>
      row.category === 'მარცვლეულის განაცხადი' || Boolean(row.description?.includes('მარცვლეული:'));
    const isLostFound = (row: { category?: string | null }) => row.category === 'დაკარგული/ნაპოვნი';
    const isService = (row: { category?: string | null }) => row.category === 'ოსტატი/სპეციალისტი' || row.category === 'ოსტატი' || row.category === 'სერვისი';
    const isServiceRequest = (row: { category?: string | null }) => row.category === SERVICE_REQUEST_CATEGORY;

    const pendingQueues = {
      regularAnnouncements: pendingRows.filter((row) => !isAgro(row) && !isGrain(row) && !isLostFound(row) && !isService(row) && !isServiceRequest(row)).length,
      agro: pendingRows.filter(isAgro).length,
      grain: pendingRows.filter(isGrain).length,
      lostFound: pendingRows.filter(isLostFound).length + (pendingLostFound ?? 0),
      services: pendingRows.filter(isService).length + (pendingMasters ?? 0),
      serviceRequests: pendingRows.filter(isServiceRequest).length,
    };

    return NextResponse.json({
      usersCount: usersCount ?? 0,
      activeAnnouncements: activeAnnouncements ?? 0,
      pendingAnnouncements: pendingAnnouncements ?? 0,
      pendingQueues,
      email: user.email ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message ?? 'Unknown error' }, { status: 500 });
  }
}
