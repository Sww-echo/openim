# 2026-06-21 单聊聊天记录搜索只读复测

## 背景

补做聊天记录搜索链路的真实 Chrome 只读验收，确认当前实现仍按 Web 用户端需求优先调用业务搜索接口，并在页面展示业务返回结果。

本轮只做读取和页面观察，不触发收藏、合并保存、转发、发送、上传、下载、删除、审核、群设置保存或其他真实 mutation。

## 复测过程

- 使用 Playwright CLI 连接真实 Google Chrome 的 `default` 会话。
- 当前页面：`http://127.0.0.1:7777/index.html#/chat/si_10000003_10000021`。
- 当前会话：单聊 `www`。
- 打开“聊天记录搜索”弹窗，搜索关键词：`你是谁`。

## 结果

- 页面展示 1 条命中结果：
  - 标题：`橙子皮`
  - 内容：`你是谁`
- 网络请求确认：
  - `POST /business-api/friend/openim/messages/search?pageIndex=0&pageSize=50&peerUserId=10000021&keyword=...&access_token=...` 返回 200。
- 控制台复查：
  - `console error` 数量为 0。
- 截图：
  - `output/playwright/chrome-chat-search-readonly-verify.png`

## 结论

单聊聊天记录搜索业务主链路可用：请求走 `/business-api` 代理，参数包含 0 起始 `pageIndex`、`pageSize`、`peerUserId` 和 `keyword`，页面可展示业务接口返回的审计搜索结果。

本轮未运行单元测试、构建或验证脚本；未新增或修改测试文件；未触发任何真实 mutation。
