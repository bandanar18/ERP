import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

/**
 * Vite config para el frontend en monorepo con Turborepo
 * 
 * Turborepo pasa las variables definidas en turbo.json globalEnv
 * desde el .env de la raíz del monorepo.
 */
export default defineConfig(({ mode }) => {
  // Carga variables de entorno (Turborepo ya inyectó las del .env raíz)
  const env = loadEnv(mode, process.cwd(), '');
  
  // URL del backend: usa VITE_API_URL o PORT (con fallback a 3000)
  const apiUrl = env.VITE_API_URL || `http://localhost:${env.PORT || 3000}`;

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss()
    ],
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) =>{
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log(`[Proxy] Sending: ${req.method} ${req.url} → ${apiUrl}${req.url}`);
            });
            proxy.on('proxyRes', (_proxyRes, req, _res) => {
              console.log(`[Proxy] Received: ${req.method} ${req.url} → ${_proxyRes.statusCode}`);
            });
          }
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
