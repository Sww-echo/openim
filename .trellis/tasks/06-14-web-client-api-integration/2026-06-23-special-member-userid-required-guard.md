# 2026-06-23 特殊成员设置 userId 必填防护

## 背景

Swagger 中 `/room/openim/member/set-special-role` 的必填参数为：

- `roomId`：旧系统群 ID
- `userId`：目标成员用户 ID
- `role`：`3` 普通成员、`4` 隐身人、`5` 监控人

当前前端封装 `setOpenIMSpecialRole` 已强制要求 `roomId/userId/role`，但特殊成员列表此前在业务数据缺少目标 `userId` 时仍会展示可点击的角色设置按钮。点击后会在执行函数内静默返回。

## 修改

- `src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx`
  - `renderSpecialMembers` 渲染每条特殊成员时先读取 `userId/userID/targetUserId/id`。
  - 缺少目标 `userId` 时禁用普通成员、隐身人、监控人三个角色设置按钮。
  - 保留 `setSpecialRole` 内部的 `userId` 守卫，避免异常数据绕过 UI 层直接进入接口调用。

## 结论

该调整让特殊成员设置入口与接口必填参数保持一致，避免在缺少目标成员 ID 的数据上暴露不可执行的 mutation 操作。真实角色设置仍属于远端 mutation，本轮未触发。

本轮未运行单元测试、构建、覆盖检查或验证脚本，未触发特殊成员设置、审核、群设置保存、发送、上传、下载、删除等真实 mutation。

