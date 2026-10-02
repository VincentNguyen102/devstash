import { defineConfig } from "vitest/config";

// Unit tests cover server actions and utilities only — never components.
// Components are verified in the browser, so the environment is plain Node
// (no jsdom / testing-library) and the scope below is limited to `src/actions`
// and `src/lib`.
export default defineConfig({
  // Resolve the `@/*` alias from tsconfig.json (native Vite 8 support).
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/actions/**/*.test.ts", "src/lib/**/*.test.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/actions/**/*.ts", "src/lib/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/generated/**",
        "src/lib/mock-data.ts",
      ],
    },
  },
});
