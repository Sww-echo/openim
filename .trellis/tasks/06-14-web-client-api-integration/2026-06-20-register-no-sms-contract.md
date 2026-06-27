# 2026-06-20 注册接口无需短信验证码契约对齐

## 背景

- 最新本地 Swagger `docs/openim-swagger.json` 中 `/account/register` 摘要为：账号注册，兼容前端 JSON 请求，注册无需短信验证码。
- 当前注册页仍保留“发送短信验证码 -> 校验验证码 -> 设置资料注册”的三步流程，和最新注册接口契约不一致。
- 本次仍只接入 Web 用户端，不接后台、移动端、支付、运营等范围。

## 本次调整

- `src/pages/login/RegisterForm.tsx`
  - 移除注册页短信验证码发送、验证码输入、验证码校验和倒计时流程。
  - 注册页收敛为直接表单：手机号、固定企业号、昵称、密码、确认密码。
  - 提交注册时直接调用 `/account/register`。
  - 企业号继续固定为 `LOCALTEST001`，页面展示为禁用输入框。
  - 保留手机号、昵称、密码、确认密码校验。
- `src/api/typings.d.ts`
  - `API.Login.DemoRegisterType.verifyCode` 从必填改为可选，匹配“注册无需短信验证码”的接口定义。

## 请求约定

- 注册接口仍通过 `businessApi` proxy：`/business-api/account/register`。
- 请求封装仍会统一补齐：
  - `enterpriseCode: "LOCALTEST001"`
  - `invitationCode: "LOCALTEST001"`
  - `platform`
  - `user.areaCode` 标准化为带 `+` 格式。
- 登录后 token 规则不变：
  - 业务 token 取登录/注册响应中的 `access_token` 等兼容字段。
  - OpenIM SDK token 取 `openIM.token`。

## 验证计划

- 不运行单元测试、构建或验证脚本。
- 使用真实浏览器只读复测：
  - 登录页可打开注册入口。
  - 注册页不再展示验证码步骤、验证码输入框、重新获取验证码入口。
  - 不提交注册，避免触发真实远端 mutation。
