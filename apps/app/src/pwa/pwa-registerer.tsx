import { toast } from '@heroui/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaRegisterer() {
  const { t } = useLingui();
  const toastIdRef = useRef<string | null>(null);
  const updateSWRef = useRef<
    ((reloadPage?: boolean) => Promise<void>) | undefined
  >(undefined);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError: (error) => {
      console.error('Service Worker registration failed:', error);
    },
  });

  updateSWRef.current = updateServiceWorker;

  useEffect(() => {
    if (!needRefresh || toastIdRef.current) return;

    const id = toast.info(t`Dostupno je ažuriranje`, {
      actionProps: {
        children: t`Osveži`,
        onPress: () => {
          toast.close(id);
          toastIdRef.current = null;
          void updateSWRef.current?.(true);
        },
      },
      description: t`Osvežite aplikaciju da biste koristili najnoviju verziju.`,
      onClose: () => {
        toastIdRef.current = null;
      },
      timeout: 0,
    });

    toastIdRef.current = id;
  }, [needRefresh, t]);

  return null;
}
