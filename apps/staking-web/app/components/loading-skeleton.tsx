import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn('animate-pulse rounded-xl bg-white/10', className)} />;
}

export function ValidatorTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="bg-white/5 px-6 py-4">
        <LoadingSkeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="flex flex-wrap items-center gap-4 px-6 py-4">
            <LoadingSkeleton className="h-4 w-16" />
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="h-4 w-24" />
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
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <LoadingSkeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex justify-between">
                <LoadingSkeleton className="h-4 w-24" />
                <LoadingSkeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <LoadingSkeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex justify-between">
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
