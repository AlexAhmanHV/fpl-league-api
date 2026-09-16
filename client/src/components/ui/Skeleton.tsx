// A single angled shimmer sweep across placeholder geometry — the same idea
// as Wensity UI's "Shimmering Skeleton Wrapper", rebuilt locally with a plain
// CSS gradient animation instead of pulling in the (paid) component.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-panel-hover ${className}`}
    >
      <div className="skeleton-sweep absolute inset-0" />
    </div>
  );
}

export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}
