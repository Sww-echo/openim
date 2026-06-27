# 2026-06-21 已读详情只读失败兜底

## 背景

- 已读详情是群消息右键菜单中的只读能力，对应业务接口：
  - `POST /room/openim/message/read-detail`
- 当前后端仍存在 `roomId=OpenIM groupID` 契约兼容风险；如果接口返回参数校验失败，原实现会被右键菜单通用 catch 捕获并触发 `feedbackToast({ error })`。
- 该入口属于只读查询，不应在后端兼容前用业务校验失败打断页面体验。

## 本轮调整

- `src/pages/chat/queryChat/MessageItem/index.tsx`
  - 仅包住 `showReadDetail` 中的 `getOpenIMMessageReadDetail` 调用。
  - 请求成功时继续展示已读/未读列表或接口原始响应。
  - 请求失败时记录 `console.debug("Failed to load message read detail", error)`，并展示“已读详情”空态。
  - 撤回、删除、收藏、下载等用户主动操作仍走原有确认框和 `feedbackToast({ error })`。

## 真实浏览器复核

- 当前真实浏览器位于 `http://127.0.0.1:7777/index.html#/chat`。
- 页面正常渲染，显示“创建群聊”空状态。
- Playwright console error 复查：0 errors。
- 当前账号没有可通过 UI 打开的群消息节点，本轮仍不能点击“已读详情”完成接口请求验收。

## 结论

已读详情保留业务接口接入和入口，失败时按只读空态兜底；完整浏览器验收仍需要真实群消息节点，且只点击“已读详情”查询，不触发发送、撤回、删除等 mutation。
