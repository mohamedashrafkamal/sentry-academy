import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";
import "dotenv/config";
import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["index.ts"],
  sourcemap: true,
  bundle: true,
  minify: true,
  platform: "node",
  // sourcemap: true, // Source map generation must be turned on
  plugins: [
    // Put the Sentry esbuild plugin after all other plugins
    sentryEsbuildPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "workshop-academy",
      project: "academy-backend",
    }),
  ],
  format: "cjs",
  outdir: "dist",
  allowOverwrite: true,
  external: ["express", "drizzle-orm", "pg"],
});
