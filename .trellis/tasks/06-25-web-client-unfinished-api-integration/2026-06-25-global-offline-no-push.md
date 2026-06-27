# 2026-06-25 全局免打扰接口接入

## 接口

- `/user/update/OfflineNoPushMsg`

## 接入位置

- `src/api/userSettings.ts`
  - `UserPrivacySettings` 增加 `offlineNoPushMsg`。
  - `getUserPrivacySettings()` 读取 `/user/settings` 返回的 `offlineNoPushMsg`。
  - 新增 `updateGlobalOfflineNoPushMsg()`，按 Swagger 调用 `/user/update/OfflineNoPushMsg`。

- `src/layout/LeftNavBar/PersonalSettings.tsx`
  - 在账号设置的“消息提示”区块新增“全局消息提示”总开关。
  - 开启消息提示时传 `offlineNoPushMsg=0`。
  - 关闭消息提示时传 `offlineNoPushMsg=1`。
  - 该总开关不替代现有细分通知设置；`room_notice/at_me/robot_reply` 仍走 `/user/notification/settings/update`。

- `src/i18n/resources/zh.json`
- `src/i18n/resources/en.json`
  - 新增 `placeholder.globalMessageAlert`。

## 状态

已接入，待浏览器确认真实响应结构。

本轮未运行单元测试，未新增或修改单元测试。真实浏览器复测仍等待自动化登录调用测试接口权限确认。

## 原则说明

- KISS：复用现有账号设置“消息提示”区块，不新增页面。
- YAGNI：只接全局免打扰，不扩展没有页面入口的其它推送厂商 token 接口。
- DRY：复用 `getUserPrivacySettings()` 读取当前设置。
- SOLID：设置 API 仍集中在 `src/api/userSettings.ts`，UI 只负责展示和触发保存。
