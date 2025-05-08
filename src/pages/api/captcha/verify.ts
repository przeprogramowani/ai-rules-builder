import type { APIRoute } from 'astro';
import { verifyCaptcha } from '../../../services/captcha';
import { CF_CAPTCHA_SECRET_KEY } from 'astro:env/server';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { captchaToken } = (await request.json()) as { captchaToken: string };
  try {
    console.log('CF_CAPTCHA_SECRET_KEY', CF_CAPTCHA_SECRET_KEY);
    console.log('captchaToken', captchaToken);

    const requestorIp = request.headers.get('CF-Connecting-IP');

    const captchaVerificationResult = await verifyCaptcha(
      CF_CAPTCHA_SECRET_KEY,
      captchaToken,
      requestorIp || '',
    );

    if (captchaVerificationResult.success) {
      return new Response(
        JSON.stringify({
          success: captchaVerificationResult.success,
          challenge_ts: captchaVerificationResult.challenge_ts,
          hostname: captchaVerificationResult.hostname,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          'error-codes': captchaVerificationResult['error-codes'] || ['unknown-error'],
        }),
        {
          status: 400, // Or an appropriate error status
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  } catch (error) {
    console.error('Captcha verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        'error-codes': ['captcha-verification-failed'],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
