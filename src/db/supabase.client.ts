import type { AstroCookies } from 'astro';
import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY, SUPABASE_SERVICE_ROLE_KEY } from 'astro:env/server';

export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
};

type SupabaseContext = {
  headers: Headers;
  cookies: AstroCookies;
};

const createSupabaseInstance = (apiKey: string, context: SupabaseContext) => {
  return createServerClient(SUPABASE_URL, apiKey, {
    cookieOptions,
    cookies: {
      // @ts-expect-error - correct implementation per Supabase docs
      getAll() {
        const cookieHeader = context.headers.get('Cookie') ?? '';
        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          context.cookies.set(name, value, options),
        );
      },
    },
  });
};

export const createSupabaseServerInstance = (context: SupabaseContext) => {
  return createSupabaseInstance(SUPABASE_PUBLIC_KEY, context);
};

export const createSupabaseAdminInstance = (context: SupabaseContext) => {
  return createSupabaseInstance(SUPABASE_SERVICE_ROLE_KEY, context);
};
