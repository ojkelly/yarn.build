import { defineConfig } from "oxlint";

export default defineConfig({
  rules: {
    "no-unused-vars": "warn",
    "no-console": "off",
  },
  ignorePatterns: [
    "node_modules/**",
    "dist/**",
    "bundles/**",
    ".yarn/**",
    "e2e/lambda-project/.yarn/**",
    "*.cjs",
    "docs/**",
  ],
});
