import { useAuth } from './use-auth';

export function useRequiredUserId() {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useRequiredUserId must be used when user is signed in.');
  }
  return user.id;
}
