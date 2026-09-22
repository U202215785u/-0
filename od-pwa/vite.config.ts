import { defineConfig } from 'vite'

// 仓库名用于 GitHub Pages 子路径部署
const repoName = process.env.GITHUB_REPO || '-0'

export default defineConfig({
  base: `/${repoName}/`,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 纯静态站点：不应用 JS/CSS 的 hash，保持文件名稳定以便 Service Worker 缓存
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  publicDir: 'public'
})
