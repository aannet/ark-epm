import { request, type APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = process.env.API_USER_EMAIL || 'admin@ark.io';
const ADMIN_PASSWORD = process.env.API_USER_PASSWORD || 'admin123456';
const READONLY_EMAIL = 'readonly@ark.io';
const READONLY_PASSWORD = 'readonly123456';

type ApiListItem = Record<string, unknown>;

function toItems(payload: unknown): ApiListItem[] {
  if (Array.isArray(payload)) return payload as ApiListItem[];
  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as ApiListItem[];
  }
  return [];
}

function toErrorMessage(status: number, bodyText: string): string {
  const compactBody = bodyText.replace(/\s+/g, ' ').trim();
  return `status=${status}${compactBody ? ` body=${compactBody}` : ''}`;
}

async function loginAndGetToken(ctx: APIRequestContext, email: string, password: string): Promise<string | null> {
  const loginRes = await ctx.post('auth/login', { data: { email, password } });
  if (!loginRes.ok()) return null;
  const payload = (await loginRes.json()) as { accessToken?: string };
  return payload.accessToken || null;
}

async function ensureReadOnlyRole(authedCtx: APIRequestContext): Promise<string> {
  const rolesRes = await authedCtx.get('roles');
  if (!rolesRes.ok()) {
    throw new Error(`[global-setup] Cannot list roles: ${toErrorMessage(rolesRes.status(), await rolesRes.text())}`);
  }

  const rolesPayload = await rolesRes.json();
  const existingRole = toItems(rolesPayload).find((role) => role.name === 'ReadOnly') as
    | { id?: string }
    | undefined;

  let roleId = existingRole?.id;
  if (!roleId) {
    const createRoleRes = await authedCtx.post('roles', {
      data: {
        name: 'ReadOnly',
        description: 'Read-only access to all resources',
      },
    });

    if (!createRoleRes.ok()) {
      throw new Error(
        `[global-setup] Cannot create ReadOnly role: ${toErrorMessage(createRoleRes.status(), await createRoleRes.text())}`,
      );
    }

    const createRolePayload = (await createRoleRes.json()) as { id?: string };
    roleId = createRolePayload.id;
  }

  if (!roleId) {
    throw new Error('[global-setup] ReadOnly role id is missing');
  }

  const permissionsRes = await authedCtx.get('permissions');
  if (!permissionsRes.ok()) {
    throw new Error(
      `[global-setup] Cannot list permissions: ${toErrorMessage(permissionsRes.status(), await permissionsRes.text())}`,
    );
  }

  const permissionsPayload = await permissionsRes.json();
  const readPermissionIds = toItems(permissionsPayload)
    .filter((permission) => typeof permission.name === 'string' && permission.name.endsWith(':read'))
    .map((permission) => permission.id)
    .filter((permissionId): permissionId is string => typeof permissionId === 'string');

  if (readPermissionIds.length === 0) {
    throw new Error('[global-setup] No :read permissions found');
  }

  const assignPermissionsRes = await authedCtx.put(`roles/${roleId}/permissions`, {
    data: { permissionIds: readPermissionIds },
  });

  if (!assignPermissionsRes.ok()) {
    throw new Error(
      `[global-setup] Cannot assign ReadOnly permissions: ${toErrorMessage(assignPermissionsRes.status(), await assignPermissionsRes.text())}`,
    );
  }

  return roleId;
}

async function ensureReadOnlyUser(authedCtx: APIRequestContext, readOnlyRoleId: string): Promise<void> {
  const usersRes = await authedCtx.get('users');
  if (!usersRes.ok()) {
    throw new Error(`[global-setup] Cannot list users: ${toErrorMessage(usersRes.status(), await usersRes.text())}`);
  }

  const usersPayload = await usersRes.json();
  const existingUser = toItems(usersPayload).find((user) => user.email === READONLY_EMAIL) as
    | { id?: string; roleId?: string | null; isActive?: boolean | null }
    | undefined;

  if (!existingUser?.id) {
    const createUserRes = await authedCtx.post('users', {
      data: {
        email: READONLY_EMAIL,
        password: READONLY_PASSWORD,
        firstName: 'Read',
        lastName: 'Only',
        roleId: readOnlyRoleId,
      },
    });

    if (!createUserRes.ok()) {
      throw new Error(
        `[global-setup] Cannot create readonly user: ${toErrorMessage(createUserRes.status(), await createUserRes.text())}`,
      );
    }

    return;
  }

  if (existingUser.roleId !== readOnlyRoleId || existingUser.isActive === false) {
    const patchUserRes = await authedCtx.patch(`users/${existingUser.id}`, {
      data: {
        roleId: readOnlyRoleId,
        isActive: true,
      },
    });

    if (!patchUserRes.ok()) {
      throw new Error(
        `[global-setup] Cannot update readonly user: ${toErrorMessage(patchUserRes.status(), await patchUserRes.text())}`,
      );
    }
  }
}

async function globalSetup() {
  const apiBaseUrl = `${process.env.API_BASE_URL || 'http://localhost:3001'}${process.env.API_VERSION || '/api/v1'}`.replace(/\/$/, '') + '/';

  const anonymousCtx = await request.newContext({ baseURL: apiBaseUrl });
  let adminCtx: APIRequestContext | null = null;

  try {
    // AGENT-DECISION: [qa] — provision readonly account at test startup so read-only specs fail on regressions instead of skipping.
    const existingReadonlyToken = await loginAndGetToken(anonymousCtx, READONLY_EMAIL, READONLY_PASSWORD);
    if (existingReadonlyToken) {
      console.log('[global-setup] readonly account already available.');
      return;
    }

    const adminToken = await loginAndGetToken(anonymousCtx, ADMIN_EMAIL, ADMIN_PASSWORD);
    if (!adminToken) {
      throw new Error('[global-setup] Cannot authenticate admin account for readonly provisioning');
    }

    adminCtx = await request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${adminToken}` },
    });

    const readOnlyRoleId = await ensureReadOnlyRole(adminCtx);
    await ensureReadOnlyUser(adminCtx, readOnlyRoleId);

    const verifiedReadonlyToken = await loginAndGetToken(anonymousCtx, READONLY_EMAIL, READONLY_PASSWORD);
    if (!verifiedReadonlyToken) {
      throw new Error('[global-setup] Readonly account provisioning completed but login still fails');
    }

    console.log('[global-setup] readonly account provisioned successfully.');
  } finally {
    await anonymousCtx.dispose();
    if (adminCtx) {
      await adminCtx.dispose();
    }
  }
}

export default globalSetup;
