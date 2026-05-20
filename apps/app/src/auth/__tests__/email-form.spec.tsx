import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useImperativeHandle } from 'react';
import type { Ref } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nWrapper } from '../../../tests/app/render-helpers';
import { EmailForm } from '../email-form';

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

describe('EmailForm', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
    onSubmit.mockResolvedValue(undefined);
  });

  it('renders with initial email value', () => {
    render(
      <I18nWrapper>
        <EmailForm email="user@example.com" onSubmit={onSubmit} />
      </I18nWrapper>,
    );
    expect(screen.getByRole('textbox')).toHaveValue('user@example.com');
  });

  it('calls onSubmit with trimmed email and captcha token on valid submission', async () => {
    const user = userEvent.setup();
    render(
      <I18nWrapper>
        <EmailForm email="" onSubmit={onSubmit} />
      </I18nWrapper>,
    );

    await user.type(screen.getByRole('textbox'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Pošalji kod' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        'user@example.com',
        'mock-turnstile-token',
      ),
    );
  });

  it('shows validation error and does not submit for invalid email', async () => {
    const user = userEvent.setup();
    render(
      <I18nWrapper>
        <EmailForm email="" onSubmit={onSubmit} />
      </I18nWrapper>,
    );

    await user.type(screen.getByRole('textbox'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Pošalji kod' }));

    expect(
      await screen.findByText('Unesite ispravnu email adresu.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
