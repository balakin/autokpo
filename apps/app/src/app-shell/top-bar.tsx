import { Breadcrumbs, Button } from '@heroui/react';
import { useLingui } from '@lingui/react/macro';
import { LuMenu } from 'react-icons/lu';
import { useLocation, useParams } from 'react-router';

import { ProfilePopover } from '../auth/profile-popover';
import { bookSelectors } from '../books/book-selectors';
import { useYDoc } from '../crdt';

import { useTopBarPortalRef } from './use-top-bar-portal-ref';

interface TopBarProps {
  onMenuPress: () => void;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation();
  const { bookId } = useParams<{ bookId?: string }>();
  const breadcrumbYear = useYDoc(
    bookId ? bookSelectors.breadcrumb(bookId) : () => null,
  );
  const { t } = useLingui();

  if (pathname.startsWith('/books/') && bookId) {
    return [
      { label: t`Knjige`, href: '/books' },
      { label: breadcrumbYear !== null ? String(breadcrumbYear) : '…' },
    ];
  }
  if (pathname === '/books') return [{ label: t`Knjige` }];
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return [{ label: t`Podešavanja` }];
  }
  if (pathname === '/help') return [{ label: t`Pomoć` }];
  return [{ label: t`Panel` }];
}

export function TopBar({ onMenuPress }: TopBarProps) {
  const crumbs = useBreadcrumbs();
  const portalRef = useTopBarPortalRef();
  const { t } = useLingui();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-separator bg-background px-4">
      <Button
        isIconOnly
        variant="ghost"
        aria-label={t`Otvori meni`}
        className="lg:hidden"
        onPress={onMenuPress}
      >
        <LuMenu className="size-5" />
      </Button>

      <div className="flex flex-1 items-center">
        <Breadcrumbs>
          {crumbs.map((crumb) => (
            <Breadcrumbs.Item key={crumb.label} href={crumb.href}>
              {crumb.label}
            </Breadcrumbs.Item>
          ))}
        </Breadcrumbs>
      </div>

      {/* Portal target — route components render their actions here via TopBarActionsSlot */}
      <div ref={portalRef} className="flex items-center gap-2" />
      <ProfilePopover />
    </header>
  );
}
