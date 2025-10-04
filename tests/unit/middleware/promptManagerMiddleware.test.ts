import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

const mutableEnv = import.meta.env as Record<string, unknown>;
const originalEnv = { ...mutableEnv };

function resetEnv() {
  for (const key of Object.keys(mutableEnv)) {
    if (!(key in originalEnv)) {
      delete mutableEnv[key];
    }
  }

  Object.assign(mutableEnv, originalEnv);
}

vi.mock('@/services/rateLimiter', () => ({
  checkRateLimit: vi.fn(() => true),
  setRateLimitCookie: vi.fn(),
}));

let currentUser: User | null = null;

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: currentUser },
      error: null,
    })),
  },
};

vi.mock('@/db/supabase.client', () => ({
  createSupabaseServerInstance: vi.fn(() => mockSupabaseClient),
}));

const buildPromptManagerContextMock = vi.fn();

vi.mock('@/services/prompt-manager/access', async () => {
  const actual = await vi.importActual<typeof import('@/services/prompt-manager/access')>(
    '@/services/prompt-manager/access',
  );

  return {
    ...actual,
    buildPromptManagerContext: buildPromptManagerContextMock,
  };
});

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: overrides.id ?? 'user-123',
    aud: overrides.aud ?? 'authenticated',
    created_at: overrides.created_at ?? new Date().toISOString(),
    email: overrides.email ?? 'member@example.com',
    phone: overrides.phone ?? '',
    app_metadata: overrides.app_metadata ?? {},
    user_metadata: overrides.user_metadata ?? {},
    role: overrides.role ?? 'authenticated',
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    identities: overrides.identities ?? [],
    factors: overrides.factors ?? [],
    confirmed_at: overrides.confirmed_at ?? new Date().toISOString(),
    email_confirmed_at: overrides.email_confirmed_at ?? new Date().toISOString(),
    phone_confirmed_at: overrides.phone_confirmed_at ?? null,
    last_sign_in_at: overrides.last_sign_in_at ?? new Date().toISOString(),
    app_state: overrides.app_state ?? undefined,
    raw_app_meta_data: overrides.raw_app_meta_data ?? {},
    raw_user_meta_data: overrides.raw_user_meta_data ?? {},
    reauthentication_token: overrides.reauthentication_token ?? null,
    reauthentication_token_sent_at: overrides.reauthentication_token_sent_at ?? null,
    is_anonymous: overrides.is_anonymous ?? false,
    invited_at: overrides.invited_at ?? null,
    email_change_confirm_status: overrides.email_change_confirm_status ?? 0,
    email_change_sent_at: overrides.email_change_sent_at ?? null,
    email_change_token_current: overrides.email_change_token_current ?? null,
    email_change_token_new: overrides.email_change_token_new ?? null,
    email_change: overrides.email_change ?? null,
    phone_change: overrides.phone_change ?? '',
    phone_change_sent_at: overrides.phone_change_sent_at ?? null,
    phone_change_token: overrides.phone_change_token ?? null,
    phone_change_token_current: overrides.phone_change_token_current ?? null,
    phone_change_token_new: overrides.phone_change_token_new ?? null,
    recovery_sent_at: overrides.recovery_sent_at ?? null,
    confirmation_sent_at: overrides.confirmation_sent_at ?? null,
  } as User;
}

function createCookies() {
  const store = new Map<string, string>();
  return {
    get: vi.fn((name: string) => (store.has(name) ? { value: store.get(name)! } : undefined)),
    set: vi.fn((name: string, value: string) => {
      store.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      store.delete(name);
    }),
    has: vi.fn((name: string) => store.has(name)),
  };
}

type MiddlewareFactory = typeof import('@/middleware');

async function loadMiddleware(): Promise<MiddlewareFactory> {
  vi.resetModules();
  return import('@/middleware');
}

function createContext(pathname: string) {
  const url = new URL(`https://example.com${pathname}`);
  const request = new Request(url);
  return {
    cookies: createCookies(),
    url,
    request,
    redirect: (location: string) =>
      new Response(null, {
        status: 302,
        headers: { Location: location },
      }),
    locals: {} as App.Locals,
  } satisfies Parameters<MiddlewareFactory['onRequest']>[0];
}

