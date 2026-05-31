import { Trans } from '@lingui/react/macro';
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { isLazyChunkLoadError } from './lazy-chunk-error';

interface LazyChunkErrorBoundaryProps {
  children: ReactNode;
}

interface LazyChunkErrorBoundaryState {
  error: Error | null;
}

export class LazyChunkErrorBoundary extends Component<
  LazyChunkErrorBoundaryProps,
  LazyChunkErrorBoundaryState
> {
  state: LazyChunkErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): LazyChunkErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Lazy chunk failed to load:', error, errorInfo);
  }

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    if (!isLazyChunkLoadError(this.state.error)) {
      throw this.state.error;
    }

    return <LazyChunkErrorRecovery />;
  }
}

function LazyChunkErrorRecovery() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-lg">
        <h1 className="text-xl font-semibold">
          <Trans>Ne možemo da učitamo ovaj deo aplikacije</Trans>
        </h1>
        <p className="mt-3 text-sm text-muted">
          <Trans>
            Verovatno je dostupna nova verzija. Osvežite aplikaciju da biste
            nastavili.
          </Trans>
        </p>
        <button
          className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          type="button"
          onClick={() => window.location.reload()}
        >
          <Trans>Osveži aplikaciju</Trans>
        </button>
      </div>
    </div>
  );
}
