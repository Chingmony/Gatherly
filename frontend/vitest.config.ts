import { defineConfig } from "vitest/config";

export default defineConfig({
  // Inline an empty PostCSS config so Vite does not discover and load the project's
  // postcss.config.mjs (Tailwind v4) into the test pipeline — irrelevant for Node unit tests.
  css: {
    postcss: { plugins: [] },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
