# 2026-06-20 入群审核 requestId 归一化

## 背景

Swagger `/room/openim/join-requests/handle` 必填参数为 `requestId`。当前 Web 有两个入群审核入口：

- 群设置抽屉的“入群审核”列表。
- 通讯录群通知中的 SDK 群申请通知。

此前两个入口各自读取 `requestId/joinRequestId/applyId/id`，通讯录群通知还额外解析 `ex`。如果后端或 SDK 扩展字段使用 `requestID/applyID/applicationId/joinApplyId/roomApplyId` 等常见别名，页面会识别不到业务申请 ID，导致无法优先调用 businessApi 审核接口。

## 本次处理

- `src/utils/businessPayload.ts`
  - 新增 `pickBusinessJoinRequestId`，统一读取 `requestId` 及常见别名。
  - 支持从 `data/result/obj/request/joinRequest/application/payload/detail/ex` 中递归读取。
  - 使用显式非空判断，避免数字型申请 ID 被 truthy 判断误丢。
- `src/pages/contact/groupNotifications/index.tsx`
  - 移除本地 `pickRequestId`，改用统一工具。
- `src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx`
  - 入群审核列表处理按钮改用统一工具读取申请 ID。

## 接口影响

- `/room/openim/join-requests/handle`：不改变调用时机和参数名，只提升 `requestId` 的字段兼容能力。
- 未识别到业务申请 ID 时，通讯录群通知仍保留原 SDK 处理流程。

## 验证状态

本轮仅做源码静态复核和本地 Vite 模块转译请求，未运行单元测试、构建或验证脚本，未点击同意/拒绝，未触发真实入群审核 mutation。
