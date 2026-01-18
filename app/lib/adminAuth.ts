import type { User } from '@supabase/supabase-js';

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const um = (user.user_metadata ?? {}) as Record<string, unknown>;
  const am = (user.app_metadata ?? {}) as Record<string, unknown>;

  const emailRaw = (typeof user.email === 'string' ? user.email : (typeof um.email === 'string' ? um.email : null)) ?? null;
  const email = emailRaw ? emailRaw.toLowerCase() : null;
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isGoogleUser = () => {
    const provider = (am.provider ?? um.provider) as string | undefined;
    if (provider === 'google') return true;
    const identities = (user as User & { identities?: Array<{ provider?: string | null }> }).identities;
    return Array.isArray(identities) && identities.some((i) => i?.provider === 'google');
  };

  const getRoles = (meta: unknown) => {
    if (!meta || typeof meta !== 'object') return [] as string[];
    const roles = (meta as { roles?: unknown }).roles;
    if (!Array.isArray(roles)) return [] as string[];
    return roles.filter((role): role is string => typeof role === 'string');
  };

  const rolesU = getRoles(um);
  const rolesA = getRoles(am);

  if (email && adminEmails.length > 0 && isGoogleUser() && adminEmails.includes(email)) {
    return true;
  }

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
