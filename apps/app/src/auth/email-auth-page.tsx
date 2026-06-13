import { Card } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef } from 'react';
import { LuMail } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router';

import { posthog } from '../analytics/posthog';

import { requestEmailOtpSession, verifyEmailOtpSession } from './auth-session';
import { AuthShell } from './auth-shell';
import { EmailOtpSignIn, RESEND_COOLDOWN_SECONDS } from './email-otp-sign-in';
import { HiddenTurnstile } from './hidden-turnstile';
import { useAuth } from './use-auth';
import { useAuthEmail } from './use-auth-email';

function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) return email;
  return email[0] + '***' + email.slice(atIndex);
}

export interface EmailAuthPageProps {
  initialCooldown?: number;
}

export function EmailAuthPage({
  initialCooldown = RESEND_COOLDOWN_SECONDS,
}: EmailAuthPageProps) {
  const auth = useAuth();
  const authEmail = useAuthEmail();
  const navigate = useNavigate();
  const emailAddress = authEmail.email;
  const turnstileRef = useRef<TurnstileInstance>(null);

  if (!emailAddress) {
    return <Navigate to="/sign-in" replace />;
  }

  async function handleRequestOtp(email: string) {
    const token =
      (await turnstileRef.current
        ?.getResponsePromise(5000)
        .catch(() => null)) ?? null;
    if (!token) throw new Error('Captcha token not ready.');
    await requestEmailOtpSession(email, token);
    turnstileRef.current?.reset();
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-md gap-3 border-border bg-surface p-4 shadow-overlay sm:p-6">
        <Card.Header className="gap-2 pb-0">
          <Card.Title className="text-2xl/tight  font-bold tracking-tight">
            <Trans>Potvrdite prijavu</Trans>
          </Card.Title>
          <Card.Description className="text-sm">
            <Trans>Unesite jednokratni kod koji smo poslali na:</Trans>
          </Card.Description>
          <div className="flex items-center gap-2 text-sm">
            <LuMail className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="font-medium">{maskEmail(emailAddress)}</span>
          </div>
        </Card.Header>
        <Card.Content>
          <HiddenTurnstile ref={turnstileRef} />
          <EmailOtpSignIn
            email={emailAddress}
            initialCooldown={initialCooldown}
            onRequestOtp={handleRequestOtp}
            onVerifyOtp={async (email, otp) => {
              await verifyEmailOtpSession(email, otp);
              const userId = await auth.refresh();
              if (!userId) {
                return;
              }

              posthog.capture('sign_in_completed');

              void navigate('/dashboard', { replace: true });
            }}
            onBackToRequest={() => void navigate('/sign-in', { replace: true })}
          />
        </Card.Content>
      </Card>
    </AuthShell>
  );
}
