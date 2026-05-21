import { AppShell } from './app-shell/app-shell';
import { useRequiredUserId } from './auth/use-required-user-id';
import { CrdtProvider } from './crdt';
import { LeaderProvider } from './leader';

export function SignedInApp() {
  const userId = useRequiredUserId();

  return (
    <LeaderProvider>
      <CrdtProvider userId={userId}>
        <AppShell />
      </CrdtProvider>
    </LeaderProvider>
  );
}
