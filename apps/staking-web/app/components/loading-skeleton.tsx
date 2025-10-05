import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse border-2 border-border bg-primary/15 shadow-[4px_4px_0_rgba(0,0,0,0.45)]',
        className,
      )}
    />
  );
}

export function ValidatorTableSkeleton() {
  return (
    <div className="pixel-panel pixel-border">
      <div className="border-b-2 border-border bg-secondary/60 px-6 py-4">
        <LoadingSkeleton className="h-4 w-32" />
      </div>
      <div className="divide-y-2 divide-border">
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
        <div className="pixel-panel pixel-border space-y-4 p-6">
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
        <div className="pixel-panel pixel-border space-y-4 p-6">
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
