# 2026-06-20 发送结果与群共享登记保护

## 背景

继续按 Web 用户端接口接入任务复扫时，发现附件发送链路中 `/room/openim/share/add` 和 `/file/reference/invalidate` 依赖 `sendMessage` 返回值判断后续业务动作。

原实现中，OpenIM SDK `sendMessage` 抛错但消息已经先插入本地列表时，`useSendMessage` 会返回 `true`。这会让调用方误判为发送已成功：

- 群文件/视频可能继续调用 `/room/openim/share/add`，把未成功发送的附件登记到群共享文件。
- 业务文件引用不会调用 `/file/reference/invalidate` 标记失效。

## 本次处理

- `src/pages/chat/queryChat/ChatFooter/useSendMessage.ts`
  - 收紧 `sendMessage` 返回语义：只有 `IMSDK.sendMessage` 成功后返回 `true`。
  - 发送前校验失败或 SDK 发送失败均返回 `false`。
  - 本地已经插入的消息仍会被标记为 `MessageStatus.Failed`，不改变当前失败态展示。

## 接口影响

- `/friend/openim/send-before`、`/room/openim/send-before`：失败时继续阻断 SDK 发送。
- `/room/openim/share/add`：只在 SDK 发送成功后才会登记群共享文件。
- `/file/reference/invalidate`：附件发送未成功时可进入引用失效兜底，避免业务文件长期保持有效引用。

## 验证状态

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。由于附件上传/发送属于真实 mutation，未在浏览器中触发上传或发送；后续如需完整验证，需要用户明确确认后使用真实文件走上传发送失败/成功链路。
