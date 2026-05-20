import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { useSyncMetadata } from '../crdt';
import { INTL_LOCALES } from '../i18n/i18n';
import { useLocale } from '../i18n/use-locale';

const ONE_MINUTE_MS = 60_000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function LastSuccessfulSyncStatus() {
  const { locale } = useLocale();
  const [now, setNow] = useState(() => Date.now());
  const lastSuccessfulSyncAt = useSyncMetadata(
    (state) => state.lastSuccessfulSyncAt,
  );

  useEffect(() => {
    if (lastSuccessfulSyncAt === null) {
      return;
    }

    const elapsed = Math.max(0, now - lastSuccessfulSyncAt);
    if (elapsed >= ONE_DAY_MS) {
      return;
    }

    const nextTickMs = elapsed < ONE_MINUTE_MS ? 5_000 : 30_000;
    const timeoutId = window.setTimeout(() => {
      setNow(Date.now());
    }, nextTickMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [lastSuccessfulSyncAt, now]);

  if (lastSuccessfulSyncAt === null) {
    return (
      <p className="text-sm text-muted">
        <Trans>Još nema uspešne sinhronizacije na ovom uređaju.</Trans>
      </p>
    );
  }

  const elapsed = Math.max(0, now - lastSuccessfulSyncAt);
  const intlLocale = INTL_LOCALES[locale];

  if (elapsed >= ONE_DAY_MS) {
    return (
      <AbsoluteSyncLabel
        lastSuccessfulSyncAt={lastSuccessfulSyncAt}
        intlLocale={intlLocale}
      />
    );
  }

  return (
    <RelativeSyncLabel
      lastSuccessfulSyncAt={lastSuccessfulSyncAt}
      now={now}
      intlLocale={intlLocale}
    />
  );
}

function RelativeSyncLabel({
  lastSuccessfulSyncAt,
  now,
  intlLocale,
}: {
  lastSuccessfulSyncAt: number;
  now: number;
  intlLocale: string;
}) {
  const elapsedMs = Math.max(0, now - lastSuccessfulSyncAt);
  const rtf = new Intl.RelativeTimeFormat(intlLocale, {
    numeric: 'auto',
    style: 'long',
  });
  const label = formatRelativeElapsed(elapsedMs, rtf);

  return (
    <p className="text-sm text-muted">
      <Trans>Poslednja uspešna sinhronizacija:</Trans> {label}
    </p>
  );
}

function AbsoluteSyncLabel({
  lastSuccessfulSyncAt,
  intlLocale,
}: {
  lastSuccessfulSyncAt: number;
  intlLocale: string;
}) {
  const label = new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(lastSuccessfulSyncAt);

  return (
    <p className="text-sm text-muted">
      <Trans>Poslednja uspešna sinhronizacija:</Trans> {label}
    </p>
  );
}

function formatRelativeElapsed(
  elapsedMs: number,
  rtf: Intl.RelativeTimeFormat,
) {
  const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);

  if (elapsedMinutes < 1) {
    return t`upravo sada`;
  }

  if (elapsedMinutes < 60) {
    return rtf.format(-elapsedMinutes, 'minute');
  }

  return rtf.format(-Math.floor(elapsedMinutes / 60), 'hour');
}
