# 家宴：本地优先家庭菜谱 PWA

这是一个给夫妻两人使用的本地优先家庭菜谱工具：在手机或电脑上找菜、安排一周菜单、生成购物清单，也可以用文本点菜码把想吃的菜交给做饭设备。

## 本地开发

```powershell
npm install
npm run dev
```

常用验证命令：

```powershell
npm run test
npm run build
npm run e2e
```

`npm run build` 会先校验 `catalog/recipes/*.json`，再生成静态 catalog 和 PWA service worker。

## 使用方式

- 做饭端：从“找菜”进入菜谱详情，可调整份数、开始烹饪、加入周计划；“周计划”默认展示午餐和晚餐，“采购”按菜单生成可勾选购物清单，也支持添加一项手购物品。
- 点菜端：进入 `#/choose`，妻子只浏览和点击“想吃”，不会看到收藏、开始烹饪或加入菜单入口。点击“去找菜”会进入受限的选菜浏览。
- 点菜码：点菜端会生成 `家宴点菜: {...}` 文本。做饭端进入 `#/import` 粘贴导入；导入内容只进入本地 inbox，不会自动修改周计划。
- PWA：生产构建后用 `npm run preview` 打开，在支持 PWA 的浏览器中选择“安装应用”。安装并首次打开后，菜谱浏览可离线使用；夫妻两台设备的数据保存在各自浏览器的 IndexedDB 中。

## 导入新菜谱

只把已经整理好的 canonical JSON 放入 `catalog/recipes/`，字段规则见 `catalog/recipes/README.md`。应用只接受固定字段，未知字段、冲突数量字段和不合法数值会在构建时失败。不能凭空补数量、步骤、营养、作者或来源；只有同时具备材料和步骤的记录才会显示为可烹饪菜谱。

当前资料库共有 54 条来源索引，但只有 1 条完整可烹饪记录（`beef-chow-fun`）；其余来源需要先人工整理成 canonical JSON，不能直接在 App 中抓网页或编辑。

## 设计取向

界面按 Apple Human Interface Guidelines 的 hierarchy、harmony、consistency 思路保持内容优先、语义控件优先、触控目标清晰，并在窄屏与宽屏之间调整布局。它是 Web PWA，不伪装成 Apple 系统界面，也不依赖后端、账号、AI 或网页抓取。
