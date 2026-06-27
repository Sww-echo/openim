# 2026-06-20 群消息撤回时限字段接入

## 背景

继续复核 `/room/update` 时，确认 Swagger 提供 `withdrawTime` 字段，描述为“消息撤回的删除时间，单位秒”。当前 Web 已接入群消息撤回 `/room/openim/message/recall`，但群设置页尚未提供该时限配置入口。

该字段属于 Web 端聊天/群权限设置范围，不涉及后台治理、支付或旧系统迁移。

## 本次处理

- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - 在群权限设置区新增“群消息撤回时限”数值项。
  - 单位按 Swagger 使用秒，范围限制为 `1` 到 `604800`。
  - 保存复用已有 `/room/update`、二次确认和本地 `currentGroupInfo` 更新链路。
- `src/i18n/resources/zh.json`、`src/i18n/resources/en.json`
  - 补齐对应中英文文案。

## 验证状态

本轮仅做源码和 Swagger 静态复核，未运行单元测试、构建或验证脚本，未登录真实账号，未保存群设置或触发其他真实 mutation。
