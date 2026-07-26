import { build } from 'vite';
import { build as buildServer } from 'esbuild';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

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

  // Plugin to stop esbuild from walking up directory tree on Windows Plesk / IIS
  const iisPleskResolverPlugin = {
    name: 'iis-plesk-resolver',
    setup(build) {
      // 1. Intercept all bare package imports (e.g. 'express', 'dotenv', 'mysql2/promise')
      build.onResolve({ filter: /^[^./]/ }, (args) => {
        return { path: args.path, external: true };
      });

      // 2. Intercept relative imports (e.g. './foo', '../bar')
      build.onResolve({ filter: /^\./ }, (args) => {
        const resolveDir = args.resolveDir || rootDir;
        const targetPath = path.resolve(resolveDir, args.path);

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
          return { path: targetPath };
        }

        const exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '/index.ts', '/index.js', '/index.tsx'];
        for (const ext of exts) {
          if (fs.existsSync(targetPath + ext)) {
            return { path: targetPath + ext };
          }
        }

        return { path: targetPath };
      });
    },
  };

  // 2. Build Server with esbuild Programmatic API via stdin to prevent parent directory traversal
  await buildServer({
    stdin: {
      contents: fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf8'),
      resolveDir: rootDir,
      sourcefile: 'server.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    sourcemap: true,
    outfile: path.join(rootDir, 'dist', 'server.cjs'),
    plugins: [iisPleskResolverPlugin],
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
