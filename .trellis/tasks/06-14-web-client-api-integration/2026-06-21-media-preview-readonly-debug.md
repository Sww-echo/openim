# 2026-06-21 图片视频预览只读兜底日志降级

## 变更

- `src/pages/chat/queryChat/MessageItem/MediaMessageRender.tsx`
  - 图片消息渲染时优先读取业务文件签名预览 URL。
  - 业务预览读取失败后继续回退 OpenIM SDK 图片 URL。
  - 失败日志由 `console.warn` 降为 `console.debug`。
- `src/pages/chat/queryChat/MessageItem/VideoMessageRender.tsx`
  - 视频消息渲染时优先读取业务文件签名预览 URL。
  - 业务预览读取失败后继续回退 OpenIM SDK 视频 URL。
  - 失败日志由 `console.warn` 降为 `console.debug`。

## 范围边界

- 文件下载按钮、消息右键下载、收藏、撤回、删除等用户主动操作仍保留确认或错误提示。
- 撤回后的业务文件引用失效属于写操作后的非阻塞清理，本轮不改。
- 本轮只处理消息渲染阶段的只读预览增强失败，不改变上传、下载、发送或删除链路。

## 浏览器复测

- 使用真实浏览器读取当前页面 `http://127.0.0.1:7777/index.html#/contact/myGroups`。
- 页面正常渲染通讯录“我的群组”，展示 2 个真实群。
- 当前页面没有图片/视频消息节点，因此未触发真实 `/file/sign` 或 `/file/preview` 预览读取。
- 控制台 2 条错误均为已知 OpenIM WS 握手失败：
  - `ws://47.238.134.161:10001` handshake closed。
  - `connectFailedHandler 10000 failed to WebSocket dial ... use of closed network connection`。
- 上述错误不是本轮 `/business-api` 文件预览只读兜底问题。

## 结论

- 图片/视频消息的业务预览增强失败现在不会污染浏览器 warning；页面仍会回退 SDK 原始媒体地址。
- 本轮未运行单元测试、构建或验证脚本，未触发上传、下载、发送、删除、收藏、撤回或其他真实 mutation。

