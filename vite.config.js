import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim()
  const wsProxyTarget = env.VITE_WS_PROXY_TARGET?.trim() || apiProxyTarget

  const proxy = apiProxyTarget
    ? {
        '/api/v1': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ws': wsProxyTarget
          ? {
              target: wsProxyTarget,
              changeOrigin: true,
              secure: false,
              ws: true,
            }
          : undefined,
      }
    : undefined

  if (proxy && proxy['/ws'] === undefined) {
    delete proxy['/ws']
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')
            ) {
              return 'react-vendor'
            }

            if (
              id.includes('node_modules/axios/') ||
              id.includes('node_modules/zustand/')
            ) {
              return 'data-vendor'
            }

            if (id.includes('node_modules/framer-motion/')) {
              return 'motion-vendor'
            }

            if (id.includes('node_modules/lucide-react/')) {
              return 'icon-vendor'
            }

            return 'vendor'
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@app': path.resolve(__dirname, './src/app'),
        '@entities': path.resolve(__dirname, './src/entities'),
        '@features': path.resolve(__dirname, './src/features'),
        '@widgets': path.resolve(__dirname, './src/widgets'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy,
    },
  }
})
