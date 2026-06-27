# 2026-06-19 消息与文件链路 roomId 补充

- 群消息右键业务操作已改为使用 business roomId：
  - 消息收藏 `/message/favorites/add`
  - 群消息撤回 `/room/openim/message/recall`
  - 已读详情 `/room/openim/message/read-detail`
- 文件上传业务上下文已改为使用 business roomId：
  - `/file/upload/context`
  - `/file/upload`
  - 写入 message `ex.openimBusinessFile.roomId`
- 群共享文件登记已改为使用 business roomId：
  - `/room/openim/share/add`
- 静态核对后，聊天目录中明确的 `roomId: currentGroupInfo.groupID`、`roomId: conversation.groupID`、`roomId: message.groupID`、`roomId: options.groupID`、`roomId: sourceID` 直传 businessApi 模式已清理；仅剩 `uploadParams.roomId`，该值已由 `pickBusinessRoomId` 生成。
- 本轮未运行单元测试或验证脚本，未新增/修改测试文件；相关写操作仍需用户单独确认后才能真实触发。
