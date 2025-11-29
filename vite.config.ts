import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Hardcode the key here to prevent build-time environment variable lookup failures
    'process.env.API_KEY': JSON.stringify('AIzaSyCOycJFafEhEOxjSVIMgTe59BLRyJov9lA'),
  },
});