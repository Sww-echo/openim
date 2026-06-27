# 2026-06-20 群权限 joinMethod/searchable 字段补齐

## 背景

继续按最新 `docs/openim-swagger.json` 复核 `/room/update` 时，发现当前群权限设置已覆盖 `showRead/isNeedVerify/showMember/allow*`、消息销毁和阅后即焚等核心字段，但仍缺少两个明显属于 Web 群权限设置的字段：

- `joinMethod`：加群方式，`0` 自由加入、`1` 审核加入、`2` 禁止加入。
- `searchable`：群是否可被搜索，`1` 是、`0` 否。

另补齐类型字段 `messageDestroyContentTypes`，用于和 Swagger 契约保持一致；当前 Web 没有按消息类型配置销毁范围的产品入口，本轮不新增 UI。

## 本次处理

- `src/api/group.ts`
  - `RoomSettingsParams` 补齐 `joinMethod`、`searchable`、`messageDestroyContentTypes`。
- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - 群权限区新增“加群方式”下拉，保存时走既有 `/room/update` 和二次确认。
  - 群权限区新增“允许被搜索”开关，保存时走既有 `/room/update` 和二次确认。
  - `joinMethod` 缺失时按既有 `isNeedVerify` 推导默认展示：需要验证显示“审核加入”，否则显示“自由加入”。
  - 加群方式下拉保存时同步写入 `isNeedVerify`；旧“群聊验证”开关保存时同步写入 `joinMethod`，避免新旧字段状态分叉。
- `src/i18n/resources/zh.json`、`src/i18n/resources/en.json`
  - 补齐对应中英文文案。

## 验证状态

本轮仅做源码和 Swagger 静态复核，未运行单元测试、构建或验证脚本，未登录真实账号，未保存群设置或触发其他真实 mutation。
