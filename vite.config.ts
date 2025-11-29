import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Safe execution of process.cwd() for environments where process might be restricted
  const cwd = (process as any).cwd ? (process as any).cwd() : '.';
  const env = loadEnv(mode, cwd, '');
  
  // Prioritize the environment variable, fall back to the provided hardcoded key
  const apiKey = env.API_KEY || 'AIzaSyCOycJFafEhEOxjSVIMgTe59BLRyJov9lA';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Replaces 'process.env.API_KEY' globally in the code with the string value of the key.
      'process.env.API_KEY': JSON.stringify(apiKey),
      // IMPORTANT: Do not polyfill 'process.env' here as an object, as it can conflict 
      // with the window.process polyfill in index.html for libraries that check properties on it.
      // The shim in index.html handles the general 'process' existence.
    },
  };
});