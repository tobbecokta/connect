import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: parseInt(process.env.PORT || '5179'),
    strictPort: false,
    hmr: {
      port: parseInt(process.env.PORT || '5179'),
      clientPort: parseInt(process.env.PORT || '5179'),
    },
  },
});
