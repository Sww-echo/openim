# 2026-06-25 旧群发送前校验与清空消息兼容接入

## 接口

- `/room/sendMsgBefore`
- `/room/member/setBeginMsgTime`

## 接入位置

- `src/api/chat.ts`
  - 新增 `legacyGroupSendBefore()`，按 Swagger 传 `roomId`。
  - `groupSendBefore()` 改为同时调用 `/room/openim/send-before` 与 `/room/sendMsgBefore`。
  - 写操作复用 `settleAtLeastOneBusinessRequest()`，至少一个发送前校验接口成功才继续 OpenIM SDK 发送。
  - 保留 `openIMGroupSendBefore()` 作为新版接口独立封装，方便后续需要单独调用时复用。

- `src/api/group.ts`
  - 新增 `setLegacyGroupMemberBeginMsgTime()`，按 Swagger 传 `roomId` 调用 `/room/member/setBeginMsgTime`。

- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - 清空群聊天记录时，同时调用 `/room/openim/member/clear-message` 与 `/room/member/setBeginMsgTime`。
  - 至少一个业务接口成功后，再执行 OpenIM SDK 本地会话消息清理。

## 状态

已完成源码接入，待浏览器确认真实响应结构。

本轮未新增、未修改、未运行单元测试。浏览器复测仍受本地服务未启动影响。
