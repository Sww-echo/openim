# 2026-06-23 入群审核处理 requestId 必填防护

## 背景

Swagger 中 `/room/openim/join-requests/handle` 的必填参数为：

- `requestId`：申请 ID
- `action`：`approve` 或 `reject`

当前前端封装 `handleOpenIMJoinRequest` 已能把 `agree` 归一化为 `action=approve/reject`，但群设置的入群审核列表此前无论业务数据是否带 `requestId`，都会展示可点击的同意/拒绝按钮。若后端或 OpenIM 兜底数据缺少业务申请 ID，点击后只能在前端静默返回，用户会误以为操作可执行。

## 修改

- `src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx`
  - `renderJoinRequests` 渲染每条申请时先读取 `pickBusinessJoinRequestId(item)`。
  - 缺少业务 `requestId` 时禁用 `同意` 和 `拒绝` 按钮。
  - 保留 `handleJoinRequest` 内部的 `requestId` 守卫，形成调用前和调用内两层防护。

## 结论

该调整让 UI 与接口必填参数保持一致，避免在缺少业务申请 ID 的数据上暴露不可执行的审核操作。真实同意/拒绝仍属于 mutation，未触发，也不能在未明确确认前执行。

本轮未运行单元测试、构建、覆盖检查或验证脚本，未触发任何审核、群设置保存、发送、上传、下载、删除等真实 mutation。

