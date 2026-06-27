# 2026-06-24 群成员管理 targetUserId 必填防护

## 背景

群成员管理相关接口都依赖明确的目标成员 ID：

- `/room/openim/member/remark/update` 必须有 `roomId/targetUserId`
- `/room/openim/member/remark/delete` 必须有 `roomId/targetUserId`
- `/room/openim/member/mute` 必须有 `roomId/targetUserId/durationSeconds`
- `/room/openim/member/unmute` 必须有 `roomId/targetUserId`
- `/room/set/admin` 虽然 Swagger 将 `touserId/type` 标为可选，但该接口语义为设置或取消管理员，实际操作必须有目标用户和目标角色

此前按钮显示条件主要基于当前用户角色，若业务成员记录缺少 `userID`，仍可能显示备注、禁言或管理员设置入口。

## 修改

- `src/pages/chat/queryChat/GroupSetting/GroupMemberList.tsx`
  - 备注更新/清空、禁言、解禁、设/取消管理员的执行函数增加 `member.userID` 守卫。
  - `canEditRemark`、`canManageMember`、`canManageAdministrator` 增加 `Boolean(member.userID)` 条件。
  - 缺少目标成员 ID 时不展示对应操作按钮，也不会进入远端接口调用。

## 结论

该调整让群成员管理入口与接口必填目标成员 ID 保持一致，避免业务成员数据字段不完整时暴露不可执行或参数不完整的 mutation 操作。

本轮未运行单元测试、构建、覆盖检查或验证脚本，未触发备注保存、禁言、解禁、设管理员、取消管理员或其他真实 mutation。

