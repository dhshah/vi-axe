import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "index.ts",
      name: "vi-axe",
      fileName: "vi-axe",
    },
  },
});