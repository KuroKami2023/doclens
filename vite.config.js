import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config — JavaScript only, no TypeScript.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2500, // tesseract + pdf.js + opencv are heavy
  },
  optimizeDeps: {
    exclude: ['@techstark/opencv-js'],
  },
});
