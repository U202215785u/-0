# 家宴 PWA - GitHub Pages 部署指南

## 📱 快速部署步骤

### 1. 创建 GitHub 仓库

在 GitHub 上创建一个新的**公开仓库**（Public），例如：
- 仓库名：`jiayan-pwa`（或您喜欢的名字）
- 不要初始化 README、.gitignore 或 license

### 2. 初始化 Git 并推送代码

在项目根目录执行：

```powershell
# 进入项目根目录
cd C:\Users\15387\Documents\Codex\2026-08-31\new-chat-2

# 初始化 git（如果还没有）
git init

# 添加远程仓库（替换为您的用户名和仓库名）
git remote add origin https://github.com/您的用户名/jiayan-pwa.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 家宴 PWA"

# 推送到 main 分支
git branch -M main
git push -u origin main
```

### 3. 配置 GitHub Pages

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Pages**
3. 在 **Source** 下选择：
   - **Deploy from a branch**: ❌ 不选这个
   - **GitHub Actions**: ✅ 选择这个（我们已经创建了工作流）
4. 等待第一次部署完成（通常 2-5 分钟）

### 4. 访问您的应用

部署完成后，您的应用将在：
```
https://您的用户名.github.io/仓库名/
```

例如：`https://username.github.io/jiayan-pwa/`

## 🔄 自动部署

每次您推送代码到 `main` 分支时，GitHub Actions 会自动：
1. 安装依赖
2. 构建项目
3. 部署到 GitHub Pages

只需执行：
```powershell
git add .
git commit -m "更新内容"
git push
```

## 📱 在手机端使用

1. 用手机浏览器访问您的 GitHub Pages URL
2. **iPhone (Safari)**: 点击分享按钮 → "添加到主屏幕"
3. **Android (Chrome)**: 点击菜单 → "添加到主屏幕" 或 "安装应用"

应用将作为 PWA 安装，支持离线使用！

## ⚙️ 自定义仓库名

如果使用不同的仓库名，Vite 配置会自动从环境变量读取：

```typescript
const REPO_NAME = process.env.GITHUB_REPO || 'jiayan-pwa'
```

GitHub Actions 会自动传入正确的仓库名。

## 🐛 故障排查

### 构建失败
检查 GitHub Actions 日志，常见原因：
- 依赖安装失败：确保 `package-lock.json` 已提交
- TypeScript 错误：运行 `npm run build` 本地测试

### 404 错误
- 确认仓库是**公开的**（Public）
- 确认 URL 路径正确：`https://username.github.io/repo-name/`
- 检查 Vite 配置的 `base` 路径是否与仓库名匹配

### PWA 无法安装
- 确保通过 HTTPS 访问（GitHub Pages 默认提供）
- 检查浏览器控制台是否有错误
- 确认 `manifest.json` 正确加载

## 📝 注意事项

1. **首次部署可能需要几分钟**，请耐心等待
2. **代码变更不会立即生效**，需要等待 GitHub Actions 完成部署
3. **清除浏览器缓存**后访问最新版本的 URL
4. 菜谱数据在 `app/catalog/recipes/` 目录下，添加新菜谱后重新推送即可

## 🎯 下一步

部署成功后，您可以：
- 分享链接给家人朋友
- 在多台设备上安装为 PWA
- 通过点菜码功能在设备间传递菜品选择
- 继续开发和添加新功能
