# 2026-06-24 只读列表参数归一化

## 范围

本轮只处理只读列表接口的分页、状态、关键词等可选参数过滤，不触发真实浏览器请求，也不触发任何 mutation。

## 已处理

- 公告列表：
  - `src/api/announcement.ts` 新增 `normalizeAnnouncementParams`。
  - `/system/announcements` 保留默认 `pageIndex=0/pageSize=20`，额外参数传参前统一 trim 字符串并过滤空值。

- 聊天资源列表：
  - `src/api/chat.ts` 新增 `normalizeChatParams`。
  - `/message/merge/saved` 保留默认 `pageIndex=0/pageSize=20`，额外参数传参前统一过滤空值。
  - `/message/favorites` 保留默认 `pageIndex=0/pageSize=20`，额外参数传参前统一过滤空值。

- 好友只读列表：
  - `src/api/friend.ts` 新增 `normalizeBusinessParams`。
  - `/friends/queryBlacklistWeb` 保留默认 `pageIndex=0/pageSize=20`，额外参数传参前统一过滤空值。
  - `/friends/newFriendListWeb` 保留当前用户 `userId` 和默认分页，额外参数传参前统一过滤空值。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实请求。
- 当前只完成源码层参数契约防护与文档记录。
