import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// ============================================================================
// BASE SKELETON COMPONENTS
// ============================================================================

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export function Skeleton({
  className = "",
  width = "w-full",
  height = "h-4",
  rounded = "md",
}: SkeletonProps) {
  const roundedClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-white/10 ${width} ${height} ${roundedClass} ${className}`}
    />
  );
}

export function SkeletonCircle({
  size = "size-12",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-white/10 ${size} rounded-full ${className}`}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "w-3/4" : "w-full"}
          height="h-3"
        />
      ))}
    </div>
  );
}

// ============================================================================
// MODAL SKELETON LOADERS
// ============================================================================

export function ModalSkeleton() {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-8 w-8 text-blue-400" />
      </motion.div>
    </div>
  );
}

export function FormModalSkeleton() {
  return (
    <div className="space-y-6 py-4">
      {/* Header Section */}
      <div className="space-y-3">
        <Skeleton width="w-1/3" height="h-5" />
        <Skeleton width="w-2/3" height="h-4" />
      </div>

      {/* Form Fields */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width="w-1/4" height="h-4" />
          <Skeleton width="w-full" height="h-10" rounded="md" />
        </div>
      ))}

      {/* Info Alert */}
      <div className="space-y-2 rounded-lg bg-white/5 p-4 border border-white/10">
        <Skeleton width="w-1/2" height="h-4" />
        <SkeletonText lines={2} />
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton width="w-24" height="h-10" rounded="md" />
        <Skeleton width="w-32" height="h-10" rounded="md" />
      </div>
    </div>
  );
}

export function DetailModalSkeleton() {
  return (
    <div className="space-y-6 py-4">
      {/* Header Card */}
      <div className="rounded-lg bg-white/5 p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-4">
          <SkeletonCircle size="size-16" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-1/2" height="h-6" />
            <Skeleton width="w-1/3" height="h-4" />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg bg-white/5 p-4 border border-white/10 space-y-3"
        >
          <Skeleton width="w-1/4" height="h-5" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <Skeleton width="w-1/3" height="h-4" />
                <Skeleton width="w-1/4" height="h-4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListModalSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="w-1/3" height="h-6" />
        <Skeleton width="w-24" height="h-8" rounded="md" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-white/5 p-3 border border-white/10 space-y-2"
          >
            <Skeleton width="w-3/4" height="h-3" />
            <Skeleton width="w-1/2" height="h-8" />
          </div>
        ))}
      </div>

      {/* List Items */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-white/5 p-4 border border-white/10"
          >
            <div className="flex items-start gap-3">
              <SkeletonCircle size="size-10" />
              <div className="flex-1 space-y-2">
                <Skeleton width="w-1/2" height="h-4" />
                <Skeleton width="w-3/4" height="h-3" />
              </div>
              <Skeleton width="w-16" height="h-6" rounded="full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartModalSkeleton() {
  return (
    <div className="space-y-6 py-4">
      {/* Summary Card */}
      <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton width="w-32" height="h-4" />
            <Skeleton width="w-40" height="h-10" />
          </div>
          <SkeletonCircle size="size-20" />
        </div>
      </div>

      {/* Chart Area */}
      <div className="rounded-lg bg-white/5 p-6 border border-white/10 space-y-4">
        <Skeleton width="w-1/3" height="h-5" />
        <div className="flex items-end justify-between gap-2 h-48">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              width="flex-1"
              height={`h-${[32, 40, 36, 44, 38, 42, 46][i]}`}
              rounded="sm"
            />
          ))}
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Skeleton width="w-1/4" height="h-4" />
              <Skeleton width="w-20" height="h-4" />
            </div>
            <Skeleton width="w-full" height="h-2" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SPECIALIZED SKELETON LOADERS
// ============================================================================

export function AccountTabSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4"
        >
          <div className="flex items-center gap-4">
            <SkeletonCircle size="size-16" />
            <div className="flex-1 space-y-2">
              <Skeleton width="w-1/3" height="h-6" />
              <Skeleton width="w-1/2" height="h-4" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton width="w-1/4" height="h-4" />
                <Skeleton width="w-full" height="h-6" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SecurityTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonCircle size="size-12" />
          <div className="space-y-2">
            <Skeleton width="w-32" height="h-5" />
            <Skeleton width="w-40" height="h-4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="w-full" height="h-16" rounded="lg" />
          ))}
        </div>
      </div>

      {/* Security Features */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonCircle size="size-10" />
              <div className="space-y-2">
                <Skeleton width="w-32" height="h-5" />
                <Skeleton width="w-48" height="h-4" />
              </div>
            </div>
            <Skeleton width="w-12" height="h-6" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToolsTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Credit Score Card */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonCircle size="size-10" />
            <div className="space-y-2">
              <Skeleton width="w-24" height="h-5" />
              <Skeleton width="w-32" height="h-4" />
            </div>
          </div>
          <Skeleton width="w-8" height="h-8" rounded="md" />
        </div>
        <Skeleton width="w-full" height="h-32" rounded="lg" />
      </div>

      {/* Analytics Cards */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonCircle size="size-10" />
              <div className="space-y-2">
                <Skeleton width="w-32" height="h-5" />
                <Skeleton width="w-40" height="h-4" />
              </div>
            </div>
            <Skeleton width="w-20" height="h-8" rounded="md" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton width="w-1/4" height="h-4" />
                  <Skeleton width="w-20" height="h-4" />
                </div>
                <Skeleton width="w-full" height="h-2" rounded="full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ANIMATED LOADER
// ============================================================================

export function AnimatedLoader({
  message = "Loading...",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-12 w-12 text-blue-400" />
      </motion.div>
      <p className="text-sm text-white/60">{message}</p>
    </div>
  );
}

// ============================================================================
// SUSPENSE FALLBACK WRAPPER
// ============================================================================

export function SuspenseFallback({
  type = "modal",
  message,
}: {
  type?: "modal" | "form" | "detail" | "list" | "chart" | "tab";
  message?: string;
}) {
  if (message) {
    return <AnimatedLoader message={message} className="p-8" />;
  }

  const loaders = {
    modal: <ModalSkeleton />,
    form: <FormModalSkeleton />,
    detail: <DetailModalSkeleton />,
    list: <ListModalSkeleton />,
    chart: <ChartModalSkeleton />,
    tab: <AccountTabSkeleton />,
  };

  return loaders[type];
}
