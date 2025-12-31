import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingBanner } from "@/components/FloatingBanner";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import { SeedInitializer } from "@/components/SeedInitializer";
import { NavigationGuard } from "@/components/NavigationGuard";
import { initializeHealthMonitoring } from "@/lib/system-health";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  // Initialize system health monitoring on app startup
  useEffect(() => {
    console.info("[ROOT] 🚀 Initializing MyFinBank application...");
    const healthMonitor = initializeHealthMonitoring();

    // Log initial health check
    healthMonitor.performHealthCheck().then((report) => {
      console.info("[ROOT] ✅ Initial health check complete");
      if (report.overallStatus === "FAIL") {
        console.error("[ROOT] ❌ Critical system failures detected");
      } else if (report.overallStatus === "DEGRADED") {
        console.warn("[ROOT] ⚠️  System running in degraded mode");
      }
    });

    return () => {
      console.info("[ROOT] 🛑 Stopping health monitoring...");
      healthMonitor.stopMonitoring();
    };
  }, []);

  return (
    <SeedInitializer>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <ErrorBoundary tagName="main" className="flex-1">
              <Outlet />
            </ErrorBoundary>
            <Toaster />
            <NavigationGuard />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </SeedInitializer>
  );
}
