/**
 * Supabase client utilities for API routes
 */

import type { AstroCookies } from 'astro';
import { createSupabaseServerInstance, createSupabaseAdminInstance } from '@/db/supabase.client';

/**
 * Context required to create a Supabase client
 */
export type SupabaseContext = {
  cookies: AstroCookies;
  headers: Headers;
};

/**
 * Create a Supabase server instance (user-scoped)
 * Use this for operations that should respect RLS policies
 */
export function createServerClient(context: SupabaseContext) {
  return createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.headers,
  });
}

/**
 * Create a Supabase admin instance (bypasses RLS)
 * Use this for operations that need to bypass RLS policies
 * (e.g., signup, admin operations)
 */
export function createAdminClient(context: SupabaseContext) {
  return createSupabaseAdminInstance({
    cookies: context.cookies,
    headers: context.headers,
  });
}

/**
 * Extract the client IP address from request headers
 * Checks Cloudflare's cf-connecting-ip header first
 */
export function getClientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || '';
}

/**
 * Extract the user agent from request headers
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent');
}

/**
 * Extract the origin from a request URL
 */
export function getOrigin(request: Request): string {
  return new URL(request.url).origin;
}
