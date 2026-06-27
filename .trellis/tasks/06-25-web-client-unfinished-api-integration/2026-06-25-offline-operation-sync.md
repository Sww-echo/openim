# 2026-06-25 `/user/offlineOperation` 接入

## 背景

Swagger 中 `/user/offlineOperation` 的说明是“获取最新的好友群组相关操作记录”。该接口没有独立页面字段，更适合放在 Web 端登录或 SDK 同步完成后的补偿刷新链路。

## 实现

- 新增 `src/api/offlineOperation.ts`：
  - `getOfflineOperations()` 调用 `/user/offlineOperation`。
  - `syncOfflineOperations()` 按当前账号保存上次查询时间，并在下次调用时作为 `offlineTime` 传入。
  - `syncOfflineOperations()` 做模块级并发去重，避免初始化和 SDK 同步完成同时触发重复请求。
- 在 `useGlobalEvents` 的 SDK 同步完成回调里调用 `syncOfflineOperations()`。
- 在 `initStore()` 初始化链路里也调用一次 `syncOfflineOperations()`。
- 若业务接口返回操作记录，则刷新：
  - 好友列表。
  - 群列表。
  - 收到/发出的好友申请。
  - 收到/发出的群申请。
- 接口失败只写 `console.debug`，不阻断 OpenIM SDK 原有同步和页面初始化。

## 验证

- 本轮只做静态核对。
- 未新增或修改单元测试。
- 未运行单元测试。
- 浏览器复测仍待本地 dev server 可用后执行，观察登录或同步完成后是否发起 `/business-api/user/offlineOperation`。
