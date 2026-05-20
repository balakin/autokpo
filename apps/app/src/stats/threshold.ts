export function thresholdColor(
  value: number,
  limit: number,
): 'success' | 'warning' | 'danger' {
  if (value > limit) return 'danger';
  if (value / limit >= 0.9) return 'warning';
  return 'success';
}
