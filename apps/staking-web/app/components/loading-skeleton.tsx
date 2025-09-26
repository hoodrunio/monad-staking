interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-800/50 rounded ${className}`} />
  );
}

export function ValidatorTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="bg-slate-900/50 px-4 py-3">
        <LoadingSkeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-slate-800 bg-slate-950/40">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <LoadingSkeleton className="h-4 w-16" />
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ValidatorDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <LoadingSkeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <LoadingSkeleton className="h-4 w-24" />
                <LoadingSkeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <LoadingSkeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <LoadingSkeleton className="h-4 w-28" />
                <LoadingSkeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
