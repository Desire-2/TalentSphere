import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ _command, mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, './src'),
        }
      ],
    },
    server: {
      port: 5173,
      host: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173,
        clientPort: 5173,
      },
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying:', req.method, req.url, '→', options.target + req.url);
            });
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            // Exact package paths only: a substring check like '/react/' would
            // also capture @emotion/react and drag its @emotion/* deps into the
            // react chunk, creating a react<->vendor circular chunk dependency
            // (TDZ ReferenceError: Cannot access 'X' before initialization).
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
            if (id.includes('/react-router') || id.includes('@remix-run')) return 'router';
            if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts';
            if (id.includes('/@mui/') || id.includes('/@emotion/')) return 'mui';
            if (id.includes('/framer-motion/') || id.includes('/motion/')) return 'motion';
            if (id.includes('/jspdf/') || id.includes('/html2canvas/')) return 'pdf';
            return 'vendor';
          },
        },
      },
    },
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
    },
    envPrefix: 'VITE_',
  }
})
