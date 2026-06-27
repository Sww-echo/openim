# 2026-06-24 公告与通知设置参数防护

## 范围

本轮只处理系统公告与通知设置 API 封装层的参数归一化和空值短路，不触发真实标已读、全部标已读或通知设置更新等 mutation。

## 已处理

- `src/api/announcement.ts`
  - `/system/announcements/detail` 调用前 trim `announcementId`。
  - `/system/announcements/read` 调用前 trim `announcementId`。
  - 缺 `announcementId` 时直接短路返回空对象，不发无效请求。

- `src/api/notification.ts`
  - 通知设置读取结果中的 `type/scope/roomId/typeMetas/supportedTypes` 统一 trim。
  - `/user/notification/settings` 读取时仅在 `roomId` 有效时传参，避免显式传空值。
  - `/user/notification/settings/update` 更新前过滤缺 `type` 的无效项。
  - 更新项中的 `type/scope/roomId` 统一 trim，`allowNotification` 复用布尔解析逻辑。
  - 无有效更新项时直接短路返回空对象，不发无效请求。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实 mutation。
- 当前仅完成源码层参数契约防护与文档记录。

## 后续仍需

- 系统公告标已读、全部标已读、通知设置更新属于写操作，后续必须经用户确认后再逐项浏览器复测。
