import type { User } from '@supabase/supabase-js';

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const um = (user.user_metadata ?? {}) as Record<string, unknown>;
  const am = (user.app_metadata ?? {}) as Record<string, unknown>;

  const getRoles = (meta: unknown) => {
    if (!meta || typeof meta !== 'object') return [] as string[];
    const roles = (meta as { roles?: unknown }).roles;
    if (!Array.isArray(roles)) return [] as string[];
    return roles.filter((role): role is string => typeof role === 'string');
  };

  const rolesU = getRoles(um);
  const rolesA = getRoles(am);

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
  const um = (user.user_metadata ?? {}) as Record<string, unknown>;
  const am = (user.app_metadata ?? {}) as Record<string, unknown>;
  return {
    user_metadata: um,
    app_metadata: am,
    detected: isAdminUser(user),
  };
}
