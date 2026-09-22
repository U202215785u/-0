@echo off
echo ========================================
echo GitHub 推送助手 - 家宴 PWA
echo ========================================
echo.
echo 请按照以下步骤操作：
echo.
echo 1. 访问 https://github.com/settings/tokens/new
echo 2. 生成一个新的 Personal Access Token (classic)
echo 3. 勾选 "repo" 权限
echo 4. 复制生成的 token
echo.
echo 然后将 token 粘贴到下面（输入时不会显示）：
echo.

set /p GITHUB_TOKEN="请输入您的 GitHub Token: "

echo.
echo 正在配置远程仓库...
git remote set-url origin https://%GITHUB_TOKEN%@github.com/U202215785u/-0.git

echo.
echo 正在推送到 GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ 推送成功！
    echo ========================================
    echo.
    echo 接下来请访问：
    echo https://github.com/U202215785u/-0/settings/pages
    echo.
    echo 在 Source 中选择 "GitHub Actions"
    echo 等待 2-5 分钟完成部署
    echo.
    echo 您的应用将在：
    echo https://U202215785u.github.io/-0/
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ 推送失败
    echo ========================================
    echo.
    echo 请检查：
    echo 1. Token 是否正确
    echo 2. 网络连接是否正常
    echo 3. 仓库是否存在且可访问
    echo.
)

pause
