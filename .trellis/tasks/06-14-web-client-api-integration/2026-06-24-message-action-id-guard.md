# 2026-06-24 消息操作与转发目标 ID 防护

## 范围

本轮只处理 Web 端消息操作入口的接口参数契约对齐，不触发真实发送、撤回、收藏、转发、删除、下载等 mutation。

## 已处理

- `src/pages/chat/queryChat/MessageItem/index.tsx`
  - 新增消息 ID 归一化：`clientMsgID/serverMsgID/groupID/roomId` 统一 trim。
  - 新增消息定位字段判断：`clientMsgID/serverMsgID/seq` 至少一个有效时才调用收藏、撤回增强、已读详情相关 businessApi。
  - 本地删除和 SDK 撤回前校验 `conversationID/clientMsgID`，避免向 SDK 传空白消息 ID。
  - 群已读详情缺 `roomId` 或消息定位字段时直接展示空态，不发无效 `/room/openim/message/read-detail` 请求。

- `src/pages/chat/queryChat/ChatHeader/ChatMessageSearch.tsx`
  - 单聊搜索前 trim `peerUserId`，缺目标 ID 时跳过 businessApi 搜索并保留 SDK 本地搜索兜底。
  - 群聊搜索前 trim `roomId/groupID`，避免向 `/room/openim/messages/search` 传空白目标。

- `src/pages/common/ChooseModal/index.tsx`
  - 合并消息转发前统一 trim 选择目标的 `groupID/userID`。
  - `/message/merge/forward-before` 和 `IMSDK.sendMessage` 使用同一份归一化目标 ID。
  - 缺转发目标或源消息时阻断无效请求。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实 mutation。
- 当前仅完成源码层参数契约防护与文档记录。

## 后续仍需

- 等后端 `roomId=OpenIM groupID` 契约兼容或提供稳定业务 `roomId` 映射后，再做群消息撤回、已读详情、群搜索的真实浏览器复测。
- mutation 验证必须按用户确认逐项进行，避免误触发远端状态变更。
