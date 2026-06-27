# 2026-06-19 显式业务 roomId 二次收敛

## 背景

上一轮真实 Chrome 复测确认 `/room/openim/detail`、`/room/openim/members` 不能使用 OpenIM SDK `groupID` 作为 `roomId`。继续静态扫描后发现仍有几条群相关链路使用 `pickBusinessRoomId` 兜底 SDK `groupID`，后续可能在群搜索、发送前校验、消息右键、群文件上传、群卡片入群申请等场景触发同类参数错误。

## 处理

- 群消息发送前校验：
  - 有显式旧系统 `roomId` 时调用 `/room/openim/send-before`。
  - 无显式旧系统 `roomId` 时跳过业务前置校验，消息发送仍走 OpenIM SDK。
- 群聊记录搜索：
  - 有显式旧系统 `roomId` 时调用 `/room/openim/messages/search`。
  - 无显式旧系统 `roomId` 时显示空态，不请求 businessApi。
- 消息右键：
  - 收藏消息只在有业务 `roomId` 时附带该字段，否则不传。
  - 群消息撤回有业务 `roomId` 时先调 `/room/openim/message/recall`，无业务 `roomId` 时仅走 SDK revoke。
  - 已读详情无业务 `roomId` 时显示空态，不请求 `/room/openim/message/read-detail`。
- 文件发送：
  - 群文件/视频只有在有旧系统 `roomId` 时使用 `room_share` 上传场景并登记 `/room/openim/share/add`。
  - 无旧系统 `roomId` 时按普通文件场景上传，消息仍由 SDK 发送。
- 群卡片：
  - 成员读取继续使用 businessApi 优先、SDK 兜底。
  - 入群申请只有在有业务 `roomId` 时调用 `/room/join`，避免把 SDK 群 ID 当旧系统群 ID 提交。

## 真实 Chrome 复测

- 页面：`http://127.0.0.1:7777/index.html#/chat/sg_3413653759`
- 操作：
  - 进入群会话。
  - 打开聊天记录搜索并输入 `qq`。
  - 打开聊天资源并切到“群共享文件”。
  - 打开群设置抽屉。
- 结果：
  - 未出现 `/business-api/room/openim/**` 参数错误请求。
  - `failedBusiness=[]`。
  - 无“请求参数验证失败”、CORS、roomId 相关业务错误。
  - 群设置仍能显示 SDK 群成员 3 人。

## 说明

本轮没有运行单元测试或验证脚本，没有修改测试文件。浏览器操作均为只读打开/搜索/切换面板，未触发发送消息、上传文件、下载、收藏、撤回、入群申请、清空消息等 mutation 或下载动作。
