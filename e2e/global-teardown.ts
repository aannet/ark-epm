import { request } from '@playwright/test';

const TEST_PREFIXES = [
  'Test ', 'App ', 'Domain ', 'IC ', 'BC ', 'Provider ',
  'Geography ', 'Data Obj', 'Interface ', 'Duplicate App',
];

async function globalTeardown() {
  const baseURL = `${process.env.API_BASE_URL || 'http://localhost:3001'}${process.env.API_VERSION || '/api/v1'}`;

  const anonCtx = await request.newContext({ baseURL });
  const loginRes = await anonCtx.post('auth/login', {
    data: {
      email: process.env.API_USER_EMAIL || 'admin@ark.io',
      password: process.env.API_USER_PASSWORD || 'admin123456',
    },
  });
  await anonCtx.dispose();

  if (!loginRes.ok()) {
    console.warn('\n[teardown] Could not authenticate — skipping leak check.');
    return;
  }

  const { accessToken } = await loginRes.json();
  const authed = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
  });

  const checks: { label: string; endpoint: string }[] = [
    { label: 'domains',        endpoint: 'domains' },
    { label: 'applications',   endpoint: 'applications?limit=200' },
    { label: 'tag-dimensions', endpoint: 'tag-dimensions' },
  ];

  let leakFound = false;

  for (const { label, endpoint } of checks) {
    const res = await authed.get(endpoint);
    if (!res.ok()) continue;
    const body = await res.json();
    const items: { name: string }[] = Array.isArray(body) ? body : (body.data ?? []);
    const leaked = items.filter(i => TEST_PREFIXES.some(p => i.name?.startsWith(p)));
    if (leaked.length > 0) {
      console.warn(`\n[teardown] CLEANUP LEAK — ${leaked.length} ${label} remaining after tests:`);
      leaked.forEach(i => console.warn(`   • ${i.name}`));
      leakFound = true;
    }
  }

  if (!leakFound) {
    console.log('\n[teardown] No test data leaks detected.');
  }

  await authed.dispose();
}

export default globalTeardown;
