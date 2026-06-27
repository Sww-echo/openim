# 2026-06-25 群成员邀请人信息兼容接入

## 接口

- `/room/getMemberInviterInfo`

## 接入位置

- `src/api/group.ts`
  - 新增 `getLegacyGroupMemberInviterInfo()`，按 Swagger 传 `jid/userId`。

- `src/pages/common/UserCardModal/index.tsx`
  - 用户资料卡在有群上下文时读取 `/room/getMemberInviterInfo`。
  - 成功解析邀请人昵称或 ID 后，展示“邀请人”字段。
  - 读取失败只写 `console.debug`，不阻断用户资料卡展示。

- `src/i18n/resources/zh.json`
- `src/i18n/resources/en.json`
  - 新增 `placeholder.groupInviter` 文案。

## 状态

已完成源码接入，待浏览器确认真实响应结构。

本轮未新增、未修改、未运行单元测试。该接口是群成员资料卡只读增强，不改变 OpenIM SDK 群成员主链路。
