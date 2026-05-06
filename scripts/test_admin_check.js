// Assertion-based test runner for the admin detection logic used in app/lib/adminAuth.ts.
// This mock intentionally avoids importing Supabase runtime types.

const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? 'listed@example.com';
const adminEmails = adminEnv
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isGoogleUserMock(user) {
  const appMetadata = user?.app_metadata ?? {};
  const userMetadata = user?.user_metadata ?? {};
  const provider = (appMetadata.provider ?? userMetadata.provider) || null;
  if (provider === 'google') return true;
  const identities = user?.identities;
  return Array.isArray(identities) && identities.some((identity) => identity && identity.provider === 'google');
}

function getRoles(meta) {
  if (!meta || typeof meta !== 'object') return [];
  const roles = meta.roles;
  if (!Array.isArray(roles)) return [];
  return roles.filter((role) => typeof role === 'string');
}

function isAdminUser(user) {
  if (!user) return false;
  const userMetadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};

  const emailRaw = typeof user.email === 'string'
    ? user.email
    : (typeof userMetadata.email === 'string' ? userMetadata.email : null);
  const email = emailRaw ? emailRaw.toLowerCase() : null;

  if (email && adminEmails.length > 0 && adminEmails.includes(email)) {
    return true;
  }

  const userRoles = getRoles(userMetadata);
  const appRoles = getRoles(appMetadata);

  return (
    userMetadata.role === 'admin' ||
    appMetadata.role === 'admin' ||
    userMetadata.is_admin === true ||
    appMetadata.is_admin === true ||
    userRoles.includes('admin') ||
    appRoles.includes('admin')
  );
}

function runTests() {
  console.log('NEXT_PUBLIC_ADMIN_EMAILS =', adminEnv);

  const tests = [
    {
      name: 'Admin via user_metadata.role',
      user: { email: 'admin1@example.com', user_metadata: { role: 'admin' }, app_metadata: {} },
      expected: true,
    },
    {
      name: 'Admin via app_metadata.roles array',
      user: { email: 'admin2@example.com', user_metadata: {}, app_metadata: { roles: ['admin'] } },
      expected: true,
    },
    {
      name: 'Admin via is_admin flag',
      user: { email: 'admin3@example.com', user_metadata: { is_admin: true }, app_metadata: {} },
      expected: true,
    },
    {
      name: 'Admin via NEXT_PUBLIC_ADMIN_EMAILS allowlist',
      user: { email: 'listed@example.com', user_metadata: {}, app_metadata: {}, identities: [] },
      expected: adminEmails.includes('listed@example.com'),
    },
    {
      name: 'Admin allowlist is case-insensitive',
      user: { email: 'LISTED@example.com', user_metadata: {}, app_metadata: {}, identities: [] },
      expected: adminEmails.includes('listed@example.com'),
    },
    {
      name: 'Non-admin user',
      user: { email: 'user@example.com', user_metadata: {}, app_metadata: {} },
      expected: false,
    },
    {
      name: 'Null user',
      user: null,
      expected: false,
    },
  ];

  let failures = 0;
  for (const test of tests) {
    const actual = isAdminUser(test.user);
    if (actual !== test.expected) {
      failures += 1;
      console.error(`✗ ${test.name}: expected ${test.expected}, got ${actual}`);
    } else {
      console.log(`✓ ${test.name}`);
    }
  }

  if (failures > 0) {
    console.error(`${failures} admin auth test(s) failed.`);
    process.exit(1);
  }

  console.log(`${tests.length} admin auth tests passed.`);
}

runTests();
