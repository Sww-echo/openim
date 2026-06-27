# 2026-06-20 群共享文件登记必填 URL 保护

## 背景

继续按未完成项复核文件上传、群共享和资源接口时，对照本地 `docs/openim-swagger.json` 确认 `/room/openim/share/add` 参数定义：

- `roomId` 必填。
- `type` 必填。
- `size` 必填。
- `url` 必填。
- `name` 必填。
- `fileId` 可选。

当前群文件/视频发送成功后会异步调用 `/room/openim/share/add` 登记群共享文件。此前逻辑在存在业务 `fileId` 但未解析到文件 URL 时仍可能继续请求，导致 `url` 为空字符串，和 Swagger 必填约束不一致。

## 本次处理

- `src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx`
  - 收紧 `syncGroupShareFile` 的前置条件：未解析到可用文件 URL 时直接跳过 `/room/openim/share/add`。
  - 保留已有 `roomId`、文件类型、大小、文件名和可选 `fileId` 传参逻辑。

## 接口影响

- `/room/openim/share/add`：避免发送后异步登记时打出缺少必填 `url` 的业务请求。
- 群消息实际发送仍由 OpenIM SDK 完成；群共享登记是发送成功后的非阻塞同步，失败或跳过不会阻断消息发送。

## 验证状态

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。文件上传和消息发送属于真实 mutation，本轮未在浏览器中选择文件、上传或发送；后续如需完整验证，需要用户明确确认后再触发真实文件发送链路。
