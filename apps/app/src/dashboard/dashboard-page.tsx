import { Card, Skeleton, buttonVariants } from '@heroui/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { Suspense, lazy } from 'react';
import { LuBook, LuStar } from 'react-icons/lu';
import { Link } from 'react-router';

import { bookSelectors, type FavoriteBookLink } from '../books/book-selectors';
import { ANNUAL_LIMIT, ROLLING_LIMIT } from '../constants';
import { useYDoc } from '../crdt';
import { AllTimeTotalCard, StatCard } from '../stats/stat-card';
import { thresholdColor } from '../stats/threshold';
import { useStats } from '../stats/use-stats';
import { formatDateLong, formatFullCurrency } from '../utils/formatters';

const IncomeChart = lazy(() => import('../stats/income-chart'));

export function DashboardPage() {
  const books = useYDoc(bookSelectors.statsBooks());
  const favoriteBooks = useYDoc(bookSelectors.favorites());
  const { t } = useLingui();
  const stats = useStats();

  const annualLimitFormatted = formatFullCurrency(ANNUAL_LIMIT);
  const rollingLimitFormatted = formatFullCurrency(ROLLING_LIMIT);

  const peakYearSubtitle = stats.historicalPeakYear
    ? String(stats.historicalPeakYear.year)
    : undefined;

  const peakYearIncome = stats.historicalPeakYear?.income ?? 0;
  const peakYearColor = stats.historicalPeakYear
    ? thresholdColor(peakYearIncome, ANNUAL_LIMIT)
    : undefined;

  const peak12MIncome = stats.historicalPeak12M?.income ?? 0;
  const peak12MColor = stats.historicalPeak12M
    ? thresholdColor(peak12MIncome, ROLLING_LIMIT)
    : undefined;

  const peak12MSubtitle = stats.historicalPeak12M
    ? formatDateLong(stats.historicalPeak12M.window.start) +
      ' – ' +
      formatDateLong(stats.historicalPeak12M.window.end)
    : undefined;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="sr-only">
        <Trans>Panel</Trans>
      </h1>

      {/* Top row: favorites + all-time total */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FavoriteBooks books={favoriteBooks} />
        <AllTimeTotalCard value={stats.allTimeTotal} />
      </div>

      {/* Primary stat cards — current state */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t`Ova godina`}
          value={stats.currentYearIncome}
          color={thresholdColor(stats.currentYearIncome, ANNUAL_LIMIT)}
          limit={ANNUAL_LIMIT}
          subtitle={
            <Trans>
              Limit: {annualLimitFormatted} (
              <a
                href="https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                čl. 42 ZPDGa
              </a>
              )
            </Trans>
          }
        />
        <StatCard
          label={t`Poslednjih 12 meseci`}
          value={stats.last12MonthsIncome}
          color={thresholdColor(stats.last12MonthsIncome, ROLLING_LIMIT)}
          limit={ROLLING_LIMIT}
          subtitle={
            <Trans>
              Limit: {rollingLimitFormatted} (
              <a
                href="https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                čl. 33 ZPDV
              </a>
              )
            </Trans>
          }
        />
        <StatCard
          label={t`Rekordna godina`}
          value={peakYearIncome}
          color={peakYearColor}
          subtitle={peakYearSubtitle}
        />
        <StatCard
          label={t`Rekordnih 12 meseci`}
          value={peak12MIncome}
          color={peak12MColor}
          subtitle={peak12MSubtitle}
        />
      </div>

      {/* All-time total (shown standalone when no favorites) */}
      {/* Bar chart */}
      <Card>
        <Card.Header>
          <Card.Title>
            <Trans>Prihodi po godinama</Trans>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {books.length > 0 ? (
            <Suspense
              fallback={<Skeleton className="h-56 w-full rounded-lg" />}
            >
              <IncomeChart books={books} />
            </Suspense>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg bg-surface-secondary">
              <p className="text-sm text-muted">
                <Trans>Nema podataka za prikaz</Trans>
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

function FavoriteBooks({ books }: { books: FavoriteBookLink[] }) {
  return (
    <Card>
      <Card.Header className="flex-row items-center gap-2">
        <LuStar
          className="size-4 fill-warning text-warning"
          aria-hidden="true"
        />
        <Card.Title>
          <Trans>Omiljene knjige</Trans>
        </Card.Title>
      </Card.Header>
      <Card.Content className="flex-row gap-2 overflow-x-auto">
        {books.length > 0 ? (
          books.map((book) => (
            <Link
              key={book.id}
              className={buttonVariants({ variant: 'secondary' })}
              to={`/books/${book.id}`}
            >
              <LuBook />
              {book.year}
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted">
            <Trans>
              Označite knjigu zvezdicom u <Link to="/books">Knjigama</Link> da
              biste je dodali ovde.
            </Trans>
          </p>
        )}
      </Card.Content>
    </Card>
  );
}
