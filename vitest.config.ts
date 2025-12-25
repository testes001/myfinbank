import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules",
      "backend/**",
      "codex/**",
      "dist/**",
    ],
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    environment: "jsdom",
  },
});
