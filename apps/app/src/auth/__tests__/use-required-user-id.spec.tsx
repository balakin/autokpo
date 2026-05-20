import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '../auth-context';
import { useRequiredUserId } from '../use-required-user-id';

function RequiredUserHarness() {
  const userId = useRequiredUserId();
  return <span>{userId}</span>;
}

describe('useRequiredUserId', () => {
  it('returns user id when signed in', () => {
    render(
      <AuthContext
        value={{
          user: {
            id: 'required-user',
            email: 'required@example.com',
            image: null,
          },

          refresh: () => Promise.resolve('required-user'),
          logout: () => Promise.resolve(),
        }}
      >
        <RequiredUserHarness />
      </AuthContext>,
    );

    expect(screen.getByText('required-user')).toBeInTheDocument();
  });

  it('throws when user is missing', () => {
    expect(() =>
      render(
        <AuthContext
          value={{
            user: null,

            refresh: () => Promise.resolve(null),
            logout: () => Promise.resolve(),
          }}
        >
          <RequiredUserHarness />
        </AuthContext>,
      ),
    ).toThrow('useRequiredUserId must be used when user is signed in.');
  });
});
