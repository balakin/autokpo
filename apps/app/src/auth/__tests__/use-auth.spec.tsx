import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '../auth-context';
import { useAuth } from '../use-auth';

function UseAuthHarness() {
  const auth = useAuth();
  return <span>{auth.user?.id ?? 'null'}</span>;
}

describe('useAuth', () => {
  it('reads auth context values', () => {
    render(
      <AuthContext
        value={{
          user: { id: 'u1', email: 'u1@example.com', image: null },

          refresh: () => Promise.resolve(null),
          logout: () => Promise.resolve(),
        }}
      >
        <UseAuthHarness />
      </AuthContext>,
    );

    expect(screen.getByText('u1')).toBeInTheDocument();
  });

  it('throws outside provider', () => {
    expect(() => render(<UseAuthHarness />)).toThrow(
      'useAuth must be used within AuthProvider.',
    );
  });
});
