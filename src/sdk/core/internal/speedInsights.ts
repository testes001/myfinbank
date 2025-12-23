/**
 * Vercel Speed Insights Initialization
 *
 * This module initializes Vercel Speed Insights for performance monitoring.
 * Speed Insights tracks Core Web Vitals and other performance metrics.
 *
 * Learn more: https://vercel.com/docs/speed-insights
 */

import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Initialize Speed Insights
 *
 * This should only be called once in the app, and must run in the client.
 * It's safe to call multiple times - the package handles duplicate calls gracefully.
 */
export function initializeSpeedInsights(): void {
	try {
		// Only inject in browser environment
		if (typeof window !== 'undefined') {
			injectSpeedInsights();
		}
	} catch (error) {
		// Gracefully handle any initialization errors
		// Speed Insights failures should not break the application
		if (import.meta.env.DEV) {
			console.warn('Failed to initialize Vercel Speed Insights:', error);
		}
	}
}
