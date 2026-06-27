# 2026-06-19 文件类消息上传发送确认保护

## 背景

继续审计聊天文件类发送链路时，发现图片、视频、普通文件在用户选择文件后会立即进入：

- `/file/upload/context`
- `/file/upload`
- 图片压缩 `/file/compress` 或异步压缩兜底
- 视频转码 `/file/convert` 或异步转码兜底
- OpenIM SDK 创建文件类消息
- `/friend/openim/send-before` 或 `/room/openim/send-before`
- OpenIM SDK `sendMessage`
- 群文件场景下登记 `/room/openim/share/add`

这条链路同时包含上传和发送两个真实远端动作，应该与文本发送、资料保存、头像上传保持一致：先展示确认框，用户点击 `OK` 后才上传并发送。

## 处理

- `src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx`
  - 将原 `fileHandle` 的实际上传发送逻辑拆为 `runFileHandle`。
  - 新 `fileHandle` 只负责展示确认框。
  - 只有确认框 `OK` 后才调用 `runFileHandle`。
  - 取消或关闭确认框时不会调用 `getImageMessage`、`getVideoMessage`、`getFileMessage`，因此不会触发 `/file/upload/context`、`/file/upload`、压缩/转码、发送前校验、SDK `sendMessage` 或群共享文件登记。
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmUploadAndSendFile`: `Upload and send this file?`
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmUploadAndSendFile`: `确认上传并发送当前文件吗？`

## 真实 Chrome 复测

- 使用真实 Chrome 插件打开新受控标签页。
- 登录账号 `18888888888 / czp0422+`。
- 打开单聊：`http://127.0.0.1:7777/index.html#/chat/si_10000003_10000006`。
- 页面正常渲染 `Image`、`Video`、`File` 三个文件类入口。
- 页面存在 3 个 `input[type="file"]`，对应图片、视频、普通文件上传入口。
- 当前 Browser 插件 Playwright 受限接口不支持 `setInputFiles`；为避免打开系统文件选择器或误选真实文件，本轮未选择本地文件，未触发上传。

## 说明

本轮没有运行单元测试、构建或验证脚本，也没有新增或修改测试文件。浏览器复测只验证聊天页和文件类入口渲染，不选择文件、不上传、不发送。

源码核对已确认业务上传函数位于确认框 `onOk` 后。后续如需完整点击验收，需要在真实浏览器中选择一个明确允许用于测试的本地文件；即便选择文件，也只先验证确认框，真正点击 `OK` 上传发送仍需用户单独确认。
