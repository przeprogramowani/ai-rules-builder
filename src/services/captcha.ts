import axios from 'axios';

export interface CaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  'error-codes': string[];
}

export async function verifyCaptcha(
  captchaSecret: string,
  captchaToken: string,
  requestorIp: string,
): Promise<CaptchaResponse> {
  const response = await axios.post<CaptchaResponse>(
    `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
    {
      secret: captchaSecret,
      response: captchaToken,
      remoteip: requestorIp,
    },
  );
  const captchaResult = response.data;
  return captchaResult;
}
