import { build } from 'vite';
import { transform } from 'esbuild';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log("🚀 Starting Windows Server / Plesk IIS optimized build...");

  const rootDir = process.cwd();

  // 1. Build Client with Vite Programmatic API
  // Passing configFile: false completely bypasses Vite's config file search & esbuild config bundler.
  // This resolves "Cannot read directory ../../../..: Access is denied" errors on IIS / Plesk.
  await build({
    configFile: false,
    root: rootDir,
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

  // 2. Build Server using esbuild transform (In-Memory String Transformation)
  // esbuild transform operates purely on in-memory strings without searching parent directories.
  // This completely eliminates Windows Plesk / IIS "Cannot read directory ../../../..: Access is denied" errors.
  const serverTsPath = path.join(rootDir, 'server.ts');
  const serverTsCode = fs.readFileSync(serverTsPath, 'utf8');

  const transformed = await transform(serverTsCode, {
    loader: 'ts',
    format: 'cjs',
    target: 'node18',
    sourcemap: 'inline',
  });

  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const distServerCjsPath = path.join(distDir, 'server.cjs');
  fs.writeFileSync(distServerCjsPath, transformed.code, 'utf8');

  console.log("✅ Server build complete (dist/server.cjs)");
  console.log("🎉 All builds completed successfully for Plesk IIS / Windows Server!");
}

main().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
