import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-r from-white/5 via-white/15 to-white/5 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]",
        className
      )}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading transactions">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <LoadingSkeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="h-3 w-32" />
          </div>
          <LoadingSkeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
