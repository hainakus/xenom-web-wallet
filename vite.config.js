import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Intercept /sdk/kaspa.js before vite:import-analysis can reject it.
// The actual runtime load is done via a computed URL in sdk.js so Vite
// never statically resolves the public/ path.
const kaspaExternalPlugin = {
  name: 'kaspa-sdk-external',
  enforce: 'pre',
  resolveId(id) {
    if (id === '/sdk/kaspa.js' || id.endsWith('/sdk/kaspa.js')) {
      return { id, external: true };
    }
  },
};

export default defineConfig({
  plugins: [kaspaExternalPlugin, react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      external: ['/sdk/kaspa.js'],
    },
  },
});
