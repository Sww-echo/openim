# 2026-06-19 本地消息删除确认保护

## 背景

继续审计聊天操作入口时，发现消息右键菜单中的 `Delete` 会直接调用 OpenIM SDK `deleteMessageFromLocalStorage`，随后从当前消息列表移除该消息。

虽然该操作不是业务接口远端 mutation，但它是用户可见的破坏性聊天操作，属于 Web 端“消息删除”功能范围。为避免误触导致本地消息立即消失，应与收藏、撤回、下载等入口保持一致，先展示确认框。

## 处理

- `src/pages/chat/queryChat/MessageItem/index.tsx`
  - 新增 `confirmDeleteLocalMessage`。
  - 右键菜单 `Delete` 改为先展示确认框。
  - 只有点击确认框 `OK` 后才调用 `deleteLocalMessage`。
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmDeleteMessage`：`确认删除这条本地消息吗？`
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmDeleteMessage`：`Delete this local message?`

## 真实 Chrome 复测

- 使用真实 Chrome 插件受控标签打开本地应用。
- 登录账号 `18888888888 / czp0422+` 成功进入 `#/chat`。
- 打开左侧会话 `www`，消息区正常显示文本消息：
  - `00`
  - `你是谁`
- 右键消息气泡，菜单显示：
  - `Copy`
  - `Forward`
  - `Favorite`
  - `Delete`
- 点击 `Delete` 后弹出确认框：
  - 标题：`Delete`
  - 内容：`Delete this local message?`
  - 按钮：`Cancel`、`OK`
- 点击 `Cancel` 后确认框关闭，原消息 `你是谁` 仍在页面中，未执行本地删除。

## 说明

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。浏览器复测只打开删除确认框并取消，没有点击 `OK`，未触发本地消息删除。
