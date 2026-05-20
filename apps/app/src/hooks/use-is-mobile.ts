import { useEffect, useState } from 'react';

function readIsMobile() {
  const lg = getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint-lg')
    .trim();
  return !window.matchMedia(`(min-width: ${lg})`).matches;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(readIsMobile);

  useEffect(() => {
    const lg = getComputedStyle(document.documentElement)
      .getPropertyValue('--breakpoint-lg')
      .trim();
    const mql = window.matchMedia(`(min-width: ${lg})`);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(!e.matches);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
