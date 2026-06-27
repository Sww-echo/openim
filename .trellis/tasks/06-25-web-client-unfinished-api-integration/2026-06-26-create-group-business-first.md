# 2026-06-26 创建群聊接口顺序修正

## 背景

用户指出“创建群聊”调用的接口不对。复核当前实现后确认：页面原逻辑是先调用 OpenIM SDK `IMSDK.createGroup()`，成功后再尝试调用业务 `/room/add` 做后置同步；这和业务接口作为用户端建群入口的预期不一致，也可能导致 SDK 群已创建但业务侧同步失败。

## 接口

- `/room/add`

Swagger 中 `/room/add` 创建群组的必填 query 参数为：

- `room`
- `text`
- `keys`

## 改动

- `src/pages/common/ChooseModal/index.tsx`
  - “创建群聊”多人建群主链路改为优先调用业务 `/room/add`。
  - `room` 传群名称、头像等基础信息，`text` 传选中成员 userId 集合，`keys` 传 `openim-web-create-group`。
  - 后续真实验证确认 `/room/add` 需要 `application/x-www-form-urlencoded` 表单体提交，修正记录见 `2026-06-26-room-add-form-contract.md`。
  - 业务响应成功后，递归解析 `groupID/groupId/openIMGroupID/openIMGroupId/roomJid/jid/roomId/id` 等可能字段。
  - 解析到群 ID 后，刷新群列表并进入新群会话。
  - 业务请求失败时才兜底走原 OpenIM SDK `createGroup()`。
  - 业务请求成功但响应无法解析群 ID 时，不再额外调用 SDK，避免业务群和 SDK 群重复创建；只刷新群列表并写 `console.debug`。

## 验证

- 已执行 `npm run build`。
- 构建通过，无 TypeScript 或打包错误。
- 仍存在项目既有 Vite/antd/chunk size 警告。

## 原则说明

- KISS：只调整创建群聊主链路，不重构 ChooseModal 其它群操作。
- YAGNI：不新增复杂补偿/回滚机制，避免在无法确认后端状态时制造重复群。
- DRY：复用已有 `createBusinessGroup()` 封装和群列表 `ensureGroupListLoaded(true)` 刷新。
- SOLID：业务建群仍由 API 层封装，页面只负责组织用户选择结果和导航。
