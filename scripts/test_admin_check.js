// Simple test runner to validate admin detection logic used in app/lib/adminAuth.ts
// This replicates the isAdminUser checks (without depending on supabase types)

const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
const adminEmails = adminEnv
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isGoogleUserMock(user) {
  const am = user?.app_metadata ?? {};
  const um = user?.user_metadata ?? {};
  const provider = (am.provider ?? um.provider) || null;
  if (provider === 'google') return true;
  const identities = user?.identities;
  return Array.isArray(identities) && identities.some((i) => i && i.provider === 'google');
}

function getRoles(meta) {
  if (!meta || typeof meta !== 'object') return [];
  const roles = meta.roles;
  if (!Array.isArray(roles)) return [];
  return roles.filter((r) => typeof r === 'string');
}

function isAdminUser(user) {
  if (!user) return false;
  const um = user.user_metadata ?? {};
  const am = user.app_metadata ?? {};

  const emailRaw = typeof user.email === 'string' ? user.email : (typeof um.email === 'string' ? um.email : null);
  const email = emailRaw ? emailRaw.toLowerCase() : null;

  if (email && adminEmails.length > 0 && isGoogleUserMock(user) && adminEmails.includes(email)) {
    return true;
  }

  const rolesU = getRoles(um);
  const rolesA = getRoles(am);

  const result = (
    um.role === 'admin' ||
    am.role === 'admin' ||
    um.is_admin === true ||
    am.is_admin === true ||
    rolesU.includes('admin') ||
    rolesA.includes('admin')
  );

  return result;
}

function runTests() {
  console.log('NEXT_PUBLIC_ADMIN_EMAILS =', adminEnv);

  const tests = [
    {
      name: 'Admin via user_metadata.role',
      user: { email: 'admin1@example.com', user_metadata: { role: 'admin' }, app_metadata: {} },
      expect: true,
    },
    {
      name: 'Admin via app_metadata.roles array',
      user: { email: 'admin2@example.com', user_metadata: {}, app_metadata: { roles: ['admin'] } },
      expect: true,
    },
    {
      name: 'Admin via is_admin flag',
      user: { email: 'admin3@example.com', user_metadata: { is_admin: true }, app_metadata: {} },
      expect: true,
    },
    {
      name: 'Admin via NEXT_PUBLIC_ADMIN_EMAILS + google identity',
      user: { email: 'listed@example.com', user_metadata: {}, app_metadata: { provider: 'google' }, identities: [] },
      expect: adminEmails.includes('listed@example.com'),
    },
    {
      name: 'Non-admin user',
      user: { email: 'user@example.com', user_metadata: {}, app_metadata: {} },
      expect: false,
    },
    {
      name: 'Null user',
      user: null,
      expect: false,
    },
  ];

  tests.forEach((t) => {
    const got = isAdminUser(t.user);
    console.log(t.name + ':', got, '| expected:', t.expect);
  });
}

runTests();
