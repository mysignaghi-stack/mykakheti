import type { User } from '@supabase/supabase-js';

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const um = (user as any).user_metadata || {};
  const am = (user as any).app_metadata || {};

  const rolesU: string[] = Array.isArray(um.roles) ? um.roles : [];
  const rolesA: string[] = Array.isArray(am.roles) ? am.roles : [];

  return (
    um.role === 'admin' ||
    am.role === 'admin' ||
    um.is_admin === true ||
    am.is_admin === true ||
    rolesU.includes('admin') ||
    rolesA.includes('admin')
  );
}

export function getAdminIndicators(user: User | null | undefined) {
  if (!user) return { user_metadata: null, app_metadata: null, detected: false };
  const um = (user as any).user_metadata || {};
  const am = (user as any).app_metadata || {};
  return {
    user_metadata: um,
    app_metadata: am,
    detected: isAdminUser(user),
  };
}
