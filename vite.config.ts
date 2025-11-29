import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Robustly load the API key:
      // 1. Check loaded .env files (env.API_KEY)
      // 2. Check system environment variables (process.env.API_KEY) - critical for Netlify
      // 3. Fallback to the provided key
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || 'AIzaSyCOycJFafEhEOxjSVIMgTe59BLRyJov9lA'),
    },
  };
});