import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingBanner } from "@/components/FloatingBanner";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import { SeedInitializer } from "@/components/SeedInitializer";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	return (
		<SeedInitializer>
			<ThemeProvider>
				<AuthProvider>
					<div className="flex flex-col min-h-screen">
						<ErrorBoundary tagName="main" className="flex-1">
							<Outlet />
						</ErrorBoundary>
						<Toaster />
						<TanStackRouterDevtools position="bottom-right" />
						<FloatingBanner position="bottom-left" />
					</div>
				</AuthProvider>
			</ThemeProvider>
		</SeedInitializer>
	);
}
