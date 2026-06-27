# 2026-06-25 旧群助手与自动回复兼容接入

## 接口

- `/room/addGroupHelper`
- `/room/deleteGroupHelper`
- `/room/queryGroupHelper`
- `/room/addAutoResponse`
- `/room/updateAutoResponse`
- `/room/deleteAutoResponse`

## 接入位置

- `src/api/group.ts`
  - 新增 `addLegacyGroupHelper()`、`deleteLegacyGroupHelper()`、`queryLegacyGroupHelper()`。
  - 新增 `addLegacyGroupAutoResponse()`、`updateLegacyGroupAutoResponse()`、`deleteLegacyGroupAutoResponse()`。
  - 旧接口字段按 Swagger 使用 `roomId/roomJid/helperId/groupHelperId/keyWordId/keyword/value`。

- `src/pages/chat/queryChat/GroupSetting/GroupHelperPanel.tsx`
  - 添加群助手时，同时调用 `/room/openim/group-helpers/add` 与 `/room/addGroupHelper`。
  - 删除群助手时，同时调用 `/room/openim/group-helpers/delete` 与 `/room/deleteGroupHelper`。
  - 新增自动回复关键词时，同时调用 `/room/openim/group-helpers/keywords/add` 与 `/room/addAutoResponse`。
  - 更新自动回复关键词时，同时调用 `/room/openim/group-helpers/keywords/update` 与 `/room/updateAutoResponse`。
  - 删除自动回复关键词时，同时调用 `/room/openim/group-helpers/keywords/delete` 与 `/room/deleteAutoResponse`。
  - 并联写操作复用 `settleAtLeastOneBusinessRequest()`，至少一个接口成功即可刷新页面数据。

## 状态

已完成源码接入，待浏览器确认真实响应结构和后端 `roomId/roomJid/helperId` 契约。

本轮未新增、未修改、未运行单元测试。浏览器复测仍受本地 Node/npm 执行提权审批器拒绝和 `7777` 端口未启动影响。
