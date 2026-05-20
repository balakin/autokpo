import { toast } from '@heroui/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';

import { useOnlineStatus } from './use-online-status';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const toastIdRef = useRef<string | null>(null);
  const { t } = useLingui();

  useEffect(() => {
    if (!isOnline) {
      const id = toast.warning(t`Van mreže ste`, {
        description: t`Neke funkcionalnosti mogu biti nedostupne dok se ponovo ne povežete.`,
        timeout: 0,
      });
      toastIdRef.current = id;

      return () => {
        toast.close(id);
        toastIdRef.current = null;
      };
    }
  }, [isOnline, t]);

  return null;
}
