# 2026-06-26 `/room/add` 表单契约修正

## 背景

前端已把创建群聊主链路调整为优先调用业务 `/room/add`。本轮通过本地 proxy 做真实接口验证时发现：

- 按 Swagger 必填参数用 query 传 `room/text/keys/access_token`，接口返回 `1030101`，提示“缺少访问令牌”。
- GET、POST query、不同 token 参数名都返回同样错误。
- 使用 `application/x-www-form-urlencoded` 表单体传 `access_token/room/text/keys`，接口返回 `resultCode=1`。

## 变更

- `src/api/group.ts`
  - `createBusinessGroup()` 改为异步函数。
  - 从本地存储读取当前业务 `chatToken`。
  - 使用 `URLSearchParams` 作为请求体提交 `access_token`、`room`、`text`、`keys`。
  - 设置 `Content-Type: application/x-www-form-urlencoded`。

## 验证

- 通过本地 proxy 登录测试账号 `18888888888`，登录返回 `resultCode=1`。
- 表单方式调用 `/business-api/room/add` 创建测试群，返回 `resultCode=1`。
- 成功响应顶层包含 `currentTime/data/resultCode`。
- `data` 内包含 `jid`，当前 `pickCreatedBusinessGroupID()` 会识别 `jid` 作为群会话跳转 ID。
- 本轮未运行单元测试。

## 测试数据

- 本轮真实创建了测试群，群名格式为 `codex-api-verify-*`。
- 最近一次成功验证群名：`codex-api-verify-form-20260626203051`。
