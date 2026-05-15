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

type AuthUsersCounterClient = {
  auth: {
    admin: {
      listUsers: (params: { page: number; perPage: number }) => Promise<{
        data: { users?: unknown[]; total?: unknown; lastPage?: unknown } | null;
        error: Error | null;
      }>;
    };
  };
};

async function countAuthUsers(client: AuthUsersCounterClient) {
  const perPage = 1000;
  let page = 1;
  let countedUsers = 0;

  while (page <= 100) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    const reportedTotal = typeof (data as { total?: unknown })?.total === 'number'
      ? (data as { total: number }).total
      : 0;

    if (reportedTotal > 0) return reportedTotal;

    countedUsers += users.length;

    const lastPage = typeof (data as { lastPage?: unknown })?.lastPage === 'number'
      ? (data as { lastPage: number }).lastPage
      : 0;

    if (users.length < perPage || (lastPage > 0 && page >= lastPage)) {
      return countedUsers;
    }

    page += 1;
  }

  return countedUsers;
}

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

    const [usersCount, { count: activeAnnouncements }, { count: pendingAnnouncements }] = await Promise.all([
      countAuthUsers(serviceClient),
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
