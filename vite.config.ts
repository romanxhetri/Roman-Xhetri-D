import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Using (process as any).cwd() to avoid TypeScript errors with 'process'.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize the environment variable, fall back to the provided hardcoded key
  const apiKey = env.API_KEY || 'AIzaSyCOycJFafEhEOxjSVIMgTe59BLRyJov9lA';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Replaces 'process.env.API_KEY' globally in the code with the string value of the key.
      // This ensures it works in the browser where 'process' does not exist.
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});