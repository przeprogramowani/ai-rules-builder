/**
 * Guard to check if a user is authenticated before executing the handler
 */

import type { APIRoute, APIContext } from 'astro';
import { unauthorizedError } from '../utils/apiResponse';

/**
 * Wrap an API route handler with authentication checking
 *
 * This middleware checks if `locals.user` exists (populated by Astro middleware)
 * and returns a 401 Unauthorized response if the user is not authenticated.
 *
 * @param handler - The API route handler to execute if the user is authenticated
 * @param message - Optional custom error message when not authenticated
 *
 * @example
 * export const GET: APIRoute = withAuth(async ({ locals }) => {
 *   // locals.user is guaranteed to exist here
 *   const userId = locals.user.id;
 *   return successResponse({ userId });
 * });
 */
export function withAuth(handler: APIRoute, message?: string): APIRoute {
  return async (context: APIContext) => {
    if (!context.locals.user) {
      return unauthorizedError(message || 'Unauthorized');
    }

    return handler(context);
  };
}

/**
 * Wrap an API route handler with admin role checking
 *
 * This middleware checks if the user has admin role in the active organization
 * (requires locals.promptLibrary.activeOrganization to be populated)
 *
 * @param handler - The API route handler to execute if the user is an admin
 * @param message - Optional custom error message when not authorized
 *
 * @example
 * export const POST: APIRoute = withAdminRole(async ({ locals }) => {
 *   // User is guaranteed to be an admin here
 *   return successResponse({ message: 'Admin operation successful' });
 * });
 */
export function withAdminRole(handler: APIRoute, message?: string): APIRoute {
  return async (context: APIContext) => {
    // First check if user is authenticated
    if (!context.locals.user) {
      return unauthorizedError('Unauthorized');
    }

    // Check if active organization exists and user has admin role
    if (!context.locals.promptLibrary?.activeOrganization) {
      return unauthorizedError(message || 'No active organization');
    }

    if (context.locals.promptLibrary.activeOrganization.role !== 'admin') {
      return unauthorizedError(message || 'Admin role required');
    }

    return handler(context);
  };
}
