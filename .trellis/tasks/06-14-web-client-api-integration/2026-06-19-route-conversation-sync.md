# 2026-06-19 会话路由同步修复

## 背景

真实 Chrome 插件复测时发现，直接访问 `#/chat/sg_3413653759` 或刷新 `#/chat/:conversationID` 后，消息区能按 URL 加载，但头部和设置入口可能仍引用旧的 `currentConversation`，导致群会话误打开单聊设置。

## 处理

- `src/layout/MainContentLayout.tsx`
  - 只在根路径 `/` 挂载时重定向到 `/chat`。
  - 不再把已有 `conversationID` 的路由强制重定向回 `/chat`。
- `src/pages/chat/queryChat/useConversationState.ts`
  - 根据 URL 中的 `conversationID` 从 `conversationList` 同步 `currentConversation`。
  - 同步前等待 SDK 同步状态不为 `loading`，且当前用户 `selfInfo.userID` 已存在，避免过早查询群成员导致群权限入口缺失。

## 真实 Chrome 复测

- 刷新 `http://127.0.0.1:7777/index.html#/chat/sg_4011035808` 后，页面保留在该群会话。
- 头部显示群名 `啊啊i`、成员数 `3`。
- 打开设置后显示完整群设置，包括群 ID、群类型、群免打扰、群置顶、清空聊天记录、群权限、消息销毁、阅后即焚、转让群和解散群入口。
- 未触发群设置保存、清空消息、解散群、转让群等 mutation。

## 说明

本轮没有运行单元测试、构建或验证脚本，验证方式仅为真实 Chrome 页面复测。控制台仍存在既有 AntD `findDOMNode` warning 和 React Router future flag warning，不影响本轮修复结论。
