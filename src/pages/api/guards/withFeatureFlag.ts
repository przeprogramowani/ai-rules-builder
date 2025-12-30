/**
 * Guard to check if a feature flag is enabled before executing the handler
 */

import type { APIRoute, APIContext } from 'astro';
import { isFeatureEnabled, type FeatureFlag } from '@/features/featureFlags';
import { forbiddenError } from '../utils/apiResponse';

/**
 * Wrap an API route handler with feature flag checking
 *
 * @param flag - The feature flag to check
 * @param handler - The API route handler to execute if the flag is enabled
 * @param message - Optional custom error message when the feature is disabled
 *
 * @example
 * export const POST: APIRoute = withFeatureFlag('auth', async ({ request }) => {
 *   // This code only runs if the 'auth' feature is enabled
 *   return successResponse({ message: 'Success' });
 * });
 */
export function withFeatureFlag(flag: FeatureFlag, handler: APIRoute, message?: string): APIRoute {
  return async (context: APIContext) => {
    if (!isFeatureEnabled(flag)) {
      const errorMessage =
        message || `${flag.charAt(0).toUpperCase() + flag.slice(1)} is currently disabled`;
      return forbiddenError(errorMessage);
    }

    return handler(context);
  };
}
