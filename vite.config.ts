import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: process.cwd(),
  server: {
    fs: {
      strict: true,
      allow: [process.cwd()],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
