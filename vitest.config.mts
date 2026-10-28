import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["**/*.test.ts"],
    // .claude/ holds agent worktrees (whole checkouts with their own node_modules).
    exclude: ["node_modules/**", ".next/**", ".claude/**"],
  },
});
