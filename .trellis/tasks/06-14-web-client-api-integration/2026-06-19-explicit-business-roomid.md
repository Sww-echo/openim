# 2026-06-19 显式业务 roomId 复测与修正

## 背景

真实 Chrome 复测群会话 `sg_3413653759` 时，选中群后出现：

- `/business-api/room/openim/detail?roomId=3413653759`
- `/business-api/room/openim/members?roomId=3413653759`

两者均返回 `resultCode=1010101`，提示“请求参数验证失败，缺少必填参数或参数错误”。

Swagger 中 `/room/openim/detail`、`/room/openim/members` 的 `roomId` 定义为“旧系统群ID”，不是 OpenIM SDK `groupID`。当前账号下 `/room/list`、`/room/list/his` 未返回该群旧系统映射，`/room/getRoomByJid?roomJid=3413653759` 返回“群组不存在”。

## 处理

- 新增 `pickExplicitBusinessRoomId`：只从 `roomId`、`roomID`、`jid`、`roomJid` 或明确不同于 fallback 的 `groupID/groupId` 中提取业务 ID，不再把 SDK `groupID` 当业务 `roomId` 兜底。
- 会话 store：
  - 选中群时无显式业务 `roomId` 则跳过 `/room/openim/detail`。
  - 查询当前成员时无显式业务 `roomId` 则跳过 `/room/openim/members`，保留 SDK 成员信息。
- 群成员 Hook：
  - 有显式业务 `roomId` 时优先 businessApi。
  - 无显式业务 `roomId` 或 businessApi 失败时走 SDK 成员列表。
- 聊天资源：
  - 群共享文件无显式业务 `roomId` 时直接空态，不误用 SDK `groupID` 请求。
- 群设置：
  - 无显式业务 `roomId` 时不渲染业务群管理入口。
  - 免打扰、置顶、清空消息、群资料更新、退群、解散等 SDK 能力保持可用；businessApi 同步仅在有显式业务 `roomId` 时执行。

## 真实 Chrome 复测

- 本地页面：`http://127.0.0.1:7777/index.html#/chat/sg_3413653759`
- Chrome：真实 Google Chrome，CDP `9225`
- 复测账号：沿用当前登录态 `10000003`

结果：

- 选中群后不再发起 `/room/openim/detail`、`/room/openim/members` 错误请求。
- 打开聊天资源面板：收藏接口 200，无跨域、无参数错误。
- 切到“群共享文件”：无显式业务 `roomId`，不发起错误业务请求，显示空态。
- 打开群设置：成员列表 SDK 正常显示 3 人，无 businessApi 参数错误。

## 后续

- 若后端提供 OpenIM `groupID` 到旧系统 `roomId` 的映射接口，可再接入自动映射。
- 当前策略是 KISS：无明确旧系统 `roomId` 时不调用依赖旧 ID 的业务桥接接口，避免错误请求污染 UI。
