# 2026-06-19 受保护路由鉴权门禁修正

## 背景

继续用 Codex 连接的 Google Chrome 复测直达群会话时，发现新建标签直接访问 `#/chat/sg_3413653759` 会在本地 token 检查完成前先渲染聊天子路由。此时 `useConversationState` 可能提前调用 `IMSDK.getOneConversation`，控制台出现 `get route conversation failed`，页面短暂半渲染。

该问题会影响群设置、群资源等依赖 `currentConversation/currentGroupInfo` 的 businessApi 入口验收。

## 处理

- `src/layout/MainContentWrap.tsx`
  - 增加本地 token 检查完成状态。
  - 非登录页在 token 检查完成前不渲染 `Outlet`，避免聊天页子组件抢跑 SDK/本地鉴权。
  - 登录页不阻塞渲染。
- `src/store/user.ts`
  - 受保护区初始状态改为 `isLogining: true`，等全局 SDK 登录流程明确完成后再关闭。
  - 退出登录时显式恢复 `isLogining: false`。
- `src/layout/useGlobalEvents.tsx`
  - 无本地 token 被导回登录页时显式结束登录态。

## 验证

- 本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。
- 使用 Codex 连接的 Google Chrome 新建标签直达 `http://localhost:7777/index.html#/chat/sg_3413653759`：
  - 在无可用本地 token 的新标签上下文中，页面直接回到登录页。
  - 控制台不再出现 `get route conversation failed`，只剩既有 React Router warning。
- 随后尝试在新标签登录再直达群会话时，当前账号被 SDK/后端判定为“账号在其他设备登录”并回到登录页；该现象由多标签/多会话重复登录触发，本轮未继续用新标签做深度复测，避免干扰用户已有浏览器会话。
