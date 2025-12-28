// import { createRequire } from "node:module";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { creaoPlugins } from "./config/vite/creao-plugin.mjs";

// https://vitejs.dev/config/
export default defineConfig({
        base: process.env.TENANT_ID ? `/${process.env.TENANT_ID}/` : "/",
        define: {
                "import.meta.env.TENANT_ID": JSON.stringify(process.env.TENANT_ID || ""),
                "import.meta.env.VITE_RESEND_API_KEY": JSON.stringify(
                        process.env.RESEND_API_KEY || "",
                ),
        },
        plugins: [
                ...creaoPlugins(),
                TanStackRouterVite({
                        autoCodeSplitting: false, // affects pick-n-edit feature. disabled for now.
                }),
                viteReact({
                        jsxRuntime: "automatic",
                }),
                svgr(),
                tailwindcss(),
        ],
        test: {
                globals: true,
                environment: "jsdom",
        },
        resolve: {
                alias: {
                        "@": resolve(__dirname, "./src"),
                },
        },
        server: {
                host: "0.0.0.0",
                port: 3000,
                allowedHosts: true, // respond to *any* Host header
                headers: {
                        "X-Content-Type-Options": "nosniff",
                        "X-Frame-Options": "DENY",
                        "X-XSS-Protection": "1; mode=block",
                        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                        "Content-Security-Policy":
                                "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
                },
                watch: {
                        usePolling: true,
                        interval: 300, // ms; tune if CPU gets high
                },
                // Proxy external API calls through dev server to avoid CORS issues
                proxy: {
                        "/api/geolocation": {
                                target: "https://ipgeolocation.abstractapi.com",
                                changeOrigin: true,
                                rewrite: (path) =>
                                        path.replace(/^\/api\/geolocation/, "/v1/?api_key=free"),
                                secure: false,
                                headers: {
                                        Accept: "application/json",
                                },
                        },
                        "/api/country": {
                                target: "https://api.country.is",
                                changeOrigin: true,
                                rewrite: (path) => path.replace(/^\/api\/country/, ""),
                                secure: false,
                                headers: {
                                        Accept: "application/json",
                                },
                        },
                        "/api": {
                                target: "http://localhost:8001",
                                changeOrigin: true,
                                secure: false,
                        },
                },
        },
        build: {
                chunkSizeWarningLimit: 1500,
        },
});
