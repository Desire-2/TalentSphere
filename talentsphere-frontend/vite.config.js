import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
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
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
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
    },
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
    },
    envPrefix: 'VITE_',
  }
})
