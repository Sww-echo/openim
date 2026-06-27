# 2026-06-24 账号与 RTC API 参数归一化

## 范围

本轮只处理 `src/api/login.ts` 和 `src/api/imApi.ts` 封装层的参数归一化、缺参短路和响应 token 防护，不触发真实登录、注册、验证码发送、验证码校验、密码修改、密码重置、企业号校验或 RTC 连接请求。

## 已处理

- 账号参数归一化：
  - 新增 `normalizeAuthText`，统一 trim 手机号、区号、验证码、企业号、昵称、账号等文本字段。
  - 新增 `normalizeOptionalAuthText`，可选字段为空时不传。
  - 新增 `normalizePasswordText`，密码字段只做字符串化，不 trim，不改变用户密码语义。
  - `areaCode` 统一补 `+`，空值返回 `undefined`。

- 验证码接口：
  - `/account/code/send` 统一固定 `enterpriseCode=LOCALTEST001`，trim `areaCode/phoneNumber/telephone`。
  - 发送验证码缺手机号时短路，不发请求。
  - `/account/code/verify` 统一固定 `enterpriseCode=LOCALTEST001`，trim `areaCode/phoneNumber/telephone/verifyCode`。
  - 校验验证码缺手机号或验证码时短路，不发请求。
  - `email/invitationCode` 继续不默认传递，保持当前 Swagger 手机号验证码口径。

- 登录和注册：
  - `/account/login` 请求前 trim `phoneNumber/account/areaCode`，固定 `enterpriseCode=LOCALTEST001`，保留 `platform`。
  - 登录缺手机号或密码时短路，不发请求。
  - `/account/register` 请求前 trim `nickname/faceURL/email/account/areaCode/phoneNumber`，固定 `enterpriseCode=LOCALTEST001`。
  - 注册缺手机号、昵称或密码时短路，不发请求。
  - 注册密码不 trim，只传入页面层已生成的密码值。
  - 注册不再透传历史 `verifyCode/invitationCode` 字段。

- 密码接口：
  - `/user/password/reset` 请求前 trim `telephone/randcode/serial`，缺手机号、验证码、新密码或 `serial` 时短路。
  - `/user/password/update` 请求前检查旧密码和新密码，缺任一项时短路。

- 企业号和 token 响应：
  - `/enterprise/code/validate` 请求前 trim `code`，缺企业号时短路。
  - `normalizeIMProfile` 对 `access_token/openIM.token/userID` 做 trim，空白 token 或空白 userID 不再视为有效。
  - `normalizeOpenIMTokenProfile` 对刷新得到的 OpenIM token 和 userID 做 trim。

- RTC：
  - `/user/rtc/get_token` 请求前 trim `room/identity`。
  - 缺 `room` 或 `identity` 时直接 reject，避免继续进入 RTC 连接。
  - 缺参错误复用已有 `toast.connectFailed` 文案，不新增 i18n key。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器触发真实登录、注册、验证码、密码或 RTC 请求。
- 当前只完成源码层参数契约防护与文档记录。

## 后续仍需

- 登录、注册、验证码和密码相关真实链路如果要重新验收，需要用户明确指定账号和允许触发对应远端请求。
- RTC 真实连接仍依赖真实音视频邀请场景和可用 RTC 后端。