describe('middleware prompt manager guard', () => {
  beforeEach(() => {
    currentUser = null;
    mockSupabaseClient.auth.getUser.mockClear();
    buildPromptManagerContextMock.mockReset();
    resetEnv();
    mutableEnv.PUBLIC_ENV_NAME = 'local';
    mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED = 'false';
    mutableEnv.PROMPT_MANAGER_ENABLED = 'false';
  });

  it('redirects unauthenticated users to login', async () => {
    const { onRequest } = await loadMiddleware();
    const context = createContext('/prompts');
    const response = await onRequest(context, () => Promise.resolve(new Response('ok')));
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/auth/login');
  });

  it('returns 404 when flag disabled', async () => {
    currentUser = createUser();

    mutableEnv.PROMPT_MANAGER_ENABLED = 'false';
    const { onRequest } = await loadMiddleware();
    const context = createContext('/prompts');
    const response = await onRequest(context, () => Promise.resolve(new Response('ok')));
    expect(response.status).toBe(404);
    expect(buildPromptManagerContextMock).not.toHaveBeenCalled();
  });

  it('blocks prompt routes without organization membership', async () => {
    currentUser = createUser();
    delete mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED;
    mutableEnv.PROMPT_MANAGER_ENABLED = 'true';
    buildPromptManagerContextMock.mockResolvedValue({
      organizations: [],
      activeOrganization: null,
    });
    const { onRequest } = await loadMiddleware();
    const context = createContext('/prompts');
    const response = await onRequest(context, () => Promise.resolve(new Response('ok')));
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/prompts/request-access');
  });

  it('allows prompt route when membership present', async () => {
    currentUser = createUser();
    delete mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED;
    mutableEnv.PROMPT_MANAGER_ENABLED = 'true';
    buildPromptManagerContextMock.mockResolvedValue({
      organizations: [
        { id: 'org-member', slug: 'org-member', name: 'Org Member', role: 'member' },
      ],
      activeOrganization: { id: 'org-member', slug: 'org-member', name: 'Org Member', role: 'member' },
    });
    const { onRequest } = await loadMiddleware();
    const context = createContext('/prompts');
    const response = await onRequest(context, () => Promise.resolve(new Response('ok')));
    expect(response.status).toBe(200);
    expect(context.locals.promptManager?.organizations).toHaveLength(1);
    expect(context.locals.promptManager?.activeOrganization?.slug).toBe('org-member');
  });

  it('redirects member trying to access admin route', async () => {
    currentUser = createUser();
    delete mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED;
    mutableEnv.PROMPT_MANAGER_ENABLED = 'true';
    buildPromptManagerContextMock.mockResolvedValue({
      organizations: [
        { id: 'org-member', slug: 'org-member', name: 'Org Member', role: 'member' },
      ],
      activeOrganization: { id: 'org-member', slug: 'org-member', name: 'Org Member', role: 'member' },
    });
    const { onRequest } = await loadMiddleware();
    const context = createContext('/prompts/admin');
    const response = await onRequest(context, () => Promise.resolve(new Response('ok')));
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/prompts?organization=org-member');
  });

  it('allows admin route for admin members', async () => {
    currentUser = createUser();
    delete mutableEnv.PUBLIC_PROMPT_MANAGER_ENABLED;
    mutableEnv.PROMPT_MANAGER_ENABLED = 'true';
    buildPromptManagerContextMock.mockResolvedValue({
      organizations: [
        { id: 'org-admin', slug: 'org-admin', name: 'Org Admin', role: 'admin' },
      ],
      activeOrganization: { id: 'org-admin', slug: 'org-admin', name: 'Org Admin', role: 'admin' },
    });
    const { onRequest } = await loadMiddleware();
    const context = createContext('/prompts/admin');
    const response = await onRequest(context, () => Promise.resolve(new Response('ok')));
    expect(response.status).toBe(200);
    expect(context.locals.promptManager?.activeOrganization?.slug).toBe('org-admin');
  });
});
