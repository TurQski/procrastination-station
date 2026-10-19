import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";
// Explicit opt-in: never runs as part of npm test or credential-free CI.
for (const path of [".env.local", ".env.test.local"]) if (existsSync(path)) process.loadEnvFile(path);
export default defineConfig({ test: { environment: "node", include: ["tests/integration/**/*.test.ts"], testTimeout: 30_000, hookTimeout: 60_000, fileParallelism: false } });
