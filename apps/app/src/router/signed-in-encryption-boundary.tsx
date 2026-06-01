import type { ReactNode } from 'react';

import { useRequiredUserId } from '../auth/use-required-user-id';
import { EncryptionGate } from '../e2ee';

export function SignedInEncryptionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const userId = useRequiredUserId();

  return <EncryptionGate userId={userId}>{children}</EncryptionGate>;
}
