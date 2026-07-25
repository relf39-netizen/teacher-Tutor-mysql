import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(process.cwd()),
  envDir: path.resolve(process.cwd()),
  server: {
    fs: {
      strict: true,
      allow: [path.resolve(process.cwd())],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

