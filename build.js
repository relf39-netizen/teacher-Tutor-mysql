import { build } from 'vite';
import { build as buildServer } from 'esbuild';
import react from '@vitejs/plugin-react';
import path from 'path';

async function main() {
  console.log("🚀 Starting Windows Server / Plesk IIS optimized build...");

  const rootDir = process.cwd();

  // 1. Build Client with Vite Programmatic API
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

  // 2. Build Server with esbuild Programmatic API
  // Using tsconfigRaw prevents esbuild from recursively scanning parent directories (../../../../)
  // for tsconfig.json on Windows IIS/Plesk environments where higher directory access is denied.
  await buildServer({
    entryPoints: ['./server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/server.cjs',
    absWorkingDir: rootDir,
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        target: 'es2022',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: 'react-jsx',
        skipLibCheck: true
      }
    })
  });

  console.log("✅ Server build complete (dist/server.cjs)");
}

main().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
