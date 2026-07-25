import { build } from 'vite';
import { build as buildServer } from 'esbuild';
import react from '@vitejs/plugin-react';
import path from 'path';

async function main() {
  console.log("🚀 Starting Windows Server / Plesk IIS optimized build...");

  // 1. Build Client with Vite Programmatic API
  // Passing configFile: false completely bypasses Vite's config file search & esbuild config bundler.
  // This resolves "Cannot read directory ../../../..: Access is denied" errors on IIS / Plesk.
  await build({
    configFile: false,
    root: process.cwd(),
    base: './',
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        allow: ['.'],
      },
    },
  });

  console.log("✅ Client build complete (dist/)");

  // 2. Build Server with esbuild Programmatic API
  await buildServer({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/server.cjs',
    absWorkingDir: process.cwd(),
  });

  console.log("✅ Server build complete (dist/server.cjs)");
}

main().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
