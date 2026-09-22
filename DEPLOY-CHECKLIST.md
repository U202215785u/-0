# 家宴 PWA - GitHub Pages 部署清单

## ✅ 已完成的准备工作

1. ✅ 更新了 `app/vite.config.ts` - 支持 GitHub Pages 子路径部署
2. ✅ 创建了 `.github/workflows/deploy.yml` - GitHub Actions 自动部署工作流
3. ✅ 创建了 `DEPLOY.md` - 详细部署文档

## 📋 您需要执行的步骤

### 第一步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 创建一个新的**公开仓库（Public）**
3. 仓库名建议：`jiayan-pwa` 或您喜欢的名字
4. **不要**勾选 "Initialize with README"

### 第二步：推送代码到 GitHub

在 PowerShell 中执行以下命令（需要管理员权限解决执行策略问题）：

```powershell
# 方法1：临时允许脚本执行
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 然后进入项目目录
cd C:\Users\15387\Documents\Codex\2026-08-31\new-chat-2

# 初始化 git（如果还没有）
git init

# 添加远程仓库（替换为您的用户名和仓库名）
git remote add origin https://github.com/您的用户名/jiayan-pwa.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 家宴 PWA with GitHub Pages deployment"

# 推送到 main 分支
git branch -M main
git push -u origin main
```

**如果遇到 git 未安装的问题**，可以使用 GitHub Desktop 或其他 Git 客户端。

### 第三步：配置 GitHub Pages

1. 打开您的 GitHub 仓库页面
2. 点击顶部菜单的 **Settings**
3. 左侧菜单找到并点击 **Pages**
4. 在 **Build and deployment** 部分：
   - **Source**: 选择 **GitHub Actions**
5. 系统会自动识别我们创建的 `.github/workflows/deploy.yml`

### 第四步：等待部署完成

1. 切换到 **Actions** 标签页
2. 您会看到一个正在运行的工作流 "Deploy to GitHub Pages"
3. 等待它完成（通常 2-5 分钟）
4. 绿色对勾表示成功

### 第五步：访问应用

部署成功后，您的应用将在：
```
https://您的用户名.github.io/仓库名/
```

例如：`https://username.github.io/jiayan-pwa/`

## 📱 在手机端安装

### iPhone (Safari)
1. 用 Safari 打开上面的 URL
2. 点击底部的 **分享按钮**（方框带箭头）
3. 向下滚动，点击 **"添加到主屏幕"**
4. 输入名称"家宴"，点击右上角"添加"
5. 现在可以像普通 App 一样使用！

### Android (Chrome)
1. 用 Chrome 打开上面的 URL
2. 点击右上角的 **三个点菜单**
3. 点击 **"添加到主屏幕"** 或 **"安装应用"**
4. 确认安装
5. 应用会出现在主屏幕上

## 🔄 后续更新

每次修改代码后，只需：

```powershell
git add .
git commit -m "描述您的更改"
git push
```

GitHub Actions 会自动重新构建和部署！

## ⚠️ 注意事项

1. **首次推送可能需要几分钟**才能完成部署
2. **确保仓库是公开的**（Public），否则 GitHub Pages 无法访问
3. **清除浏览器缓存**以查看最新版本
4. 菜谱数据位于 `app/catalog/recipes/`，添加新菜谱后推送即可

## 🐛 常见问题

### Q: 部署后看到 404 错误
A: 
- 确认 URL 格式正确：`https://username.github.io/repo-name/`
- 检查仓库是否为公开（Public）
- 等待 1-2 分钟后刷新

### Q: GitHub Actions 失败
A:
- 点击 Actions 查看详细日志
- 常见原因：依赖安装失败、TypeScript 错误
- 可以先在本地运行 `npm run build` 测试

### Q: 如何自定义域名？
A:
- 在 Settings → Pages → Custom domain 中设置
- 需要在域名提供商处配置 DNS

## 🎉 部署完成后

您就可以：
- 在任何设备上通过浏览器访问
- 安装为 PWA 离线使用
- 分享给家人朋友
- 继续使用点菜码功能在设备间传递菜品选择

祝您部署顺利！如有问题请查看 `DEPLOY.md` 获取更详细的说明。
