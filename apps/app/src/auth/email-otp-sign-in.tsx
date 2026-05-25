import { Button, InputOTP, Link, REGEXP_ONLY_DIGITS } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { LuArrowLeft } from 'react-icons/lu';

export const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

export interface EmailOtpSignInProps {
  email: string;
  initialCooldown?: number;
  onRequestOtp: (email: string) => Promise<void>;
  onVerifyOtp: (email: string, otp: string) => Promise<void>;
  onBackToRequest?: () => void;
}

export function EmailOtpSignIn({
  email,
  initialCooldown = RESEND_COOLDOWN_SECONDS,
  onRequestOtp,
  onVerifyOtp,
  onBackToRequest,
}: EmailOtpSignInProps) {
  const { t } = useLingui();
  const [otp, setOtp] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(initialCooldown);

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setResendSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [resendSecondsLeft]);

  async function requestOtp() {
    if (isRequestingOtp) {
      return;
    }

    setEmailError(null);
    setOtp('');
    setIsRequestingOtp(true);
    try {
      await onRequestOtp(email.trim());
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch {
      setEmailError(t`Nismo uspeli da pošaljemo kod. Pokušajte ponovo.`);
    } finally {
      setIsRequestingOtp(false);
    }
  }

  useEffect(() => {
    if (otp.length !== OTP_LENGTH) {
      return;
    }

    void onVerifyOtp(email.trim(), otp.trim())
      .then(() => {
        setEmailError(null);
      })
      .catch(() => {
        setEmailError(t`Kod nije važeći ili je istekao.`);
      });
  }, [otp, email, onVerifyOtp, t]);

  return (
    <div className="flex flex-col gap-1.5">
      <InputOTP
        autoFocus
        aria-describedby={emailError ? 'otp-error' : undefined}
        aria-label={t`Jednokratni kod`}
        inputMode="numeric"
        isInvalid={!!emailError}
        maxLength={OTP_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        value={otp}
        onChange={setOtp}
      >
        <InputOTP.Group>
          <InputOTP.Slot index={0} />
          <InputOTP.Slot index={1} />
          <InputOTP.Slot index={2} />
          <InputOTP.Slot index={3} />
          <InputOTP.Slot index={4} />
          <InputOTP.Slot index={5} />
        </InputOTP.Group>
      </InputOTP>
      {!!emailError && (
        <span
          data-visible="true"
          className="text-sm text-danger"
          id="otp-error"
        >
          {emailError}
        </span>
      )}
      <div className="mt-2.5">
        <span className="text-sm text-muted">
          {resendSecondsLeft > 0 ? (
            <Trans>Možete poslati kod ponovo za {resendSecondsLeft}s</Trans>
          ) : (
            <Trans>Niste dobili kod?</Trans>
          )}
        </span>{' '}
        {resendSecondsLeft === 0 && (
          <Link
            className="text-sm underline underline-offset-2"
            isDisabled={isRequestingOtp}
            onPress={() => void requestOtp()}
          >
            <Trans>Pošalji ponovo</Trans>
          </Link>
        )}
      </div>
      <div className="mt-4">
        <Button
          variant="ghost"
          className="-ml-2 h-8 px-2 text-sm text-muted"
          onPress={() => onBackToRequest?.()}
        >
          <LuArrowLeft className="size-4" aria-hidden="true" />
          <Trans>Nazad</Trans>
        </Button>
      </div>
    </div>
  );
}
