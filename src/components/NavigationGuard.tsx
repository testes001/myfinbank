/**
 * Navigation Guard with Modern Loading Spinner
 *
 * Provides a global navigation overlay with:
 * - Smooth CSS transitions
 * - Race condition prevention (singleton pattern)
 * - Double-click protection
 * - High-latency handling
 *
 * @module NavigationGuard
 * @priority P0
 */

import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface NavigationGuardState {
  isNavigating: boolean;
  fromPath: string | null;
  toPath: string | null;
  startTime: number | null;
}

// ============================================================================
// SINGLETON STATE MANAGER
// ============================================================================

class NavigationStateManager {
  private static instance: NavigationStateManager | null = null;
  private state: NavigationGuardState = {
    isNavigating: false,
    fromPath: null,
    toPath: null,
    startTime: null,
  };
  private listeners: Set<(state: NavigationGuardState) => void> = new Set();
  private navigationTimeout: NodeJS.Timeout | null = null;
  private readonly MAX_NAVIGATION_TIME = 10000; // 10 seconds safety timeout

  private constructor() {}

  public static getInstance(): NavigationStateManager {
    if (!NavigationStateManager.instance) {
      NavigationStateManager.instance = new NavigationStateManager();
    }
    return NavigationStateManager.instance;
  }

  /**
   * Start navigation with race condition protection
   */
  public startNavigation(from: string, to: string): boolean {
    // Prevent double-click race condition
    if (this.state.isNavigating) {
      console.warn(
        "[NavigationGuard] Navigation already in progress, ignoring duplicate request"
      );
      return false;
    }

    this.state = {
      isNavigating: true,
      fromPath: from,
      toPath: to,
      startTime: Date.now(),
    };

    // Safety timeout to prevent infinite loading
    this.navigationTimeout = setTimeout(() => {
      console.error(
        "[NavigationGuard] Navigation timeout exceeded, force completing"
      );
      this.completeNavigation();
    }, this.MAX_NAVIGATION_TIME);

    this.notifyListeners();
    console.info(`[NavigationGuard] 🚀 Navigation started: ${from} → ${to}`);
    return true;
  }

  /**
   * Complete navigation and cleanup
   */
  public completeNavigation(): void {
    if (!this.state.isNavigating) {
      return;
    }

    const duration = this.state.startTime
      ? Date.now() - this.state.startTime
      : 0;

    console.info(
      `[NavigationGuard] ✅ Navigation completed: ${this.state.fromPath} → ${this.state.toPath} (${duration}ms)`
    );

    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
      this.navigationTimeout = null;
    }

    this.state = {
      isNavigating: false,
      fromPath: null,
      toPath: null,
      startTime: null,
    };

    this.notifyListeners();
  }

  /**
   * Get current navigation state
   */
  public getState(): Readonly<NavigationGuardState> {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(
    listener: (state: NavigationGuardState) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (error) {
        console.error("[NavigationGuard] Listener error:", error);
      }
    }
  }

  /**
   * Force reset (emergency use only)
   */
  public forceReset(): void {
    console.warn("[NavigationGuard] Force reset triggered");
    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
      this.navigationTimeout = null;
    }
    this.state = {
      isNavigating: false,
      fromPath: null,
      toPath: null,
      startTime: null,
    };
    this.notifyListeners();
  }
}

// ============================================================================
// NAVIGATION GUARD COMPONENT
// ============================================================================

export function NavigationGuard() {
  const router = useRouter();
  const [navigationState, setNavigationState] =
    useState<NavigationGuardState>(() =>
      NavigationStateManager.getInstance().getState()
    );

  useEffect(() => {
    const manager = NavigationStateManager.getInstance();

    // Subscribe to navigation state changes
    const unsubscribe = manager.subscribe((state) => {
      setNavigationState(state);
    });

    // Listen for route changes
    const handleRouteStart = () => {
      const currentPath = window.location.pathname;
      // We don't know the destination yet, will be updated on complete
      manager.startNavigation(currentPath, "unknown");
    };

    const handleRouteComplete = () => {
      manager.completeNavigation();
    };

    // TanStack Router event listeners
    router.history.subscribe((event) => {
      if (event.type === "push" || event.type === "replace") {
        handleRouteStart();
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [router]);

  return (
    <AnimatePresence mode="wait">
      {navigationState.isNavigating && (
        <motion.div
          key="navigation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-950/95 via-slate-900/95 to-purple-950/95 backdrop-blur-sm"
          style={{ pointerEvents: "all" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 px-8 py-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Loader2 className="w-12 h-12 text-blue-400" />
            </motion.div>

            <div className="text-center space-y-2">
              <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-lg font-semibold text-white"
              >
                Loading...
              </motion.h3>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-white/70"
              >
                Please wait while we prepare your experience
              </motion.p>
            </div>

            {/* Progress indicator for high-latency scenarios */}
            <motion.div
              className="w-48 h-1 bg-white/10 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// PROGRAMMATIC NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate with loading spinner
 * Use this for CTA clicks and manual navigation
 */
export function navigateWithLoader(
  navigate: (opts: any) => void,
  to: string,
  options: any = {}
): void {
  const manager = NavigationStateManager.getInstance();
  const currentPath = window.location.pathname;

  // Start navigation guard
  const canNavigate = manager.startNavigation(currentPath, to);

  if (!canNavigate) {
    console.warn("[NavigationGuard] Navigation blocked (already in progress)");
    return;
  }

  // Perform navigation
  try {
    navigate({ to, ...options });

    // Complete after a short delay to ensure route is loaded
    setTimeout(() => {
      manager.completeNavigation();
    }, 500);
  } catch (error) {
    console.error("[NavigationGuard] Navigation error:", error);
    manager.completeNavigation();
  }
}

/**
 * Hook for accessing navigation guard functions
 */
export function useNavigationGuard() {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const manager = NavigationStateManager.getInstance();
    const unsubscribe = manager.subscribe((state) => {
      setIsNavigating(state.isNavigating);
    });
    return unsubscribe;
  }, []);

  return {
    isNavigating,
    startNavigation: (from: string, to: string) => {
      return NavigationStateManager.getInstance().startNavigation(from, to);
    },
    completeNavigation: () => {
      NavigationStateManager.getInstance().completeNavigation();
    },
    forceReset: () => {
      NavigationStateManager.getInstance().forceReset();
    },
  };
}

// ============================================================================
// SAFE LINK COMPONENT WITH AUTO GUARD
// ============================================================================

interface SafeNavigationLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * Safe navigation link with automatic loading guard
 * Use this instead of regular <Link> for CTAs
 */
export function SafeNavigationLink({
  to,
  children,
  disabled,
  className = "",
  onClick,
  ...props
}: SafeNavigationLinkProps) {
  const { isNavigating, startNavigation } = useNavigationGuard();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled || isNavigating) {
      e.preventDefault();
      return;
    }

    const currentPath = window.location.pathname;
    const canNavigate = startNavigation(currentPath, to);

    if (!canNavigate) {
      e.preventDefault();
      return;
    }

    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`${className} ${disabled || isNavigating ? "pointer-events-none opacity-50" : ""}`}
      {...props}
    >
      {children}
    </a>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default NavigationGuard;
export { NavigationStateManager };
