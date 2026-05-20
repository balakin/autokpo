import { AppShell } from './app-shell/app-shell';
import { useRequiredUserId } from './auth/use-required-user-id';
import { CrdtProvider } from './crdt';

export function SignedInApp() {
  const userId = useRequiredUserId();

  return (
    <CrdtProvider userId={userId}>
      <AppShell />
    </CrdtProvider>
  );
}
