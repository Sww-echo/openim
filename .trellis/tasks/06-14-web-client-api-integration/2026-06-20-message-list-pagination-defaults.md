# 2026-06-20 消息收藏/合并列表分页默认值

## 背景

继续按最新 `docs/openim-swagger.json` 核对源码业务接口时，发现消息收藏列表和已保存合并消息列表均是分页接口：

- `/message/favorites`：可传 `pageIndex/pageSize`。
- `/message/merge/saved`：可传 `pageIndex/pageSize`。

当前资源面板调用处已经显式传 `pageIndex: 0` 和 `pageSize`，但 API 封装 `getFavoriteMessages`、`getSavedMergeMessages` 允许裸调用时不带分页参数。为保持 Web 端分页统一从 0 起始，并降低后续新调用点漏传分页的风险，在 API 封装层补默认值。

## 本轮调整

- `src/api/chat.ts`
  - `getFavoriteMessages` 默认追加 `pageIndex: 0`、`pageSize: 20`。
  - `getSavedMergeMessages` 默认追加 `pageIndex: 0`、`pageSize: 20`。
  - 调用方传入的 `params` 保持可覆盖默认分页值。

## 验证状态

- 本轮仅做源码级契约收敛。
- 未运行单元测试、构建或验证脚本。
- 未触发消息收藏、合并消息列表查询、收藏/合并写操作或其他真实 mutation。
