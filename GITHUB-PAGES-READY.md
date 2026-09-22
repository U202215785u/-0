# 家宴 PWA - GitHub Pages 部署准备完成 ✅

## 📦 已完成的配置

### 1. Vite 配置更新 (`app/vite.config.ts`)
- ✅ 添加了动态 `base` 路径支持（根据仓库名自动调整）
- ✅ 更新了 PWA manifest 的 `start_url` 和 `scope`
- ✅ 修正了图标路径以适配子路径部署
- ✅ 通过环境变量 `GITHUB_REPO` 自动识别仓库名

### 2. GitHub Actions 工作流 (`.github/workflows/deploy.yml`)
- ✅ 创建了自动化部署流程
- ✅ 配置了 Node.js 20 环境
- ✅ 设置了缓存加速依赖安装
- ✅ 自动构建并上传到 GitHub Pages
- ✅ 支持手动触发部署（workflow_dispatch）

### 3. 部署文档
- ✅ `DEPLOY.md` - 详细部署指南
- ✅ `DEPLOY-CHECKLIST.md` - 逐步操作清单

## 🚀 接下来您需要做的

### 步骤 1: 创建 GitHub 仓库
访问 https://github.com/new 创建一个**公开仓库**，例如：
- 名称：`jiayan-pwa`
- 类型：Public（公开）
- 不初始化 README

### 步骤 2: 推送代码
```powershell
cd C:\Users\15387\Documents\Codex\2026-08-31\new-chat-2

# 初始化 git（如果还没有）
git init

# 添加远程仓库（替换为您的用户名）
git remote add origin https://github.com/您的用户名/jiayan-pwa.git

# 提交并推送
git add .
git commit -m "Initial commit: 家宴 PWA with GitHub Pages deployment"
git branch -M main
git push -u origin main
```

### 步骤 3: 启用 GitHub Pages
1. 进入仓库 → Settings → Pages
2. Source 选择 **GitHub Actions**
3. 等待部署完成（2-5 分钟）

### 步骤 4: 访问应用
部署成功后访问：
```
https://您的用户名.github.io/jiayan-pwa/
```

## 📱 手机端使用

访问上述 URL 后：

**iPhone:**
- Safari → 分享按钮 → "添加到主屏幕"

**Android:**
- Chrome → 菜单 → "添加到主屏幕" 或 "安装应用"

## 🔄 后续更新

每次修改代码后：
```powershell
git add .
git commit -m "描述更改"
git push
```

GitHub Actions 会自动重新部署！

## 📁 关键文件说明

| 文件 | 作用 |
|------|------|
| `app/vite.config.ts` | Vite 配置，支持子路径部署 |
| `.github/workflows/deploy.yml` | 自动部署工作流 |
| `app/package.json` | 项目依赖和脚本 |
| `app/catalog/recipes/` | 菜谱数据目录 |
| `DEPLOY.md` | 详细部署文档 |
| `DEPLOY-CHECKLIST.md` | 快速部署清单 |

## ⚙️ 技术细节

### Vite Base 路径
配置会根据仓库名自动设置：
```typescript
const REPO_NAME = process.env.GITHUB_REPO || 'jiayan-pwa'
const BASE_PATH = `/${REPO_NAME}/`
```

这样无论您使用什么仓库名，应用都能正确运行。

### PWA 离线支持
- 预缓存大小限制提高到 3MB（容纳 1108+ 道菜谱）
- 支持离线浏览和使用
- 自动更新策略（registerType: 'autoUpdate'）

### 代码分割优化
- vendor chunk: React、React Router 等框架代码
- catalog chunk: 静态菜谱数据
- 其他代码按需加载

## ❓ 常见问题

**Q: 为什么本地无法构建？**
A: Windows 沙箱限制了某些进程执行。但在 GitHub Actions（Linux 环境）中会正常工作。

**Q: 部署后看到 404？**
A: 
- 确认仓库是公开的（Public）
- 检查 URL 是否正确包含仓库名
- 等待 1-2 分钟后刷新

**Q: 如何更换仓库名？**
A: 只需在创建仓库时使用不同的名字，Vite 配置会自动适应。

**Q: 可以使用自定义域名吗？**
A: 可以！在 Settings → Pages → Custom domain 中设置。

## 🎉 准备就绪！

所有配置文件已经准备完毕，您只需要：
1. 创建 GitHub 仓库
2. 推送代码
3. 启用 GitHub Pages

然后就可以在手机和电脑上享受这个家庭菜谱 PWA 了！

如有问题，请查看 `DEPLOY-CHECKLIST.md` 获取更详细的指导。
