// Simple build script using esbuild to produce ESM and CJS bundles
// Run with: node scripts/build.js
const { build } = require('esbuild');
const path = require('path');

const entry = path.resolve(__dirname, '..', 'packages', 'core', 'src', 'index.js');
const outDir = path.resolve(__dirname, '..', 'packages', 'core', 'dist');

(async () => {
  // ESM build
  await build({
    entryPoints: [entry],
    outfile: path.join(outDir, 'esm', 'index.js'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: ['node18'],
    sourcemap: false,
    logLevel: 'error',
  });
  // CJS build (output .cjs to avoid Node treating as ESM)
  await build({
    entryPoints: [entry],
    outfile: path.join(outDir, 'cjs', 'index.cjs'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: ['node18'],
    sourcemap: false,
    logLevel: 'error',
  });
  console.log('Build completed');
})();
