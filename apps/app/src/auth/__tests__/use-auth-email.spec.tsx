import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AuthEmailProvider } from '../auth-email-provider';
import { useAuthEmail } from '../use-auth-email';

function EmailDisplay() {
  const { email } = useAuthEmail();
  return <span data-testid="email">{email}</span>;
}

function EmailSetter({ value }: { value: string }) {
  const ctx = useAuthEmail();
  return <button onClick={() => ctx.setEmail(value)}>set</button>;
}

describe('useAuthEmail', () => {
  it('throws outside AuthEmailProvider', () => {
    expect(() => render(<EmailDisplay />)).toThrow(
      'useAuthEmail must be used within AuthEmailProvider.',
    );
  });

  it('provides empty email by default', () => {
    render(
      <AuthEmailProvider>
        <EmailDisplay />
      </AuthEmailProvider>,
    );
    expect(screen.getByTestId('email')).toHaveTextContent('');
  });

  it('updates email via setEmail', async () => {
    const user = userEvent.setup();
    render(
      <AuthEmailProvider>
        <EmailDisplay />
        <EmailSetter value="user@example.com" />
      </AuthEmailProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'set' }));
    expect(screen.getByTestId('email')).toHaveTextContent('user@example.com');
  });
});
