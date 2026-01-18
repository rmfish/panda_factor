import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/factor/',
  plugins: [react()],
  resolve: {
    alias: {
      '@semi-ui-theme': path.resolve(
        __dirname,
        'node_modules/@douyinfe/semi-ui/dist/css/semi.min.css'
      )
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
