# 2026-06-20 群全体禁音字段接入

## 背景

继续复核 `/room/update` 时，确认源码类型层已保留 `limitSendSmg` 字段，且现有 i18n 已有“全体禁音 / Mute All”文案，但群设置页尚未提供对应入口。

该字段属于 Web 群聊天权限设置范围，用于限制普通成员发言；实际消息发送仍由 `/room/openim/send-before` 和 OpenIM SDK 发送链路承担。

## 本次处理

- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - `BusinessSwitchField` 纳入 `limitSendSmg`。
  - 群权限设置区新增“全体禁音”开关。
  - 保存复用已有 `/room/update`、二次确认和本地群信息更新链路。

## 验证状态

本轮仅做源码和 Swagger 静态复核，未运行单元测试、构建或验证脚本，未登录真实账号，未保存群设置或触发其他真实 mutation。
