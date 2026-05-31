import { Card, Label, ProgressBar } from '@heroui/react';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';
import { cx } from 'tailwind-variants';

import { formatFullCurrency } from '../utils/formatters';

interface StatCardProps {
  label: string;
  value: number;
  color?: 'success' | 'warning' | 'danger';
  limit?: number;
  subtitle?: ReactNode;
}

const COLOR_CLASSES = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

export function StatCard({
  label,
  value,
  color,
  limit,
  subtitle,
}: StatCardProps) {
  const progressValue =
    limit != null ? Math.min((value / limit) * 100, 100) : undefined;

  return (
    <Card>
      <Card.Header>
        <Card.Title>{label}</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        <p
          className={cx(
            'font-mono text-2xl font-semibold',
            color && COLOR_CLASSES[color],
          )}
        >
          {formatFullCurrency(value)}
        </p>
        {progressValue != null && (
          <ProgressBar
            aria-label={label}
            value={progressValue}
            color={color ?? 'default'}
            size="sm"
            formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }}
          >
            <Label className="sr-only">{label}</Label>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        )}
        {!!subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </Card.Content>
    </Card>
  );
}

export function AllTimeTotalCard({ value }: { value: number }) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <Trans>Ukupno</Trans>
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <p className="font-mono text-2xl font-semibold text-muted">
          {formatFullCurrency(value)}
        </p>
      </Card.Content>
    </Card>
  );
}
