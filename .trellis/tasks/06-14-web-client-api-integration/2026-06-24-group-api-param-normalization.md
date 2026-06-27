# 2026-06-24 群管理 API 参数归一化

## 范围

本轮只处理 `src/api/group.ts` 封装层的参数归一化、空值过滤和必填参数短路，不触发真实加群、踢人、转让、解散、设置管理员、公告保存、入群审核、禁言、群设置保存、清空消息、二维码入群等远端 mutation。

## 已处理

- 通用群参数处理：
  - 新增 `emptyGroupResponse`，缺必填参数时直接返回空响应，避免向后端发无效请求。
  - 新增 `normalizeGroupText`、`normalizeGroupNumber`、`normalizeGroupParams`，统一 trim 字符串、过滤空字符串、过滤 `undefined/null/NaN`。
  - 新增 `normalizeRequiredGroupParams`、`normalizeRoomParams`，统一处理 `roomId` 和其它必填 ID。

- 群基础信息和成员：
  - `/room/openim/detail`、`/room/getRoom` 缺 `roomId` 时短路。
  - `/room/join`、`/room/delete`、`/room/update` 缺 `roomId` 时短路。
  - `/room/member/update` 缺 `roomId/text` 时短路。
  - `/room/member/delete` 缺 `roomId/userId` 时短路。
  - `/room/transfer` 缺 `roomId/toUserId` 时短路。
  - `/room/set/admin` 缺 `roomId/touserId/type` 时短路。
  - `/room/openim/members`、`/room/openim/online-members` 缺 `roomId` 时短路。

- 群共享文件：
  - `/room/openim/shares` 缺 `roomId` 时短路。
  - `/room/openim/share/add` 缺 `roomId/type/size/url/name` 时短路。
  - `/room/openim/share/delete` 缺 `roomId/shareId` 时短路。

- 群助手和关键词：
  - `/room/openim/group-helpers/context` 仅做可选参数 trim，不强制 `roomId`，避免破坏上下文读取兼容性。
  - `/room/openim/group-helpers`、`/room/openim/group-helpers/available` 缺 `roomId` 时短路。
  - `/room/openim/group-helpers/add` 缺 `roomId/helperId` 时短路。
  - `/room/openim/group-helpers/delete` 缺 `roomId/groupHelperId` 时短路。
  - `/room/openim/group-helpers/keywords/add` 缺 `roomId/groupHelperId/keyword/value` 时短路。
  - `/room/openim/group-helpers/keywords/update` 缺 `roomId/groupHelperId/keyWordId/keyword/value` 时短路。
  - `/room/openim/group-helpers/keywords/delete` 缺 `roomId/groupHelperId/keyWordId` 时短路。

- 成员扩展能力：
  - `/room/openim/special-members` 缺 `roomId` 时短路。
  - `/room/openim/member/set-special-role` 缺 `roomId/userId/role` 时短路。
  - `/room/openim/member/remark/update`、`/room/openim/member/remark/delete` 缺 `roomId/targetUserId` 时短路。
  - `/room/openim/member/mute` 缺 `roomId/targetUserId/durationSeconds` 时短路。
  - `/room/openim/member/unmute` 缺 `roomId/targetUserId` 时短路。
  - `/room/openim/member/set-offline-no-push` 缺 `roomId/offlineNoPushMsg` 时短路。
  - `/room/openim/member/set-top` 缺 `roomId/top` 时短路。
  - `/room/openim/member/clear-message` 缺 `roomId` 时短路。

- 群公告、入群审核、已读详情：
  - `/room/openim/notices` 缺 `roomId` 时短路。
  - `/room/openim/notice/update` 缺 `roomId/noticeId/noticeContent` 时短路。
  - `/room/openim/notice/delete` 缺 `roomId/noticeId` 时短路。
  - `/room/openim/join-requests` 缺 `roomId` 时短路，并保留默认 `status=-1`。
  - `/room/openim/join-requests/handle` 缺 `requestId/action` 时短路。
  - `/room/openim/message/read-detail` 缺 `roomId` 或缺 `clientMsgID/serverMsgID/seq` 定位字段时短路。

- 群二维码：
  - `/room/openim/qr/create` 缺 `roomId` 时短路，`expireHours` 做数值归一化。
  - `/room/openim/qr/resolve` 缺 `code` 时短路。
  - `/room/openim/qr/join` 缺 `code` 时短路。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实 mutation。
- 当前只完成源码层参数契约防护与文档记录。

## 后续仍需

- 群管理真实可用性仍受后端 `roomId=OpenIM groupID` 契约影响。
- 入群审核、公告保存、管理员设置、禁言、清空消息、二维码入群等 mutation 仍需用户明确确认和可回滚测试数据后再验收。
