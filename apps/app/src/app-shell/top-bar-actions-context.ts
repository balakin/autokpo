import { createContext } from 'react';

export interface TopBarPortalContextValue {
  portalTarget: HTMLElement | null;
  setPortalTarget: (el: HTMLElement | null) => void;
}

export const TopBarPortalContext = createContext<TopBarPortalContextValue>({
  portalTarget: null,
  setPortalTarget: () => {},
});
