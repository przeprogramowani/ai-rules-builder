/**
 * Guard to verify Cloudflare Turnstile captcha before executing the handler
 */

import type { APIRoute, APIContext } from 'astro';
import { verifyCaptcha } from '@/services/captcha';
import { CF_CAPTCHA_SECRET_KEY } from 'astro:env/server';
import { errorResponse, validationError } from '../utils/apiResponse';
import { getClientIp } from '../utils/supabaseHelpers';

/**
 * Extended API context with parsed request body
 */
export type CaptchaContext<T = Record<string, unknown>> = APIContext & {
  /**
   * The parsed request body with captchaToken removed
   */
  body: Omit<T, 'captchaToken'>;
  /**
   * The verified captcha token
   */
  captchaToken: string;
};

/**
 * API route handler with captcha verification
 */
export type CaptchaAPIRoute<T = Record<string, unknown>> = (
  context: CaptchaContext<T>,
) => Response | Promise<Response>;

/**
 * Wrap an API route handler with captcha verification
 *
 * This middleware:
 * 1. Parses the request body
 * 2. Extracts and verifies the captchaToken
 * 3. Passes the parsed body (without captchaToken) to the handler
 * 4. Returns an error if captcha verification fails
 *
 * @param handler - The API route handler to execute after captcha verification
 *
 * @example
 * export const POST: APIRoute = withCaptcha<{ email: string; password: string }>(
 *   async ({ body, captchaToken, cookies }) => {
 *     // body.captchaToken is not present - it's been verified and removed
 *     // The captchaToken is available as a separate parameter
 *     const { email, password } = body;
 *     return successResponse({ message: 'Success' });
 *   }
 * );
 */
export function withCaptcha<T extends { captchaToken: string }>(
  handler: CaptchaAPIRoute<T>,
): APIRoute {
  return async (context: APIContext) => {
    try {
      // Parse request body
      const body = (await context.request.json()) as T;

      // Check if captchaToken is present
      if (!body.captchaToken) {
        return validationError('Captcha token is required');
      }

      // Verify captcha
      const requestorIp = getClientIp(context.request);
      const captchaResult = await verifyCaptcha(
        CF_CAPTCHA_SECRET_KEY,
        body.captchaToken,
        requestorIp,
      );

      if (!captchaResult.success) {
        return errorResponse('Security verification failed. Please try again.', 400, {
          type: 'captcha_failed',
          errorCodes: captchaResult['error-codes'],
        });
      }

      // Extract captchaToken and pass the rest to handler
      const { captchaToken, ...restBody } = body;

      // Create extended context
      const captchaContext: CaptchaContext<T> = {
        ...context,
        body: restBody as Omit<T, 'captchaToken'>,
        captchaToken,
      };

      return handler(captchaContext);
    } catch (err) {
      // Handle JSON parsing errors
      if (err instanceof SyntaxError) {
        return validationError('Invalid request body');
      }
      throw err;
    }
  };
}

/**
 * Compose withCaptcha with other middleware
 * Useful for combining feature flags with captcha verification
 *
 * @example
 * export const POST: APIRoute = withFeatureFlag('auth',
 *   withCaptcha(async ({ body }) => {
 *     return successResponse({ message: 'Success' });
 *   })
 * );
 */
export { withCaptcha as default };
