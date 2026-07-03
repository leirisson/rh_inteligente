import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    envFiles: [".env.test"],
    // Integration tests share one Postgres DB and clean it with deleteMany() in
    // beforeEach/afterAll — running test files concurrently races those cleanups
    // (FK violations, cross-test data bleed). Force serial file execution.
    fileParallelism: false,
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts", "src/test/**", "src/**/*.d.ts"],
      thresholds: {
        statements: 80,
        lines: 80,
        branches: 70,
        functions: 70,
      },
    },
    // *.unit.test.ts  — no DB needed (Prisma mocked)
    // *.integration.test.ts — needs convoca_test DB running
  },
});
