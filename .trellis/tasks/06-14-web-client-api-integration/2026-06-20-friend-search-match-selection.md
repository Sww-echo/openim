# 2026-06-20 添加好友搜索匹配项选择修正

## 背景

继续复核添加好友链路时，发现顶部 `+ -> 添加好友` 的用户搜索在拿到业务接口返回列表后，只检查第一条 `users[0]` 是否和输入关键词匹配。

当前查询链路是：

- 本地好友兜底
- `/user/getByAccount?account=keyword`
- `/user/public/search/list?keyWorld=keyword&page=0&limit=10`
- `/friends/page?keyword=...&pageIndex=0&pageSize=1`

其中 `/user/public/search/list` 可能返回多条用户记录。如果目标手机号、通讯号或 userID 不在第一条，旧逻辑会误判为“未搜索到相关结果”。

## 本轮调整

- `src/layout/TopSearchBar/SearchUserOrGroup.tsx`
  - 新增 `isKeywordMatchedUser`。
  - 用户搜索结果不再固定取 `users[0]`。
  - 改为在返回列表中查找 `userID/phoneNumber/telephone/account` 与当前关键词一致的记录。
  - 找不到精确匹配时仍保持原有空态逻辑，不把模糊结果误当成目标用户。
- `src/api/friend.ts`
  - `/user/public/search/list` 返回公开用户列表后，只有存在精确匹配用户才结束查询链路。
  - 如果公开搜索只有模糊结果或非目标用户，则继续执行 `/friends/page` 兜底查询。
  - `/friends/page` 兜底查询从 `pageSize: 1` 调整为 Swagger 默认的 `pageSize: 10`，并优先返回精确匹配用户，避免精确目标不在第一页第一条时被漏掉。

## 边界

- 不改变业务接口请求参数。
- 不触发 `/friends/add`。
- 不改变加群搜索逻辑。
- 该修正避免“列表中有匹配项但第一条不是目标”的前端误判，也避免公开搜索返回非目标用户时提前截断 `/friends/page` 兜底；如果后端三个查询入口在前 10 条候选内都不返回目标用户，仍需要后端确认手机号/通讯号搜索口径。

## 验证状态

- 本轮只做源码级核对。
- 未运行单元测试、构建或验证脚本。
- 未触发真实加好友、加群、发送消息或其他 mutation。
- 尝试连接真实 Chrome 做只读复测时，当前 Codex 桌面控制通道仍返回 `Computer Use native pipe path is unavailable`，因此本轮未完成浏览器复测。
