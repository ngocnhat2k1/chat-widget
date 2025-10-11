import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/widget.tsx',
      name: 'ChatWidget',
      fileName: (format) => `chat-widget.${format}.js`,
      formats: ['iife'] // Only IIFE for embeddable widget
    },
    rollupOptions: {
      external: [], // Bundle everything for standalone widget
      output: {
        globals: {},
        // Ensure CSS is inlined
        assetFileNames: (assetInfo) => {
          return assetInfo.name === 'style.css' ? 'chat-widget.css' : assetInfo.name!;
        }
      }
    },
    // Ensure CSS is extracted
    cssCodeSplit: false,
    // Make build smaller
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 5173
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001'),
  }
})
