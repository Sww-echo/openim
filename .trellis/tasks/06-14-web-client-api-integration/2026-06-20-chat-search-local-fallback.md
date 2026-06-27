# 2026-06-20 聊天记录搜索本地只读兜底

## 背景

Trellis 里记录过一个待确认差异：真实浏览器中单聊历史消息可见，但 `/friend/openim/messages/search` 按同一关键词返回空态。该现象说明业务审计搜索数据源与 OpenIM SDK 本地历史消息可能存在延迟或覆盖差异。

当前 Web 需求包含“聊天记录搜索”。业务接口仍应作为主链路，但在业务搜索返回空时，页面可以用 SDK 本地历史做只读兜底展示，避免用户明明在当前会话看到消息却搜索不到。

## 本轮调整

- `src/pages/chat/queryChat/ChatHeader/ChatMessageSearch.tsx`
  - 单聊仍优先调用 `/friend/openim/messages/search`。
  - 群聊在有业务 `roomId` 时仍优先调用 `/room/openim/messages/search`。
  - 当业务搜索结果为空时，调用 OpenIM SDK `getAdvancedHistoryMessageList` 读取当前会话最近 100 条历史消息并按关键词本地过滤。
  - 当业务搜索接口报错时，也会继续尝试 SDK 本地历史只读兜底；只有本地兜底也没有结果时才提示业务搜索错误。
  - 无业务 `roomId` 的群聊不再直接空态，允许走 SDK 本地历史兜底。
  - 本地兜底记录标记为 `__localSearchResult`，不提供业务 `auditId`。

## 写操作边界

- 本地兜底结果没有 `auditId`，因此不会显示“合并预览”“保存合并消息”“收藏”“合并收藏”等依赖业务审计 ID 的写操作按钮。
- 只有业务搜索结果带有 `auditId/messageAuditId/msgAuditId/id` 时，才保留收藏/合并相关入口。
- 本轮未改变消息发送、转发、删除、收藏或合并写接口。

## 验证状态

- 本轮只做源码级核对，并读取 OpenIM SDK 类型定义确认 `textElem/atTextElem/quoteElem/fileElem/videoElem/pictureElem` 字段存在。
- 未运行单元测试、构建或验证脚本。
- 未触发真实搜索页面复测、发送消息、收藏、合并、删除或其他 mutation。
- 尝试连接真实 Chrome 做只读复测时，当前 Codex 桌面控制通道仍返回 `Computer Use native pipe path is unavailable`，因此本轮未完成浏览器复测。

## 2026-06-20 追加字段覆盖

- `getLocalMessageText` 已继续扩展本地只读兜底的关键词来源：
  - 文本类：`textElem.content`、`advancedTextElem.text`、`atTextElem.text`、`quoteElem.text`。
  - 引用类：首层 `atTextElem.quoteMessage`、`quoteElem.quoteMessage` 的可搜索文本。
  - 附件类：文件名/文件 URL、视频 URL/封面 URL、图片原图/大图/缩略图 URL、语音 URL。
  - 结构类：名片昵称和 userID、合并消息标题和摘要、位置描述、自定义消息描述/data/extension、通知 detail、typing 提示、原始 `content`。
- 本地兜底结果仍只标记 `__localSearchResult`，不生成或推断 `auditId`，因此不会暴露收藏、合并、保存等写入口。
- 本次仅做源码补齐和 Trellis 记录更新；未运行单元测试、构建或验证脚本，未触发真实 mutation。
