export function createLogger(
  prefix: string,
): (fmt: string, ...args: unknown[]) => void {
  if (import.meta.env.MODE === 'test') {
    return () => {};
  }
  return (fmt: string, ...args: unknown[]) => {
    console.debug(`[${prefix}] ${fmt}`, ...args);
  };
}
