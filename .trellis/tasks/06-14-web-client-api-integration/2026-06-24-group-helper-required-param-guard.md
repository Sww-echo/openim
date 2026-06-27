# 群助手必填参数防护

时间：2026-06-24

## 背景

对照 `docs/openim-swagger.json` 复核群助手写操作接口：

- `/room/openim/group-helpers/add`：`roomId/helperId` 必填。
- `/room/openim/group-helpers/delete`：`roomId/groupHelperId` 必填。
- `/room/openim/group-helpers/keywords/add`：`roomId/groupHelperId/keyword/value` 必填。
- `/room/openim/group-helpers/keywords/update`：`roomId/groupHelperId/keyWordId/keyword/value` 必填。
- `/room/openim/group-helpers/keywords/delete`：`roomId/groupHelperId/keyWordId` 必填。

当前 `GroupHelperPanel` 已有 `helperId/groupHelperId/keyWordId` 和关键词文本的基础守卫，但 `roomId` 没有统一前置；当群会话上下文缺失或路由参数异常时，读列表和写操作仍可能携带空 `roomId` 发起请求。

## 变更

- `src/pages/chat/queryChat/GroupSetting/GroupHelperPanel.tsx`
  - 新增 `normalizedRoomId = roomId.trim()` 和 `canManage = Boolean(normalizedRoomId)`。
  - `loadData` 缺 `roomId` 时直接清空上下文、已添加助手和可添加助手列表，不调用群助手只读接口。
  - 添加助手、移除助手、添加关键词、编辑关键词、删除关键词、保存关键词均增加 `canManage` 执行层守卫。
  - 所有群助手请求统一传 trim 后的 `roomId`。
  - 添加、移除、添加关键词、编辑关键词、删除关键词、保存按钮在缺 `roomId` 时禁用。

## 结论

- 群助手读写入口现在与 Swagger 的 `roomId` 必填契约对齐。
- 原有 `helperId/groupHelperId/keyWordId/keyword/value` 防护保留。
- 本轮未点击添加、移除、保存或删除，未触发任何真实群助手 mutation。
- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
