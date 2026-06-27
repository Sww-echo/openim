# 2026-06-24 业务 roomId 提取归一化

## 范围

本轮只处理业务响应字段中的 `roomId` 提取归一化，目标是减少“后端已返回业务 roomId，但前端未识别”的场景。不触发任何真实接口请求，不接入 `/room/openim/mapping`、`/room/openim/status`、`/room/openim/batch-status` 等桥接运维接口。

## 已处理

- `src/utils/businessPayload.ts`
  - 新增 roomId 专用字段集合，覆盖 `roomId/roomID/roomid/room_id/businessRoomId/businessRoomID/oldRoomId/oldRoomID/jid/roomJid/roomJID/room_jid`。
  - 新增 groupId 专用字段集合，覆盖 `groupID/groupId/groupid/group_id`。
  - `pickBusinessRoomId` 和 `pickExplicitBusinessRoomId` 对 ID 字段和 fallback 统一 `trim`，空白字符串不再被当作有效 ID。
  - `pickExplicitBusinessRoomId` 递归读取 `businessRoom/roomMapping/mapping/openIMMapping/openimMapping` 等嵌套对象，兼容后端把业务 roomId 放在映射对象里的响应形态。
  - `pickBusinessId` 对字符串 ID 做 `trim`，空白 ID 返回 `undefined`，避免 `auditId/requestId` 等业务 ID 使用空白字符串。

## 边界

- 不修改通用 `pickBusinessText` 行为，避免影响昵称、公告、消息正文、搜索结果摘要等用户可见文本。
- 不主动调用桥接运维接口。Trellis 既有结论仍保持：`/room/openim/mapping`、`/room/openim/status`、`/room/openim/batch-status`、`/room/openim/resync*`、`/room/openim/copy-room` 不作为 Web 用户端首期接口接入。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实接口请求。
- 当前只完成源码层业务 ID 归一化与文档记录。

## 后续仍需

- 后端若能在群详情、群成员、群通知、会话扩展或 OpenIM 群资料中返回明确业务 `roomId`，前端现有群公告、成员、入群审核、在线成员、已读详情、群共享文件等入口可优先使用该值。
- 如果后端仍只接受旧系统 roomId 且前端只有 OpenIM groupID，核心阻塞仍需后端兼容 `roomId=OpenIM groupID` 或提供用户端可读的稳定映射字段。
