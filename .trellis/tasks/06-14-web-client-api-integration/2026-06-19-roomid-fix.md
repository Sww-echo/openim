# 2026-06-19 群资源 roomId 修正

- 已修复 `ChatBusinessResources` 群资源业务接口参数来源。
- `/room/openim/shares`、群文件资源和群容量概览不再只使用 OpenIM `conversation.groupID`。
- 新逻辑优先读取 `currentGroupInfo.roomId/roomID/groupID/groupId/jid/roomJid/id`，仅缺失业务 ID 时兜底使用 `conversation.groupID`。
- 修复范围只影响聊天资源弹窗内的 businessApi `roomId` 参数，不改 OpenIM SDK 会话 ID、消息收发或会话路由逻辑。
- 真实 Chrome 完整复测尚未完成：已通过 Chrome 扩展通道进入真实 Chrome，并使用测试账号登录到 `#/chat`；后续 Chrome 扩展/CDP 自动化在打开群资源弹窗阶段多次超时，未稳定拿到 `/room/openim/shares` 的最终响应记录。
- 本轮未运行单元测试或测试脚本，未新增/修改测试文件；后续仍按用户要求仅用浏览器复测功能。
