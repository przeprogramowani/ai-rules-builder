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
  const formData = new FormData();
  formData.append('secret', captchaSecret);
  formData.append('response', captchaToken);
  formData.append('remoteip', requestorIp);

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const response = await fetch(url, {
    body: formData,
    method: 'POST',
  });
  const captchaResult = await response.json();
  console.log('captchaResult', captchaResult);
  return captchaResult as CaptchaResponse;
}
