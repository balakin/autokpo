import { formatValue } from 'react-currency-input-field';

export function formatCurrency(value: number): string {
  return formatValue({
    value: value.toString(),
    groupSeparator: '.',
    decimalSeparator: ',',
    decimalScale: 2,
  });
}

export function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('sr-Latn-RS', {
    style: 'currency',
    currency: 'RSD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('sr-Latn-RS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
