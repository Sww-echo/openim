# 2026-06-20 用户通知设置接入

## 背景

- 最新 Swagger 提供用户端通知设置接口：
  - `/user/notification/settings`
  - `/user/notification/settings/defaults`
  - `/user/notification/settings/update`
- 现有个人设置中已有“消息提示”文案，但此前没有实际通知设置入口。

## 接入范围

- 本次只接 Web 当前能力相关通知类型：
  - `room_notice`：群公告通知
  - `at_me`：@我通知
  - `robot_reply`：机器人回复通知
- `red_packet` 虽然后端返回为 supported type，但红包能力涉及支付/金额语义，不属于本期 Web 用户端接入范围，因此不展示。

## 实现

- 新增 `src/api/notification.ts`：
  - `getNotificationSettings`
  - `getDefaultNotificationSettings`
  - `updateNotificationSettings`
- 个人设置弹窗新增“消息提示”分组：
  - 打开设置时调用 `/user/notification/settings` 读取全局通知配置。
  - 当设置响应缺少 `supportedTypes/typeMetas` 时，用 `/user/notification/settings/defaults` 做只读兜底。
  - 单项开关更新前弹二次确认，确认后通过 `/user/notification/settings/update` 提交 `items` JSON。
- 覆盖脚本 `expectedWebApiPaths` 补入三个通知设置接口。

## 验证

- `src/api/notification.ts`、`src/layout/LeftNavBar/PersonalSettings.tsx`、中英文 i18n 经本地 Vite 模块请求返回 200。
- 受控 Chrome 使用测试账号登录后打开个人设置：
  - `/business-api/user/notification/settings` 返回 200。
  - 页面展示“群公告通知 / @我通知 / 机器人回复通知”。
  - 页面不展示红包通知。
- 本轮未点击通知开关，未触发 `/user/notification/settings/update`。
- 未运行单元测试、构建或验证脚本。
- 未触发上传、下载、发送、删除、审核、群设置保存等 mutation。
