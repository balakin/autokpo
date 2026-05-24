import { Button, Card, Separator } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { FaGithub, FaGoogle } from 'react-icons/fa6';
import { useNavigate } from 'react-router';

import { requestEmailOtpSession, startOAuthFlow } from './auth-session';
import { AuthShell } from './auth-shell';
import { EmailForm } from './email-form';
import { useAuthEmail } from './use-auth-email';

export function AuthEntry() {
  const authEmail = useAuthEmail();
  const navigate = useNavigate();

  async function requestOtp(email: string, captchaToken: string) {
    const normalizedEmail = email.trim();
    authEmail.setEmail(normalizedEmail);
    await requestEmailOtpSession(normalizedEmail, captchaToken);
    void navigate('/sign-in/code');
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-md gap-3 border-border bg-surface p-4 shadow-overlay sm:p-6">
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
                onPress={() => void startOAuthFlow('google')}
              >
                <FaGoogle aria-hidden="true" className="size-4" />
                <Trans>Prijava Google</Trans>
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onPress={() => void startOAuthFlow('github')}
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
          </div>
        </Card.Content>
      </Card>
    </AuthShell>
  );
}
