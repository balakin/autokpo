import { msg } from '@lingui/core/macro';
import { Resend } from 'resend';

import AccountDeletedEmail from '../emails/account-deleted-email';

import { createI18n, isWorkerLocale } from './i18n';

export async function sendAccountDeletedEmail(
  apiKey: string,
  from: string,
  to: string,
  locale: string,
): Promise<void> {
  const workerLocale = isWorkerLocale(locale) ? locale : 'sr-Latn';
  const i18n = createI18n(workerLocale);
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: i18n._(msg`Vaš AutoKPO nalog je obrisan`),
    react: (
      <AccountDeletedEmail
        i18n={{
          preview: i18n._(msg`Vaš AutoKPO nalog je obrisan`),
          bodyText: i18n._(
            msg`Vaš AutoKPO nalog je obrisan. Nalog i sinhronizovani podaci povezani sa ovom email adresom su trajno uklonjeni.`,
          ),
          footer: i18n._(msg`Hvala što ste koristili AutoKPO. Prijatno!`),
        }}
      />
    ),
  });

  if (error) {
    throw new Error(`Failed to send account deleted email: ${error.message}`);
  }
}
