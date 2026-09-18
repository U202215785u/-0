import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // 静态菜谱库（1108 道）打包后约 2.45 MB，超过 workbox 默认 2 MiB 预缓存上限；
        // 这是离线模式必须预缓存的静态数据，提高上限以正常离线使用。
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: '家宴',
        short_name: '家宴',
        description: '本地优先的家庭菜谱工具：找菜、周计划、购物清单、点菜交接。',
        lang: 'zh-CN',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#f5f5f7',
        background_color: '#f5f5f7',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Keep the shared runtime, UI framework and the static recipe catalog in
        // stable, separately-cached chunks so the app shell stays small on mobile.
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              priority: 30,
            },
            {
              name: 'catalog',
              test: /[\\/]generated[\\/]catalog\.json$/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', 'e2e/**'],
  },
})
