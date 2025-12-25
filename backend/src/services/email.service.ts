import config from '@/config';
import { log } from '@/utils/logger';

interface VerificationEmailPayload {
  email: string;
  code: string;
}

export async function sendVerificationEmail({ email, code }: VerificationEmailPayload): Promise<void> {
  if (!config.resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const body = {
    from: `${config.emailFromName} <${config.emailFrom}>`,
    to: [email],
    subject: 'Verify your email to finish setting up Fin-Bank',
    text: `Your verification code: ${code}\nThis code expires in 10 minutes.`,
    html: `<p>Your verification code:</p><p style="font-size:24px;font-weight:700;letter-spacing:6px;">${code}</p><p>This code expires in 10 minutes.</p>`,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    log.error('Resend verification email failed', { status: response.status, body: text });
    throw new Error('Failed to send verification email');
  }

  log.info('Verification email sent', { email });
}
