export function convertToRsd(
  amount: number,
  exchangeMiddle: number,
  parity: number,
): number {
  return Math.round(((amount * exchangeMiddle) / parity) * 100) / 100;
}
