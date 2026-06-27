# 群选择弹窗 roomId/groupID/userID 必填防护

时间：2026-06-24

## 背景

继续对照 `docs/openim-swagger.json` 复核群成员邀请、踢人、转让相关入口：

- `/room/member/update`：邀请或更新群成员时需要可用 `roomId` 和目标成员列表。
- `/room/member/delete`：移除群成员时需要 `roomId/userId`。
- `/room/transfer`：转让群时需要 `roomId/toUserId`。

`ChooseModal` 原有实现已经检查 `groupID/roomId`，但未统一 trim，且邀请、踢人、转让会直接使用 `choosedList` 中的 `userID!`。当选择项来自 SDK 兜底数据或异常业务数据时，缺少目标 `userID` 会暴露不可执行的 mutation 入口。

## 变更

- `src/pages/common/ChooseModal/index.tsx`
  - 新增 `normalizeChooseText`，统一 trim `groupID/roomId/userID`。
  - 新增 `getSelectedUserIDs`，邀请和踢人只使用有效 `userID` 列表。
  - `INVITE_TO_GROUP` 必须有 `groupID/roomId/userIDList` 才调用 `/room/member/update` 和 SDK 邀请。
  - `KICK_FORM_GROUP` 必须有 `groupID/roomId/userIDList` 才调用 `/room/member/delete` 和 SDK 踢人。
  - `TRANSFER_IN_GROUP` 必须有 `groupID/roomId/toUserId` 才调用 `/room/transfer` 和 SDK 转让。
  - 确认弹窗前新增同样的 group action 参数检查，避免先确认再失败。
  - `CRATE_GROUP` 顺手过滤缺 `userID` 的选择项，避免非空断言透传。

- `src/pages/chat/queryChat/GroupSetting/GroupMemberRow.tsx`
  - 组装 `GroupChooseExtraData` 时统一 trim `groupID/roomId`。
  - 缺 `groupID` 或 `roomId` 时不展示邀请/踢人入口。
  - 执行层保留兜底防护，避免异常点击打开无效选择弹窗。

- `src/pages/chat/queryChat/GroupSetting/GroupMemberListHeader.tsx`
  - 成员列表页头部邀请入口统一 trim `groupID/roomId`。
  - 缺 `groupID` 或 `roomId` 时不展示邀请按钮。
  - 执行层保留兜底防护。

- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - `businessRoomId` 和转让群 `groupID` 统一 trim。
  - 转让群入口必须有 `groupID/roomId` 才打开选择弹窗。

## 结论

- 群邀请、踢人、转让入口现在与 Swagger 必填参数契约更一致。
- 缺少群上下文或目标用户 ID 时，不再进入业务接口调用链路。
- 本轮只做源码层参数防护，未点击邀请、踢人、转让，也未触发任何真实 mutation。
- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
