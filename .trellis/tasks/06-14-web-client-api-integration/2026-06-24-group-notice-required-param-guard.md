# 群公告必填参数防护

时间：2026-06-24

## 背景

对照 `docs/openim-swagger.json` 复核群公告相关接口：

- `/room/openim/notices`：`roomId` 必填，`pageIndex/pageSize` 可选。
- `/room/openim/notice/update`：`roomId/noticeId/noticeContent` 必填。
- `/room/openim/notice/delete`：`roomId/noticeId` 必填。

当前 `GroupBusinessEntrances` 已有 `noticeId` 和公告内容的基础守卫，但列表读取、保存和删除仍直接使用原始 `roomId`。当群上下文缺失或路由参数异常时，仍可能携带空 `roomId` 发起请求。

## 变更

- `src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx`
  - 新增 `normalizedRoomId = roomId.trim()` 和 `canUseRoomBusiness = Boolean(normalizedRoomId)`。
  - 群公告、入群审核、在线成员、特殊成员等列表加载统一使用 trim 后的 `roomId`。
  - 缺 `roomId` 时列表面板直接空态，不调用群业务列表接口。
  - 公告编辑、保存、删除增加 `canUseRoomBusiness` 执行层守卫。
  - 公告保存按钮在缺 `roomId` 或内容为空时禁用；编辑/删除按钮在缺 `roomId` 或 `noticeId` 时禁用。
  - 特殊成员角色设置同步使用 trim 后的 `roomId`，并在缺 `roomId` 时禁用按钮。
  - 传给群助手和群二维码子面板的 `roomId` 改为 trim 后的值。

## 结论

- 群公告读取、更新和删除入口现在与 Swagger 的必填参数契约对齐。
- 同文件内其他群业务只读/写入口也减少了空 `roomId` 透传风险。
- 本轮未点击公告保存、删除、特殊成员设置或其他真实 mutation。
- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
