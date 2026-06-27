# 2026-06-19 文本消息发送确认保护

## 背景

继续审计聊天发送链路时，发现文本输入区点击 `Send` 或按 Enter 后会直接创建 OpenIM 文本消息，并进入发送前业务校验与 SDK `sendMessage` 流程：

- 单聊：`/friend/openim/send-before` -> OpenIM SDK `sendMessage`
- 群聊：`/room/openim/send-before` -> OpenIM SDK `sendMessage`

发送消息属于真实远端动作。按当前联调约束，浏览器复测不能误触发真实发送；页面入口也应与下载、资料保存、备注保存等入口一致，先展示确认框，用户确认后才发送。

## 处理

- `src/pages/chat/queryChat/ChatFooter/index.tsx`
  - 新增 `sendTextMessage`，封装原有创建文本消息、调用 `sendMessage`、清理草稿逻辑。
  - `enterToSend` 不再直接创建消息和发送。
  - 点击 `Send` 或按 Enter 后先展示确认框。
  - 只有确认框 `OK` 后才调用 `sendTextMessage`。
  - 取消或关闭确认框时不调用发送前校验，不调用 OpenIM SDK `sendMessage`，草稿文本保留。
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmSendMessage`: `Send this message?`
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmSendMessage`: `确认发送这条消息吗？`

## 真实 Chrome 复测

- 使用真实 Chrome 插件打开新受控标签页：`http://127.0.0.1:7777/index.html#/chat/si_10000003_10000006`。
- 页面保持登录态，进入单聊 `橙子皮1`。
- 在输入框中输入 `send-confirm-check`。
- 点击 `Send` 后弹出确认框：
  - 标题：`Send`
  - 内容：`Send this message?`
  - 按钮：`Cancel`、`OK`
- 未点击 `OK`；取消/关闭确认框后，输入框仍保留 `send-confirm-check`。
- 页面未出现新发送消息，未清空草稿。

## 说明

本轮没有运行单元测试、构建或验证脚本，也没有新增或修改测试文件。浏览器复测只打开发送确认框并取消，没有提交 `/friend/openim/send-before`，没有调用 OpenIM SDK `sendMessage` 发送该文本消息。

文件、图片、视频发送仍包含上传与发送两段动作，后续需继续单独收敛到“确认后再上传/发送”，避免选中文件后立即上传。

更新：2026-06-20 已在 `2026-06-20-file-send-confirm-cancel.md` 中完成文件/图片/视频发送确认链路复核和取消状态收口；当前选择文件后只有确认框 `OK` 才会上传并发送。
