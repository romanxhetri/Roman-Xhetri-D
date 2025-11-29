
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // We removed the 'define' block for process.env.API_KEY because we are now
  // strictly using the hardcoded key in geminiService.ts to ensure it works
  // without complex build-time variable replacement issues on Netlify.
});
