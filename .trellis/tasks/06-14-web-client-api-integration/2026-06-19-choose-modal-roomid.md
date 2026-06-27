# 2026-06-19 群选择弹窗 roomId 修正

## 背景

继续复扫 business `roomId` 与 OpenIM SDK `groupID` 混用风险时，发现 `ChooseModal` 的群邀请、踢人、转让群主三个动作使用同一个 `extraData` 字符串：

- SDK 调用需要 OpenIM `groupID`。
- businessApi 调用需要业务侧 `roomId`。

原实现会把 `extraData as string` 同时传给 `addBusinessGroupMembers`、`deleteBusinessGroupMember`、`transferBusinessGroupOwner` 和 SDK，存在把 OpenIM `groupID` 误传给业务接口的风险。

## 处理

- `src/pages/common/ChooseModal/index.tsx`
  - 新增 `GroupChooseExtraData`，显式区分 `groupID` 与 `roomId`。
  - 增加兼容解析，旧的字符串 `extraData` 仍作为 SDK `groupID` 识别。
  - 群邀请、踢人、转让群主在缺少 `groupID` 或业务 `roomId` 时不再继续调用 businessApi/SDK，避免错误写操作。
- `src/pages/chat/queryChat/ChatHeader/index.tsx`
  - 群会话头部邀请入口改为传 `{ groupID, roomId }`。
- `src/pages/chat/queryChat/GroupSetting/GroupMemberRow.tsx`
  - 群设置成员行的邀请、踢人入口改为传 `{ groupID, roomId }`。
- `src/pages/chat/queryChat/GroupSetting/GroupMemberListHeader.tsx`
  - 群成员列表头部邀请入口改为传 `{ groupID, roomId }`。
- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - 转让群主入口改为传 `{ groupID, roomId }`。

## 验证

- 本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。
- 源码核对确认 `ChooseModal` 内不再存在 `extraData as string` 作为业务 `roomId` 的用法。
- 真实 Chrome 临时上下文可使用 `18888888888` 登录进入 `#/chat`，但跳转群路由并点击群设置时应用回到 `#/login`；本轮未能完成群邀请/踢人/转让群主弹窗复测。
- 完整浏览器验收仍需要具备群主/管理员权限的真实群，并且只打开确认框；实际邀请、踢人、转让群主属于远端 mutation，需用户明确确认后才能触发。
