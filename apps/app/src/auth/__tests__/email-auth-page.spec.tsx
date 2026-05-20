import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useImperativeHandle } from 'react';
import type { Ref } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { I18nWrapper, LocationDisplay } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../auth-context';
import { AuthEmailContext } from '../auth-email-context';
import { EmailAuthPage } from '../email-auth-page';

const signInEmailOtpMock = vi.hoisted(() => vi.fn());
const sendVerificationOtpMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock('../auth-client', () => ({
  authClient: {
    getSession: getSessionMock,
    signIn: { emailOtp: signInEmailOtpMock },
    emailOtp: { sendVerificationOtp: sendVerificationOtpMock },
  },
}));

vi.mock('../hidden-turnstile', () => ({
  HiddenTurnstile({ ref }: { ref?: Ref<unknown> }) {
    useImperativeHandle(ref, () => ({
      getResponse: () => 'mock-turnstile-token',
      getResponsePromise: () => Promise.resolve('mock-turnstile-token'),
      reset: vi.fn(),
    }));
    return null;
  },
}));

const emailContext = { email: 'user@example.com', setEmail: vi.fn() };
const authContext = {
  user: null,
  refresh: refreshMock,
  logout: vi.fn(),
};

function setup(initialCooldown?: number) {
  const router = createMemoryRouter(
    [
      {
        path: '/sign-in/code',
        element: <EmailAuthPage initialCooldown={initialCooldown} />,
      },
      { path: '/sign-in', element: <LocationDisplay /> },
      { path: '/dashboard', element: <LocationDisplay /> },
    ],
    { initialEntries: ['/sign-in/code'] },
  );
  render(
    <AuthContext value={authContext}>
      <AuthEmailContext value={emailContext}>
        <I18nWrapper>
          <RouterProvider router={router} />
        </I18nWrapper>
      </AuthEmailContext>
    </AuthContext>,
  );
}

describe('EmailAuthPage', () => {
  beforeEach(() => {
    signInEmailOtpMock.mockReset();
    sendVerificationOtpMock.mockReset();
    getSessionMock.mockReset();
    refreshMock.mockReset();
    signInEmailOtpMock.mockResolvedValue(undefined);
    sendVerificationOtpMock.mockResolvedValue(undefined);
    refreshMock.mockResolvedValue('user-1');
  });

  it('verifies otp and navigates to /dashboard', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText('Jednokratni kod'), '123456');

    await waitFor(() =>
      expect(signInEmailOtpMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        otp: '123456',
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByLabelText('current-location')).toHaveTextContent(
        '/dashboard',
      ),
    );
  });

  it('shows verify error on invalid code', async () => {
    const user = userEvent.setup();
    signInEmailOtpMock.mockRejectedValue(new Error('invalid otp'));
    setup();

    await user.type(screen.getByLabelText('Jednokratni kod'), '123456');

    await waitFor(() => {
      expect(
        screen.getByText('Kod nije važeći ili je istekao.'),
      ).toBeInTheDocument();
    });
  });

  it('requests resend email code after cooldown', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup();
    setup(1);

    expect(
      screen.queryByRole('link', { name: 'Pošalji ponovo' }),
    ).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTime(1000));
    vi.useRealTimers();

    await user.click(screen.getByRole('link', { name: 'Pošalji ponovo' }));
    await waitFor(() =>
      expect(sendVerificationOtpMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        type: 'sign-in',
        fetchOptions: {
          headers: {
            'X-Preferred-Locale': 'sr-Latn',
            'x-captcha-response': 'mock-turnstile-token',
          },
        },
      }),
    );
  });
});
