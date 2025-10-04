import { createSupabaseServerInstance } from '@/db/supabase.client';
import {
  buildPromptLibraryContext,
  ensurePromptLibraryEnabled,
  hasPromptLibraryAccess,
  hasPromptLibraryAdminAccess,
} from '@/services/prompt-library/access';
import { sequence, defineMiddleware } from 'astro:middleware';
import { checkRateLimit, setRateLimitCookie } from '../services/rateLimiter';

// Define rate limit configurations: path -> seconds
const RATE_LIMIT_CONFIG: { [path: string]: number } = {
  '/api/auth/login': 3,
  '/api/auth/logout': 10,
  '/api/auth/signup': 60,
  '/api/auth/reset-password': 60,
  '/api/auth/update-password': 60,
  '/api/upload-dependencies': 5,
  '/api/invites/validate': 3,
  '/api/invites/redeem': 3,
};

const rateLimiter = defineMiddleware(async ({ cookies, url }, next) => {
  const currentPath = url.pathname;
  let matchedPath: string | undefined;
  let matchedLimit: number | undefined;

  // Find if the current path matches any configured rate-limited paths
  for (const pathPrefix in RATE_LIMIT_CONFIG) {
    if (currentPath.startsWith(pathPrefix)) {
      matchedPath = pathPrefix; // Use the configured prefix as the key for rate limiting
      matchedLimit = RATE_LIMIT_CONFIG[pathPrefix];
      break;
    }
  }

  if (matchedPath && matchedLimit !== undefined) {
    if (checkRateLimit(cookies, matchedPath, matchedLimit)) {
      setRateLimitCookie(cookies, matchedPath, matchedLimit);
      return next();
    }
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return next();
});

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/update-password',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/reset-password',
  '/api/auth/verify-reset-token',
  '/api/captcha/verify',
  '/api/upload-dependencies',
  '/api/invites/validate',
  '/privacy/pl',
  '/privacy/en',
];

const PROMPT_LIBRARY_BASE_PATH = '/prompts';
const PROMPT_LIBRARY_ADMIN_PATH = '/prompts/admin';
const PROMPT_LIBRARY_REQUEST_ACCESS_PATH = '/prompts/request-access';
const PROMPT_LIBRARY_API_PATH = '/api/prompts';

const TEXT_PROMPT_LIBRARY_DISABLED = 'Prompt Library is not available.';

function normalisePath(pathname: string): string {
  if (!pathname.endsWith('/') || pathname === '/') {
    return pathname;
  }
  return pathname.replace(/\/+$/, '') || '/';
}

function isPromptLibraryAdminRoute(pathname: string): boolean {
  const normalised = normalisePath(pathname);
  return (
    normalised === PROMPT_LIBRARY_ADMIN_PATH ||
    normalised.startsWith(`${PROMPT_LIBRARY_ADMIN_PATH}/`)
  );
}

function isPromptLibraryRoute(pathname: string): boolean {
  const normalised = normalisePath(pathname);
  if (isPromptLibraryAdminRoute(normalised)) {
    return true;
  }
  // Exclude request-access page from access checks
  if (normalised === PROMPT_LIBRARY_REQUEST_ACCESS_PATH) {
    return false;
  }
  return (
    normalised === PROMPT_LIBRARY_BASE_PATH ||
    normalised.startsWith(`${PROMPT_LIBRARY_BASE_PATH}/`) ||
    normalised.startsWith(PROMPT_LIBRARY_API_PATH)
  );
}

function promptLibraryFlagDisabledResponse(): Response {
  return new Response(TEXT_PROMPT_LIBRARY_DISABLED, {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

const validateRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    try {
      const supabase = createSupabaseServerInstance({
        cookies,
        headers: request.headers,
      });

      // Attach supabase client to locals
      locals.supabase = supabase;

      // Get user session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Always set user in locals if available, regardless of path
      if (user) {
        locals.user = {
          email: user.email ?? null,
          id: user.id,
        };
      }

      // Skip auth check for public paths
      if (PUBLIC_PATHS.includes(url.pathname) || url.pathname.startsWith('/invites/')) {
        console.log('Skipping auth check for public path:', url.pathname);
        return next();
      }

      // For protected routes, check if user exists
      if (!user) {
        // For API routes, return 401 instead of redirecting
        if (url.pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        // Redirect to login for protected routes
        return redirect('/auth/login');
      }

      const pathname = url.pathname;
      const flagEnabled = ensurePromptLibraryEnabled();
      const isPromptRoute = isPromptLibraryRoute(pathname);
      const isAdminRoute = isPromptLibraryAdminRoute(pathname);

      if (isPromptRoute) {
        const requestedOrganizationSlug = url.searchParams.get('organization');
        locals.promptLibrary = {
          organizations: [],
          activeOrganization: null,
          flagEnabled,
        };

        if (!flagEnabled) {
          return promptLibraryFlagDisabledResponse();
        }

        const context = await buildPromptLibraryContext({
          supabase,
          userId: user.id,
          requestedSlug: requestedOrganizationSlug,
        });

        locals.promptLibrary.organizations = context.organizations;
        locals.promptLibrary.activeOrganization = context.activeOrganization;

        if (!hasPromptLibraryAccess(context.organizations)) {
          return redirect(PROMPT_LIBRARY_REQUEST_ACCESS_PATH);
        }

        if (isAdminRoute && !hasPromptLibraryAdminAccess(context.organizations)) {
          const targetSlug = context.activeOrganization?.slug;
          const targetPath = targetSlug
            ? `${PROMPT_LIBRARY_BASE_PATH}?organization=${encodeURIComponent(targetSlug)}`
            : PROMPT_LIBRARY_BASE_PATH;

          return redirect(targetPath);
        }
      }

      return next();
    } catch (error) {
      console.error('Error in middleware:', error instanceof Error ? error.message : error);
      return next();
    }
  },
);

export const onRequest = sequence(rateLimiter, validateRequest);
