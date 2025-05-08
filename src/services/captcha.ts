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
  const payload = {
    secret: captchaSecret,
    response: captchaToken,
    remoteip: requestorIp,
  };

  console.log('payload', payload);

  const response = await axios.post<CaptchaResponse>(
    `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
    payload,
  );
  const captchaResult = response.data;
  console.log('captchaResult', captchaResult);
  return captchaResult;
}
