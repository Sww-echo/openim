# 2026-06-20 消息转发 auditId 契约收敛

## 背景

- Swagger `/message/merge/forward-before` 的必填参数是 `auditIds`，描述为“多个消息审计ID，用英文逗号分隔”。
- 当前转发入口此前会在消息没有业务审计 ID 时，用 `serverMsgID/clientMsgID` 兜底调用 `/message/merge/forward-before`。
- `serverMsgID/clientMsgID` 不是 Swagger 定义的审计 ID；对本地 SDK 消息或业务审计未落库消息强行调用该接口，容易触发后端参数/数据校验失败，并阻断原本可以由 SDK 完成的普通转发。

## 本轮调整

- `src/pages/common/ChooseModal/index.tsx`
  - `FORWARD_MESSAGE` 场景只在 `pickBusinessAuditId(sourceMessage)` 能拿到业务审计 ID 时调用 `/message/merge/forward-before`。
  - 如果消息没有业务审计 ID，则跳过业务转发前置接口，直接使用 OpenIM SDK `createForwardMessage` + `sendMessage`。

## 接入结论

- 有业务审计 ID 的消息：继续按 Swagger 走 `/message/merge/forward-before`，后端可返回 OpenIM SDK payload 时优先使用。
- 无业务审计 ID 的 SDK 本地消息：不伪造 `auditIds`，回退 SDK 转发，避免误把 `clientMsgID/serverMsgID` 当审计 ID。

## 验证方式

- 本轮只做 Swagger 参数契约和源码静态复核。
- 未运行单元测试、构建或验证脚本。
- 未在浏览器中确认转发真实消息；消息转发会触发真实发送，后续如需完整复测必须由用户再次确认。
