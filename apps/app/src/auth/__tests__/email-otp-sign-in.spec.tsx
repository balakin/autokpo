import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nWrapper } from '../../../tests/app/render-helpers';
import { EmailOtpSignIn } from '../email-otp-sign-in';

describe('EmailOtpSignIn', () => {
  const onRequestOtp = vi.fn();
  const onVerifyOtp = vi.fn();
  const onBackToRequest = vi.fn();

  beforeEach(() => {
    onRequestOtp.mockReset();
    onVerifyOtp.mockReset();
    onBackToRequest.mockReset();
    onRequestOtp.mockResolvedValue(undefined);
    onVerifyOtp.mockResolvedValue(undefined);
  });

  it('calls onVerifyOtp when 6 digits are entered', async () => {
    const user = userEvent.setup();
    render(
      <I18nWrapper>
        <EmailOtpSignIn
          email="user@example.com"
          initialCooldown={0}
          onRequestOtp={onRequestOtp}
          onVerifyOtp={onVerifyOtp}
        />
      </I18nWrapper>,
    );

    await user.type(screen.getByLabelText('Jednokratni kod'), '123456');

    await waitFor(() =>
      expect(onVerifyOtp).toHaveBeenCalledWith('user@example.com', '123456'),
    );
  });

  it('shows error message on verification failure', async () => {
    const user = userEvent.setup();
    onVerifyOtp.mockRejectedValue(new Error('invalid'));
    render(
      <I18nWrapper>
        <EmailOtpSignIn
          email="user@example.com"
          initialCooldown={0}
          onRequestOtp={onRequestOtp}
          onVerifyOtp={onVerifyOtp}
        />
      </I18nWrapper>,
    );

    await user.type(screen.getByLabelText('Jednokratni kod'), '123456');

    expect(
      await screen.findByText('Kod nije važeći ili je istekao.'),
    ).toBeInTheDocument();
  });

  it('calls onBackToRequest when back button clicked', async () => {
    const user = userEvent.setup();
    render(
      <I18nWrapper>
        <EmailOtpSignIn
          email="user@example.com"
          initialCooldown={0}
          onRequestOtp={onRequestOtp}
          onVerifyOtp={onVerifyOtp}
          onBackToRequest={onBackToRequest}
        />
      </I18nWrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Nazad' }));
    expect(onBackToRequest).toHaveBeenCalledTimes(1);
  });

  it('resend link is hidden during cooldown and shown after', async () => {
    vi.useFakeTimers();
    render(
      <I18nWrapper>
        <EmailOtpSignIn
          email="user@example.com"
          initialCooldown={1}
          onRequestOtp={onRequestOtp}
          onVerifyOtp={onVerifyOtp}
        />
      </I18nWrapper>,
    );

    expect(
      screen.queryByRole('link', { name: 'Pošalji ponovo' }),
    ).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTime(1000));
    vi.useRealTimers();

    expect(screen.getByRole('link', { name: 'Pošalji ponovo' })).toBeEnabled();
  });

  it('calls onRequestOtp when resend clicked', async () => {
    const user = userEvent.setup();
    render(
      <I18nWrapper>
        <EmailOtpSignIn
          email="user@example.com"
          initialCooldown={0}
          onRequestOtp={onRequestOtp}
          onVerifyOtp={onVerifyOtp}
        />
      </I18nWrapper>,
    );

    await user.click(screen.getByRole('link', { name: 'Pošalji ponovo' }));

    await waitFor(() =>
      expect(onRequestOtp).toHaveBeenCalledWith('user@example.com'),
    );
  });

  it('shows error when resend fails', async () => {
    const user = userEvent.setup();
    onRequestOtp.mockRejectedValue(new Error('network error'));
    render(
      <I18nWrapper>
        <EmailOtpSignIn
          email="user@example.com"
          initialCooldown={0}
          onRequestOtp={onRequestOtp}
          onVerifyOtp={onVerifyOtp}
        />
      </I18nWrapper>,
    );

    await user.click(screen.getByRole('link', { name: 'Pošalji ponovo' }));

    expect(
      await screen.findByText(
        'Nismo uspeli da pošaljemo kod. Pokušajte ponovo.',
      ),
    ).toBeInTheDocument();
  });
});
