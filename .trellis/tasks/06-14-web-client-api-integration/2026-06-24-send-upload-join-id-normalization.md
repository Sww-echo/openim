# 2026-06-24 发送、上传、加群入口 ID 归一化

## 背景

继续按 Web 端接口接入任务扫描剩余业务入口时，发现以下链路仍依赖会话或群资料中的 ID 直接透传：

- `/friend/openim/send-before`
- `/room/openim/send-before`
- `/file/upload/context`
- `/room/join`

这些链路都属于真实发送、上传或加群动作的前置/配套接口。当前不触发真实远端操作，只做源码层参数归一化和空值防护。

## 变更

- `src/pages/chat/queryChat/ChatFooter/useSendMessage.ts`
  - 新增 `normalizeTargetId`。
  - 发送前统一 trim `recvID/groupID`。
  - 单聊发送前校验使用归一化后的 `toUserId`。
  - 群聊发送前校验使用归一化后的 `roomId`。
  - OpenIM SDK `sendMessage` 也使用归一化后的 `recvID/groupID`。

- `src/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage.ts`
  - 新增 `normalizeBusinessId`。
  - 文件上传上下文统一 trim 当前 `groupID` 和业务 `roomId`。
  - 只有群会话且能得到有效 `roomId` 时才使用 `room_share` 场景。

- `src/pages/common/GroupCardModal/index.tsx`
  - 新增 `normalizeGroupCardId`。
  - 群资料卡统一 trim `groupID` 和业务 `roomId`。
  - 已入群跳转会话使用归一化后的 `groupID`。
  - 加群申请 `/room/join` 使用归一化后的 `roomId`。

## 约束

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未发送消息、未选择文件、未上传文件、未提交加群申请。
- 本轮未触发 `/friend/openim/send-before`、`/room/openim/send-before`、`/file/upload/context`、`/room/join` 的真实请求。

## 后续验收条件

- 发送链路需要真实浏览器进入单聊/群聊后，由用户确认再触发发送动作。
- 上传链路需要用户确认后选择真实文件/图片/视频。
- 加群申请需要后端明确 `roomId` 契约，并由用户确认后提交真实申请。
