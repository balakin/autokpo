export function isLazyChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /chunk|dynamic import|loading css chunk|failed to fetch dynamically imported module/i.test(
    `${error.name} ${error.message}`,
  );
}
