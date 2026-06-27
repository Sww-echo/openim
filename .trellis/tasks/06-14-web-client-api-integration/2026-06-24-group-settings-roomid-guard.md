# 群设置保存 roomId 必填防护

时间：2026-06-24

## 背景

对照 `docs/openim-swagger.json` 复核群设置和高风险群操作：

- `/room/update`：`roomId` 必填，其它群设置字段按需传递。
- `/room/delete`：`roomId` 必填。
- `/room/member/delete`：`roomId/userId` 必填。

当前 `useGroupSettings` 会从业务数据里提取业务 `roomId`，缺失时用 OpenIM `groupID` 兜底；但没有统一 trim，也存在 business-only 设置在缺 ID 时只更新本地 store 的风险。

## 变更

- `src/pages/chat/queryChat/GroupSetting/useGroupSettings.tsx`
  - 新增 `normalizeBusinessRoomId`，统一把业务 `roomId` 或 OpenIM `groupID` 兜底值转换为 trim 后字符串。
  - `/room/update` 对应的 `updateRoomSettings` 缺 `roomId` 时直接返回，不再只更新本地群信息。
  - `updateGroupPermission` 和 `updateGroupInfo` 在需要同步 `/room/update` 时，缺 `roomId` 直接返回，避免跳过 businessApi 后继续伪成功。
  - 解散群组 `/room/delete` 必须有 `roomId` 才允许进入确认链路。
  - 退出群组 `/room/member/delete` 必须有 `roomId/userId` 才允许进入确认链路。

## 结论

- 群设置保存、解散群组、退出群组入口现在与 Swagger 的必填参数契约对齐。
- 本轮只做参数防护，未点击保存、退出、解散或其它真实 mutation。
- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
