import { use, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { TopBarPortalContext } from './top-bar-actions-context';

export function TopBarActionsProvider({ children }: { children: ReactNode }) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  return (
    <TopBarPortalContext value={{ portalTarget, setPortalTarget }}>
      {children}
    </TopBarPortalContext>
  );
}

/**
 * Renders children via a React portal into the AppShell top bar container.
 * Children remain in the current React subtree (preserving context providers)
 * while appearing visually in the top bar.
 */
export function TopBarActionsSlot({ children }: { children: ReactNode }) {
  const { portalTarget } = use(TopBarPortalContext);
  if (!portalTarget) return null;
  return createPortal(children, portalTarget);
}
