import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { Turnstile } from '@marsidev/react-turnstile';
import type { Ref } from 'react';
import { createPortal } from 'react-dom';

const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const siteKey =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY;

export function HiddenTurnstile({ ref }: { ref?: Ref<TurnstileInstance> }) {
  return createPortal(
    <Turnstile ref={ref} siteKey={siteKey} options={{ size: 'invisible' }} />,
    document.body,
  );
}
