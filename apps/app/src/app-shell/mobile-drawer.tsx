import { Button, Drawer } from '@heroui/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { LuX } from 'react-icons/lu';

import { useIsMobile } from '../hooks/use-is-mobile';

import { Sidebar } from './sidebar';

interface MobileDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function MobileDrawer({ isOpen, onOpenChange }: MobileDrawerProps) {
  const { t } = useLingui();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile && isOpen) {
      onOpenChange(false);
    }
  }, [isMobile, isOpen, onOpenChange]);

  if (!isMobile) {
    return null;
  }

  return (
    <Drawer.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="opaque"
    >
      <Drawer.Content placement="left">
        <Drawer.Dialog
          aria-label={t`Navigacija`}
          className="size-full  max-w-full bg-sidebar-bg p-0"
        >
          <Sidebar
            onNavigate={() => onOpenChange(false)}
            closeButton={
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label={t`Zatvori`}
                autoFocus
                onPress={() => onOpenChange(false)}
              >
                <LuX className="size-4" />
              </Button>
            }
          />
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
