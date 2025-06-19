import { sentryVitePlugin } from "@sentry/vite-plugin";
import "dotenv/config";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { configDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      org: "workshop-academy",
      project: "academy-frontend",
    }),
  ],

  optimizeDeps: {
    exclude: ["lucide-react"],
  },

  build: {
    sourcemap: true,
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    exclude: [...configDefaults.exclude],
  },
});
