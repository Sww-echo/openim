# 群二维码必填参数防护

时间：2026-06-24

## 背景

对照 `docs/openim-swagger.json` 复核群二维码相关接口：

- `/room/openim/qr/create`：`roomId` 必填，`expireHours` 可选。
- `/room/openim/qr/resolve`：`code` 必填。
- `/room/openim/qr/join`：`code` 必填，`applyReason` 可选。

当前 `GroupQRCodePanel` 已通过 `parseCodeInput(inputCode)` 控制解析按钮，并通过 `resolvedCode` 控制扫码入群按钮；缺口在于生成二维码入口未根据 `roomId` 做 UI 层禁用，执行函数也没有显式守卫。

## 变更

- `src/pages/chat/queryChat/GroupSetting/GroupQRCodePanel.tsx`
  - 新增 `normalizedRoomId = roomId.trim()`。
  - 新增 `canCreate = Boolean(normalizedRoomId)`。
  - `generateQRCode` 在缺 `roomId` 时直接返回，不调用 `/room/openim/qr/create`。
  - 生成按钮增加 `disabled={!canCreate}`。
  - 请求参数使用 `normalizedRoomId`，避免空白字符串透传。

## 结论

- 群二维码生成入口现在与 Swagger 的 `roomId` 必填契约对齐。
- 群二维码解析和扫码入群仍沿用现有 `code` 必填防护。
- 本轮未点击生成二维码、未解析二维码、未扫码入群，未触发任何真实 mutation。
- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
