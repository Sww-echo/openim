# 好友操作 toUserId 必填防护

时间：2026-06-24

## 背景

继续对照 `docs/openim-swagger.json` 复核单聊设置和好友关系接口：

- `/friends/add`：`toUserId` 必填。
- `/friends/delete`：`toUserId` 必填。
- `/friends/remark`：`toUserId/remarkName/describe` 必填。
- `/friends/update`：`toUserId` 必填。
- `/friends/update/OfflineNoPushMsg`：`offlineNoPushMsg` 必填，`toUserId/userId/type` 文档标为可选，但当前 Web 入口语义上必须有目标好友。
- `/friends/blacklist/add`：`toUserId` 必填。
- `/friends/blacklist/delete`：`toUserId` 必填。

原实现中，单聊设置、用户资料卡、发送好友申请和新朋友同意/拒绝存在直接使用 `currentConversation.userID`、`cardInfo.userID!`、`userID!` 或 `application.fromUserID` 的路径。异常数据或 SDK 兜底数据缺目标用户 ID 时，可能进入无效 businessApi 或 SDK mutation 调用。

## 变更

- `src/pages/chat/queryChat/SingleSetting/index.tsx`
  - 新增 `normalizeTargetUserID`，统一 trim 当前单聊目标用户。
  - 单聊免打扰、置顶、聊天记录保留时间、拉黑/移出黑名单、删除好友均要求目标用户 ID 存在。
  - 缺目标用户 ID 时直接提示失败并返回，不再打开确认链路或继续调用 SDK。

- `src/pages/common/UserCardModal/index.tsx`
  - 用户资料卡统一使用 trim 后的 `targetUserID` 读取好友资料、用户资料和跳转单聊。
  - 非本人且缺目标用户 ID 时不启动只读查询。
  - 添加好友入口要求 `cardInfo.userID` 或外部 `targetUserID` 可用。
  - 好友备注保存去掉 `userID!` 非空断言，必须有目标用户 ID 才调用 `/friends/remark` 和 SDK `updateFriends`。

- `src/pages/common/UserCardModal/SendRequest.tsx`
  - 发送好友申请前必须有目标用户 ID。
  - 缺目标用户 ID 时不打开确认框，发送按钮也置为不可用。

- `src/pages/contact/newFriends/index.tsx`
  - 同意/拒绝好友申请前必须能解析申请来源用户 ID。
  - 缺目标用户 ID 时不调用 `/friends/add` 或 OpenIM SDK 申请处理接口。

## 结论

- 好友新增、删除、备注、单聊设置、黑名单、好友申请处理入口现在都有目标用户 ID 防护。
- 缺 `toUserId` 时不会进入业务接口调用链路，也不会继续调用 SDK 造成假成功。
- 本轮只做源码层参数防护，未点击发送好友申请、同意/拒绝申请、删除好友、拉黑、备注保存或任何真实 mutation。
- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
