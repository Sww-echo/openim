# 2026-06-24 群通知 SDK groupID/userID 必填防护

## 背景

`/room/openim/join-requests/handle` 的业务审核接口依赖 `requestId/action`。当前群通知列表同时兼容 businessApi 申请数据和 OpenIM SDK 申请数据：当申请记录缺少业务 `requestId` 时，前端会跳过 businessApi 审核同步，继续保留 OpenIM SDK 的同意/拒绝兼容路径。

该兼容路径不能贸然删除，否则会影响 SDK 原生群申请处理。但 SDK 调用本身仍要求有效的 `groupID` 和申请来源 `userID`。

## 变更

- `src/pages/contact/groupNotifications/index.tsx`
  - 新增申请 ID 归一化逻辑。
  - 群通知同意前先 trim 并校验 `groupID/userID`。
  - 群通知拒绝前先 trim 并校验 `groupID/userID`。
  - 缺少任一 ID 时直接提示失败并返回，不调用 businessApi，也不调用 OpenIM SDK。
  - businessApi 缺 `requestId` 时仍保持原兼容策略：跳过业务审核同步，保留 SDK 处理。

- `src/components/ApplicationItem/index.tsx`
  - 申请卡片统一 trim `groupID/fromUserID/toUserID`。
  - 群卡片业务详情查询使用 trim 后 `roomId/groupID`。
  - 好友资料卡点击时缺目标用户 ID 直接返回，不向 `window.userClick` 传空白字符串。

## 约束

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发同意/拒绝。
- 本轮未触发任何真实审核 mutation。

## 后续验收条件

- 需要后端提供带真实业务 `requestId` 的入群申请数据，才能验证 `/room/openim/join-requests/handle` 的完整业务审核链路。
- 需要用户明确确认后，才能在真实浏览器中点击同意/拒绝进行 mutation 验收。
