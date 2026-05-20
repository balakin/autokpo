import { Trans, useLingui } from '@lingui/react/macro';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { StatsBookProjection } from '../books/book-selectors';
import { ANNUAL_LIMIT } from '../constants';
import { formatFullCurrency } from '../formatters';

function readChartColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    barFill: style.getPropertyValue('--accent').trim() || '#6b7280',
    axisStroke: style.getPropertyValue('--muted').trim() || '#9ca3af',
    gridStroke: style.getPropertyValue('--border').trim() || '#e5e7eb',
    textFill: style.getPropertyValue('--muted').trim() || '#9ca3af',
    referenceLineStroke: style.getPropertyValue('--danger').trim() || '#ef4444',
  };
}

interface IncomeChartProps {
  books: StatsBookProjection[];
}

function bookIncome(book: StatsBookProjection): number {
  return book.entries.reduce(
    (sum, e) => sum + e.odProdajeProizvoda + e.odIzvrsenihUsluga,
    0,
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      <p className="font-mono text-muted">
        <Trans>Prihod</Trans>: {formatFullCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function IncomeChart({ books }: IncomeChartProps) {
  const { t } = useLingui();
  const colors = readChartColors();
  const data = [...books]
    .sort((a, b) => a.year - b.year)
    .map((b) => ({ year: b.year, income: bookIncome(b) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.gridStroke}
          vertical={false}
        />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12, fill: colors.textFill }}
          axisLine={{ stroke: colors.axisStroke }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 11, fill: colors.textFill }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          content={({ active, payload, label }) => (
            <CustomTooltip
              active={active}
              payload={payload as readonly { value: number }[] | undefined}
              label={label?.toString()}
            />
          )}
        />
        <ReferenceLine
          y={ANNUAL_LIMIT}
          stroke={colors.referenceLineStroke}
          strokeDasharray="4 4"
          label={{
            value: t`Paušalni limit`,
            position: 'insideTopRight',
            fontSize: 11,
            fill: colors.referenceLineStroke,
          }}
        />
        <Bar dataKey="income" fill={colors.barFill} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
