# 2026-06-20 群聊天记录保存时长接入

## 背景

单聊设置已接入 `/friends/update` 的 `chatRecordTimeOut`。继续复核 `/room/update` 时，确认群设置同样提供 `chatRecordTimeOut` 字段，描述为“聊天记录时间”，但当前群设置页尚未提供对应入口。

该字段属于 Web 群聊天设置范围，和已接入的群消息销毁、撤回时限不同：本次入口只配置聊天记录保存时长，不改变消息销毁开关。

## 本次处理

- `src/api/group.ts`
  - `RoomSettingsParams.chatRecordTimeOut` 从 `number` 放宽为 `string | number`，和单聊已使用的 Swagger 字符串值保持一致。
- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - 群权限设置区新增“聊天记录保存时长”下拉。
  - 选项复用单聊口径：关闭、1 天、7 天、30 天、90 天、365 天。
  - 保存复用已有 `/room/update`、二次确认和本地群信息更新链路。
- `src/i18n/resources/zh.json`、`src/i18n/resources/en.json`
  - 补齐对应中英文文案。

## 验证状态

本轮仅做源码和 Swagger 静态复核，未运行单元测试、构建或验证脚本，未登录真实账号，未保存群设置或触发其他真实 mutation。
