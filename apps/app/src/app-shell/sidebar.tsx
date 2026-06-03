import { Chip, Link as HeroLink } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';
import {
  LuBook,
  LuCircleHelp,
  LuGithub,
  LuLayoutDashboard,
  LuSettings,
  LuTag,
} from 'react-icons/lu';
import { Link, useLocation } from 'react-router';
import { tv } from 'tailwind-variants';

import { ANNUAL_LIMIT, ROLLING_LIMIT } from '../constants';
import { thresholdColor } from '../stats/threshold';
import { useStats } from '../stats/use-stats';
import { formatFullCurrency } from '../utils/formatters';

const navLink = tv({
  base: 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
  variants: {
    active: {
      true: 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground',
      false:
        'text-muted hover:bg-default hover:text-foreground focus-visible:bg-default focus-visible:text-foreground',
    },
  },
});

const NAV_ITEMS = [
  { href: '/dashboard', icon: LuLayoutDashboard },
  { href: '/books', icon: LuBook },
  { href: '/settings/general', icon: LuSettings },
] as const;

const NAV_LABELS: Record<string, ReactNode> = {
  '/dashboard': <Trans>Panel</Trans>,
  '/books': <Trans>Knjige</Trans>,
  '/settings/general': <Trans>Podešavanja</Trans>,
};

interface SidebarProps {
  closeButton?: ReactNode;
  onNavigate?: () => void;
}

const incomeValue = tv({
  base: 'font-mono font-medium',
  variants: {
    color: {
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-danger',
    },
  },
});

function SidebarStatsFooter() {
  const stats = useStats();
  const yearColor = thresholdColor(stats.currentYearIncome, ANNUAL_LIMIT);
  const rollingColor = thresholdColor(stats.last12MonthsIncome, ROLLING_LIMIT);

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted">
            <Trans>Ova godina</Trans>
          </span>
          <span className={incomeValue({ color: yearColor })}>
            {formatFullCurrency(stats.currentYearIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted">
            <Trans>12 meseci</Trans>
          </span>
          <span className={incomeValue({ color: rollingColor })}>
            {formatFullCurrency(stats.last12MonthsIncome)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ closeButton, onNavigate }: SidebarProps) {
  const { pathname } = useLocation();

  function isActive(href: string) {
    if (href.startsWith('/settings')) {
      return pathname === '/settings' || pathname.startsWith('/settings/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex size-full flex-col bg-background text-foreground lg:border-r lg:border-border">
      {/* Logo */}
      <div className="flex min-h-14 items-center justify-between border-b border-border px-5">
        <span className="text-2xl font-bold tracking-tight">AutoKPO</span>
        {closeButton}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              to={href}
              onClick={() => onNavigate?.()}
              className={navLink({ active })}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {NAV_LABELS[href]}
            </Link>
          );
        })}
        <div className="mt-auto pt-1">
          <Link
            to="/help"
            onClick={() => onNavigate?.()}
            className={navLink({ active: isActive('/help') })}
          >
            <LuCircleHelp className="size-4 shrink-0" aria-hidden="true" />
            <Trans>Pomoć</Trans>
          </Link>
        </div>
      </nav>

      {/* Stats footer */}
      <SidebarStatsFooter />

      {/* Version badge + GitHub link */}
      <div className="flex items-center justify-between border-t border-border p-4">
        <Chip size="sm" variant="soft" color="success">
          <LuTag className="size-3" />
          <Chip.Label>v{__APP_VERSION__}</Chip.Label>
        </Chip>
        <HeroLink
          href="https://github.com/balakin/autokpo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted no-underline hover:text-foreground"
        >
          <span>AGPL-3.0</span>
          <span aria-hidden="true">·</span>
          <LuGithub className="size-3.5" />
        </HeroLink>
      </div>
    </div>
  );
}
