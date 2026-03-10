import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "vi-axe",
      fileName: "vi-axe",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["node:util"],
    },
  },
});
