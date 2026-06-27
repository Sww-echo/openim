# 2026-06-20 注册企业号校验与文案收敛

## 调整

- 注册页提交前复用登录页 `validateEnterpriseCodeInput`，先请求 `/enterprise/code/validate` 校验固定企业号 `LOCALTEST001`。
- 企业号校验失败时阻断 `/account/register`，避免注册链路绕过企业号验证。
- 企业号输入提示从“请输入企业号或邀请码”收敛为“请输入企业号”。
- 企业号校验失败提示从历史“邀请码不存在”收敛为“企业号无效”。

## 契约说明

- 登录、注册、验证码请求继续固定传 `enterpriseCode: "LOCALTEST001"`。
- 不默认传 `invitationCode`，保留类型字段只用于兼容历史调用。
- 本地 Swagger 的 `/account/code/send`、`/account/code/verify` 仍把 `invitationCode` 标为 required，与用户确认的联调口径不一致；当前实现以 `invitationCode` 非必填为准。
- `/enterprise/code/validate` 已在请求层公开路径中，未登录校验不会被追加业务 `access_token`。

## 验证

- `zh.json`、`en.json` 通过 PowerShell `ConvertFrom-Json` 解析。
- `rg` 确认登录/注册页企业号校验失败使用 `errCode.enterpriseCodeInvalid`。
- `Invoke-WebRequest http://127.0.0.1:7777/index.html#/login` 返回 `HTTP 200 OK`。
- 本轮未运行单元测试、构建或验证脚本；未触发真实登录、注册、验证码发送或其他 mutation。
- Codex 内置浏览器通道仍被 `codex/sandbox-state-meta: missing field sandboxPolicy` 阻断；Playwright CLI 当前 PATH 不可用，未做交互式浏览器复测。
