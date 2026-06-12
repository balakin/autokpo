import { Button, Card, Link, Separator } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { usePostHog } from '@posthog/react';
import { FaGithub, FaGoogle } from 'react-icons/fa6';
import { useNavigate } from 'react-router';

import { useLocale } from '../i18n/use-locale';
import { getLegalLinks } from '../legal/legal-links';

import { requestEmailOtpSession, startOAuthFlow } from './auth-session';
import { AuthShell } from './auth-shell';
import { EmailForm } from './email-form';
import { useAuthEmail } from './use-auth-email';

export function AuthEntry() {
  const authEmail = useAuthEmail();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const legalLinks = getLegalLinks(locale);

  async function requestOtp(email: string, captchaToken: string) {
    const normalizedEmail = email.trim();
    authEmail.setEmail(normalizedEmail);
    await requestEmailOtpSession(normalizedEmail, captchaToken);
    void navigate('/sign-in/code');
  }

  function startSocialSignIn(provider: 'google' | 'github') {
    // Capture before the redirect leaves our origin. We can't stitch this to
    // the post-redirect `social_auth_completed` (the callback is a fresh page
    // load with a new anonymous id), so these are read as population counts:
    // completed ÷ started as an aggregate conversion proxy.
    posthog.capture('social_auth_started', { provider });
    void startOAuthFlow(provider);
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-lg gap-3 border-border bg-surface p-4 shadow-overlay sm:p-6">
        <Card.Header className="gap-1 pb-1">
          <Card.Title className="text-2xl/tight  font-bold tracking-tight">
            <Trans>Dobrodošli</Trans>
          </Card.Title>
          <Card.Description className="text-base">
            <Trans>Izaberite način prijave.</Trans>
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-6 pt-1">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                fullWidth
                variant="secondary"
                onPress={() => startSocialSignIn('google')}
              >
                <FaGoogle aria-hidden="true" className="size-4" />
                <Trans>Prijava Google</Trans>
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onPress={() => startSocialSignIn('github')}
              >
                <FaGithub aria-hidden="true" className="size-4" />
                <Trans>Prijava GitHub</Trans>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-muted uppercase">
            <Separator className="flex-1" />
            <span>
              <Trans>ili</Trans>
            </span>
            <Separator className="flex-1" />
          </div>

          <div>
            <h2 className="text-sm font-semibold">
              <Trans>Jednokratni kod</Trans>
            </h2>
            <p className="mt-1 text-sm text-muted">
              <Trans>Poslaćemo vam kod za prijavu na email.</Trans>
            </p>
            <EmailForm email={authEmail.email} onSubmit={requestOtp} />
            <p className="mt-3 text-center text-xs/relaxed text-balance text-muted">
              <Trans>
                Nastavkom prijave prihvatate{' '}
                <Link
                  href={legalLinks.terms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                >
                  Uslove korišćenja
                </Link>{' '}
                i potvrđujete da ste pročitali{' '}
                <Link
                  href={legalLinks.privacy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                >
                  Politiku privatnosti
                </Link>
                .
              </Trans>
            </p>
          </div>
        </Card.Content>
      </Card>
    </AuthShell>
  );
}
