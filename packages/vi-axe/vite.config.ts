import unpluginIsolatedDecl from "unplugin-isolated-decl/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: ["src/index.ts", "src/extend-expect.ts"],
      formats: ["es"],
    },
    rollupOptions: {
      external: ["node:util"],
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
  plugins: [unpluginIsolatedDecl()],
});
