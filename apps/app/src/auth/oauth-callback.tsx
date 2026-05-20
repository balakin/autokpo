import { Button, Spinner } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';

import { refreshSession } from './auth-session';

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
};

const KNOWN_ERROR_CODES = new Set([
  'access_denied',
  'account_not_linked',
  'email_not_found',
  'state_mismatch',
  'please_restart_the_process',
  'missing_session',
]);

type CallbackState = { status: 'loading' } | { status: 'error'; code: string };

export function OAuthCallback() {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CallbackState>(() => {
    const errorCode = searchParams.get('error');
    return errorCode
      ? { status: 'error', code: errorCode }
      : { status: 'loading' };
  });

  useEffect(() => {
    if (state.status === 'error') {
      return;
    }

    void refreshSession().then((userId) => {
      if (!userId) {
        setState({ status: 'error', code: 'missing_session' });
        return;
      }
      void navigate('/dashboard', { replace: true });
    });
  }, [navigate, state.status]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    );
  }

  const providerName = provider ? PROVIDER_NAMES[provider] : undefined;
  const errorCode = state.code;
  const showErrorCode = !KNOWN_ERROR_CODES.has(errorCode);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-danger/30 bg-surface p-8 shadow-lg">
        <h1 className="text-2xl font-semibold">
          {providerName ? (
            <Trans>{providerName} prijava nije bila uspešna.</Trans>
          ) : (
            <Trans>Prijava nije uspela.</Trans>
          )}
        </h1>
        <p className="mt-3 text-foreground/60">
          <OAuthErrorMessage code={errorCode} />
        </p>
        {showErrorCode && (
          <p className="mt-2 text-xs text-foreground/40">{errorCode}</p>
        )}
        <Button
          className="mt-6"
          onPress={() => void navigate('/sign-in', { replace: true })}
        >
          <Trans>Nazad na prijavu</Trans>
        </Button>
      </div>
    </div>
  );
}

function OAuthErrorMessage({ code }: { code: string }) {
  if (code === 'account_not_linked') {
    return (
      <Trans>
        Nalog sa ovom email adresom već postoji. Prijavite se putem jednokratnog
        koda na email.
      </Trans>
    );
  }
  if (code === 'access_denied') {
    return <Trans>Otkazali ste prijavu. Pokušajte ponovo.</Trans>;
  }
  if (code === 'email_not_found') {
    return (
      <Trans>
        Vaš nalog nema javnu email adresu. Prijavite se putem jednokratnog koda
        na email.
      </Trans>
    );
  }
  if (code === 'state_mismatch' || code === 'please_restart_the_process') {
    return <Trans>Sesija je istekla. Pokušajte ponovo.</Trans>;
  }
  if (code === 'missing_session') {
    return <Trans>Prijava nije završena. Pokušajte ponovo.</Trans>;
  }
  return <Trans>Došlo je do greške. Pokušajte ponovo.</Trans>;
}
