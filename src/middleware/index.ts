import { createSupabaseServerInstance } from '@/db/supabase.client';
import { sequence, defineMiddleware } from 'astro:middleware';
import { checkRateLimit, setRateLimitCookie } from '../services/rateLimiter';

// Define rate limit configurations: path -> seconds
const RATE_LIMIT_CONFIG: { [path: string]: number } = {
  '/api/auth/login': 10,
  '/api/auth/logout': 10,
  '/api/auth/signup': 60,
  '/api/auth/reset-password': 60,
  '/api/auth/update-password': 60,
  '/api/upload-dependencies': 5,
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
  '/privacy/pl',
  '/privacy/en',
];

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
      if (PUBLIC_PATHS.includes(url.pathname)) {
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

      return next();
    } catch (error) {
      console.error('Error in middleware:', error instanceof Error ? error.message : error);
      return next();
    }
  },
);

export const onRequest = sequence(rateLimiter, validateRequest);
