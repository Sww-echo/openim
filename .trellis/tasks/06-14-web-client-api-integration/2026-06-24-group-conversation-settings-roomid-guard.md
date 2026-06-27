# 群会话设置 roomId 必填防护

时间：2026-06-24

## 背景

继续对照 `docs/openim-swagger.json` 复核群设置抽屉里的会话级操作：

- `/room/openim/member/set-offline-no-push`：`roomId` 必填，`offlineNoPushMsg` 可选。
- `/room/openim/member/set-top`：`roomId` 必填，`top` 可选。
- `/room/openim/member/clear-message`：`roomId` 必填。

原实现中，如果 `businessRoomId` 缺失，会跳过 businessApi 调用，但仍继续调用 OpenIM SDK 或更新本地状态。这会造成业务接口未落库、页面却表现为成功的假成功状态。

## 变更

- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - `updateGroupNoPush` 缺 `businessRoomId` 时直接提示失败并返回，不再进入确认链路。
  - `updateGroupTop` 缺 `businessRoomId` 时直接提示失败并返回，不再进入确认链路。
  - `clearGroupMessages` 缺 `businessRoomId` 时直接提示失败并返回，不再进入清空确认链路。
  - 上述三个操作现在必须先完成对应 businessApi 调用，成功后才继续同步 OpenIM SDK 或本地状态。

## 结论

- 群免打扰、群置顶、清空群消息游标三个入口现在与 Swagger `roomId` 必填契约对齐。
- 缺业务 `roomId` 时不再出现只更新 SDK/本地状态的假成功。
- 本轮只做源码层参数防护，未点击保存、置顶、清空或任何真实 mutation。
- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
