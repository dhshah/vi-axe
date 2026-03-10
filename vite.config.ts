import fs from "node:fs";

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
  plugins: [
    unpluginIsolatedDecl(),
    {
      name: "export typings.d.ts",
      closeBundle() {
        fs.copyFileSync("src/typings.d.ts", "dist/typings.d.ts");
      },
    },
  ],
});
