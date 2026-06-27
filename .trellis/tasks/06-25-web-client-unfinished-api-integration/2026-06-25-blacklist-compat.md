# 2026-06-25 黑名单兼容接口接入

## 接口

- `/friends/blacklist`

## 接入位置

- `src/api/friend.ts`
  - 新增 `getLegacyBusinessBlacklist()`，按 Swagger 传 `pageIndex/pageSize`。

- `src/store/contact.ts`
  - 刷新黑名单时，保留 OpenIM SDK `getBlackList()` 作为基础来源。
  - 同时读取现有 `/friends/queryBlacklistWeb` 和旧兼容 `/friends/blacklist`。
  - 两个业务来源统一走既有 `toBlackUserItem()` 归一化，并按 `userID` 合并。
  - 任一业务接口失败时不阻断 SDK 黑名单展示。

## 状态

已接入，待浏览器确认真实响应结构。

本轮未运行单元测试，未新增或修改单元测试。浏览器真实复测仍等待自动化登录调用测试接口权限确认。

## 原则说明

- KISS：只作为现有黑名单页面的数据兼容来源，不新增页面。
- YAGNI：不接关注、粉丝、好友分组等当前没有自然入口的模块。
- DRY：复用已有黑名单归一化和合并逻辑。
- SOLID：业务请求仍集中在 `src/api/friend.ts`，状态合并保留在联系人 store。
