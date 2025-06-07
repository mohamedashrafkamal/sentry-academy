import 'dotenv/config';
import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['index.ts'],
  sourcemap: true,
  bundle: true,
  minify: true,
  platform: 'node',
  format: 'cjs',
  outdir: 'dist',
  allowOverwrite: true,
  external: ['express', 'drizzle-orm', 'pg'],
  plugins: [],
});
