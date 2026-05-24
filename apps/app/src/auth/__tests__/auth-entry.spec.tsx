import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useImperativeHandle } from 'react';
import type { Ref } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { I18nWrapper, LocationDisplay } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthEmailProvider } from '../auth-email-provider';
import { AuthEntry } from '../auth-entry';

const startOAuthFlowMock = vi.hoisted(() => vi.fn());
const sendVerificationOtpMock = vi.hoisted(() => vi.fn());

vi.mock('../auth-client', () => ({
  authClient: {
    signIn: { social: startOAuthFlowMock },
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

function setup() {
  const router = createMemoryRouter(
    [
      { path: '/sign-in', element: <AuthEntry /> },
      { path: '/sign-in/code', element: <LocationDisplay /> },
    ],
    { initialEntries: ['/sign-in'] },
  );
  render(
    <AuthEmailProvider>
      <I18nWrapper>
        <RouterProvider router={router} />
      </I18nWrapper>
    </AuthEmailProvider>,
  );
}

describe('AuthEntry', () => {
  beforeEach(() => {
    startOAuthFlowMock.mockReset();
    sendVerificationOtpMock.mockReset();
    startOAuthFlowMock.mockResolvedValue(undefined);
    sendVerificationOtpMock.mockResolvedValue(undefined);
  });

  it('calls startOAuthFlow with google when Google button is pressed', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Prijava Google' }));
    expect(startOAuthFlowMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
  });

  it('calls startOAuthFlow with github when GitHub button is pressed', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Prijava GitHub' }));
    expect(startOAuthFlowMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'github' }),
    );
  });

  it('requests OTP and navigates to /sign-in/code on email form submit', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByRole('textbox'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Pošalji kod' }));

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
    await waitFor(() =>
      expect(screen.getByLabelText('current-location')).toHaveTextContent(
        '/sign-in/code',
      ),
    );
  });

  it('renders separated auth methods and header preferences', () => {
    setup();

    expect(screen.getByText('ili')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Podešavanja/i }),
    ).toBeInTheDocument();
  });
});
