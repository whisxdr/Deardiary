import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split the vendor groups that every route shares. Letting Rollup decide the
        // rest keeps jsPDF and Recharts in the route chunks that actually use them.
        //
        // Split by package rather than by a fixed list. A list cannot express "React and
        // its jsx runtime here, Framer Motion there": Framer Motion imports React, and
        // whichever chunk holds `react/jsx-runtime` gets pulled in by every component.
        // Rollup previously placed the jsx runtime inside the motion chunk, which put the
        // animation library on the landing page's critical path even though that page no
        // longer animates with it.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
            return 'motion';
          }
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
});
