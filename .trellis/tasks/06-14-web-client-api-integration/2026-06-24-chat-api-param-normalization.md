# 2026-06-24 聊天 API 参数归一化

## 范围

本轮只处理 `src/api/chat.ts` 封装层的参数归一化和空值短路，不触发真实发送、撤回、收藏、合并、转发或删除等 mutation。

## 已处理

- 通用参数处理：
  - 新增字符串/数字 ID trim。
  - 新增 `seq` 数字归一化。
  - `auditIds/tags` CSV 参数统一 trim、过滤空值。

- 发送前校验：
  - `/friend/openim/send-before` 缺 `toUserId` 时短路。
  - `/room/openim/send-before` 缺 `roomId` 时短路。
  - `messageType` 传参前 trim。

- 聊天记录搜索：
  - `/friend/openim/messages/search` 缺 `peerUserId` 或 `keyword` 时短路。
  - `/room/openim/messages/search` 缺 `roomId` 或 `keyword` 时短路。
  - `senderUserId` 传参前 trim。

- 群消息撤回增强：
  - `/room/openim/message/recall` 统一 trim `roomId/clientMsgID/serverMsgID`。
  - `clientMsgID/serverMsgID/seq` 至少一个有效时才发请求。

- 合并消息：
  - `/message/merge/preview`
  - `/message/merge/save`
  - `/message/merge/forward-before`
  - `/message/merge/detail`
  - `/message/merge/delete`

  上述接口统一 trim `auditIds/targetType/targetId/mergeId`；缺必填 ID 时短路。转发前置要求同时具备 `auditIds/targetType/targetId`。

- 收藏消息：
  - `/message/favorites/add`
  - `/message/favorites/update`
  - `/message/favorites/merge`
  - `/message/favorites/delete`
  - `/message/favorites/detail`

  上述接口统一 trim `auditId/favoriteId/roomId/clientMsgID/serverMsgID/tags`；新增收藏要求 `auditId/clientMsgID/serverMsgID/seq` 至少一个有效，更新/删除/详情要求 `favoriteId` 有效，合并收藏要求 `auditIds` 有效。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实 mutation。
- 当前仅完成源码层参数契约防护与文档记录。

## 后续仍需

- 真实收藏、合并、撤回、转发等 mutation 后续仍需用户明确确认后逐项验证。
- 群消息撤回和已读详情仍受后端 `roomId=OpenIM groupID` 契约兼容状态影响。
