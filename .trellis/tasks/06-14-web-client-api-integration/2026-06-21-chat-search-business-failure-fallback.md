# 2026-06-21 聊天搜索业务失败兜底

## 背景

- 聊天记录搜索已接入业务接口：
  - 单聊：`/friend/openim/messages/search`
  - 群聊：`/room/openim/messages/search`
- 现有实现已经在业务搜索无结果或失败时尝试 OpenIM SDK 本地历史消息兜底。
- 但当业务搜索失败且本地搜索没有结果时，原逻辑仍会触发 `feedbackToast({ error })`，这会把 `roomId=OpenIM groupID` 兼容期的后端参数校验失败暴露给用户。

## 本轮调整

- `src/pages/chat/queryChat/ChatHeader/ChatMessageSearch.tsx`
  - 业务搜索失败后继续尝试本地历史消息搜索。
  - 如果本地搜索成功但无结果，页面展示空态，不再弹业务错误。
  - 如果业务搜索失败且本地搜索也失败，仅在 debug 中记录两类错误，保持空态。
  - 仅当没有业务错误且本地搜索自身失败时，仍保留用户级错误提示。
  - 将业务搜索失败日志从 `console.warn` 调整为 `console.debug`。
- 搜索结果的收藏、合并预览、保存合并等用户主动操作仍保留确认框和 `feedbackToast({ error })`。

## 真实浏览器复核

- 当前真实浏览器页面：`http://127.0.0.1:7777/index.html#/chat`。
- 页面正常渲染，显示“创建群聊”空状态。
- Playwright console error 复查：0 errors。
- 当前会话列表为空，未触发真实搜索请求；完整搜索验收仍需可打开的单聊或群聊会话。

## 结论

聊天记录搜索继续优先走业务接口，失败时用 OpenIM SDK 本地历史兜底；在后端搜索索引或群 `roomId` 契约未稳定前，前端以空态兜底，不再把只读搜索失败作为用户级错误弹出。
