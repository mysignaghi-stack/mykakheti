'use server';

import { createClient } from '../lib/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isAdminUser } from '../lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type AdminDashboardStats = {
  usersCount: number;
  activeAnnouncements: number;
  pendingAnnouncements: number;
  email: string | null;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  try {
    const authClient = await createClient();
    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError) {
      console.error('Auth error in getAdminDashboardStats:', userError);
      if (userError.message?.includes('refresh_token_not_found') ||
          userError.message?.includes('Invalid Refresh Token') ||
          userError.message?.includes('Refresh Token Not Found') ||
          userError.message?.includes('Auth session missing')) {
        console.log('Invalid or missing auth session detected, returning null');
        return null;
      }
      throw userError;
    }

    if (!user || !isAdminUser(user)) {
      console.log('User not found or not admin, returning null');
      return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        usersCount: 0,
        activeAnnouncements: 0,
        pendingAnnouncements: 0,
        email: user.email ?? null,
      };
    }

    const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const [{ count: usersCount }, { count: activeAnnouncements }, { count: pendingAnnouncements }] = await Promise.all([
      serviceClient.schema('auth').from('users').select('id', { count: 'exact', head: true }),
      serviceClient
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true)
        .or('is_archived.is.null,is_archived.eq.false'),
      serviceClient
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false),
    ]);

    return {
    usersCount: usersCount ?? 0,
    activeAnnouncements: activeAnnouncements ?? 0,
    pendingAnnouncements: pendingAnnouncements ?? 0,
    email: user.email ?? null,
  };
  } catch (error) {
    console.error('Unexpected error in getAdminDashboardStats:', error);
    return null;
  }
}

export async function refreshAdminDashboard() {
  revalidatePath('/admin');
}

export async function adminSignOut() {
  const authClient = await createClient();
  await authClient.auth.signOut();
  redirect('/admin/login');
}
