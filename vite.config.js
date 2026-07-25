import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration optimized for Windows Server / Plesk IIS environment
export default defineConfig({
  plugins: [react()],
  configFile: false,
  root: '.',
  server: {
    fs: {
      strict: true,
      allow: ['.'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
