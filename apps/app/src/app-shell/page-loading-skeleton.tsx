interface PageLoadingSkeletonProps {
  animated?: boolean;
  className?: string;
}

export function PageLoadingSkeleton({
  animated = true,
  className = '',
}: PageLoadingSkeletonProps) {
  const pulse = animated ? 'animate-pulse' : '';

  return (
    <div className={`flex w-full flex-col gap-6 ${className}`}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SkeletonCard className="h-28" pulse={pulse} />
        <SkeletonCard className="h-28" pulse={pulse} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard className="h-28" pulse={pulse} />
        <SkeletonCard className="h-28" pulse={pulse} />
        <SkeletonCard className="h-28" pulse={pulse} />
        <SkeletonCard className="h-28" pulse={pulse} />
      </div>

      <div className="rounded-2xl border border-separator/70 bg-surface p-4 shadow-xs sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div
            className={`h-5 w-36 rounded-full bg-surface-secondary ${pulse}`}
          />
          <div
            className={`h-9 w-28 rounded-lg bg-surface-secondary ${pulse}`}
          />
        </div>
        <div className="space-y-3">
          <div className={`h-11 rounded-xl bg-surface-secondary/80 ${pulse}`} />
          <div className={`h-11 rounded-xl bg-surface-secondary/65 ${pulse}`} />
          <div className={`h-11 rounded-xl bg-surface-secondary/50 ${pulse}`} />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({
  className,
  pulse,
}: {
  className: string;
  pulse: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-separator/70 bg-surface p-4 shadow-xs ${className}`}
    >
      <div className="flex h-full flex-col justify-between">
        <div
          className={`h-4 w-24 rounded-full bg-surface-secondary/80 ${pulse}`}
        />
        <div className="space-y-2">
          <div
            className={`h-7 w-28 rounded-lg bg-surface-secondary/80 ${pulse}`}
          />
          <div
            className={`h-3 w-3/5 rounded-full bg-surface-secondary/80 ${pulse}`}
          />
        </div>
      </div>
    </div>
  );
}
