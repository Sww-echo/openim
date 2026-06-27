# 2026-06-25 好友申请兼容接口接入

## 接口

- `/friends/newFriend/list`
- `/friends/newFriend/last`

## 接入位置

- `src/api/friend.ts`
  - 新增 `getLegacyNewFriendList()`。
  - 新增 `getLatestNewFriendRecord()`。

- `src/store/contact.ts`
  - 刷新好友申请列表时，同时读取 `/friends/newFriendListWeb` 和 `/friends/newFriend/list`。
  - 两个来源统一走既有 `toFriendApplicationItem()` 归一化，再由既有合并逻辑按申请方向和用户 ID 去重。
  - 任一接口失败时不阻断另一个接口结果，也不阻断 SDK 申请列表兜底。

- `src/pages/common/UserCardModal/SendRequest.tsx`
  - 打开发送好友验证页时读取 `/friends/newFriend/last`。
  - 若能解析申请状态，则显示“最近申请状态”。
  - 读取失败只写 `console.debug`，不阻断发送好友申请。

- `src/i18n/resources/zh.json`
- `src/i18n/resources/en.json`
  - 新增 `application.latestStatus`。

## 状态

已接入，待浏览器确认真实响应结构。

本轮仍不运行单元测试，也不新增单元测试。自动化浏览器登录和真实接口复测需要输入测试账号密码，当前审批器拒绝该类命令，待用户明确确认后再继续。
