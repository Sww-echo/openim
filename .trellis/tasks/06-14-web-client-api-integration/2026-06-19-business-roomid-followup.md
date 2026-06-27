# 2026-06-19 business roomId 收敛补充

- 新增 `pickBusinessRoomId` 公共工具，统一从业务响应中解析旧系统群 ID。
- 解析优先级：`roomId/roomID/jid/roomJid` 优先；`groupID/groupId` 仅在不同于 fallback 时作为业务 ID；最后才使用 `id` 或 fallback。
- 已接入以下 Web 端 businessApi 调用路径：
  - 群聊天资源：群共享文件、群文件资源、群容量概览。
  - 群设置：群资料更新、权限/消息销毁设置、免打扰、置顶、清空消息、退群、解散群。
  - 群管理入口：公告、入群审核、在线成员、特殊成员、群助手、群二维码。
  - 群成员列表：业务成员查询用 business roomId，OpenIM SDK 兜底仍用 SDK groupID。
  - 群卡片：成员查询和申请入群优先使用 business roomId。
  - 聊天搜索与发送前校验：群聊 businessApi 查询/校验优先使用 business roomId。
- SDK 操作仍使用 OpenIM `groupID`：发送消息、设置 SDK 群资料、SDK 退群/解散、SDK 会话置顶/免打扰、SDK 成员兜底查询等未改为 business roomId。
- 本轮只做静态代码核对，未运行单元测试、未运行验证脚本，未新增/修改测试文件。
