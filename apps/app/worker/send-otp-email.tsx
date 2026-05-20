import { msg } from '@lingui/core/macro';
import { Resend } from 'resend';

import OtpEmail from '../emails/otp-email';

import { createI18n, isWorkerLocale } from './i18n';

export async function sendOtpEmail(
  apiKey: string,
  from: string,
  to: string,
  otp: string,
  locale: string,
): Promise<void> {
  const workerLocale = isWorkerLocale(locale) ? locale : 'sr-Latn';
  const i18n = createI18n(workerLocale);
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: i18n._(msg`Vaš AutoKPO kod za prijavu`),
    react: (
      <OtpEmail
        otp={otp}
        i18n={{
          preview: i18n._(msg`Vaš AutoKPO kod za prijavu`),
          bodyText: i18n._(
            msg`Koristite sledeći kod za prijavu na vaš AutoKPO nalog:`,
          ),
          footer: i18n._(
            msg`Kod važi 5 minuta. Ako niste tražili ovaj kod, ignorišite ovu poruku.`,
          ),
        }}
      />
    ),
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}
