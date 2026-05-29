import { createAuthClient } from 'better-auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [emailOTPClient()],
});
