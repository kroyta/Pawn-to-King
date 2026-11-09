import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    // Für die Einzeldatei-Version (INLINE_ASSETS=1) werden Bilder direkt eingebettet
    assetsInlineLimit: process.env.INLINE_ASSETS ? 100_000_000 : 4096,
  },
});
