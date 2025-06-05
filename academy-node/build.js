import 'dotenv/config';
import esbuild from 'esbuild';
import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';

esbuild.build({
  entryPoints: ['index.ts'],
  sourcemap: true,
  bundle: true,
  minify: true,
  platform: 'node',
  outdir: 'dist',
  allowOverwrite: true,
  plugins: [
    sentryEsbuildPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      sourcemaps: {
        filesToDeleteAfterUpload: ['**/*.js.map'],
      },
    }),
  ],
});
