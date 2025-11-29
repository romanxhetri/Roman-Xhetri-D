import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize the environment variable, fall back to the provided key
  const apiKey = env.API_KEY || process.env.API_KEY || 'AIzaSyCOycJFafEhEOxjSVIMgTe59BLRyJov9lA';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Define process.env as a single object to prevent conflict and ensure API_KEY is present
      'process.env': JSON.stringify({
        API_KEY: apiKey,
        NODE_ENV: mode,
      }),
    },
  };
});