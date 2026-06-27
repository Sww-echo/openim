# 2026-06-20 重置密码 API 层防御性校验

## 背景

- 忘记密码页面已在表单层校验手机号、验证码、密码，并在验证码校验响应缺少 `serial` 时阻断。
- `useReset` API 封装中仍保留硬编码英文错误 `"Missing password reset serial"`，且只检查 `serial/phoneNumber`，如果其他调用方绕过页面层直接调用，仍可能向 `/user/password/reset` 发送缺少 `randcode/newPassword` 的请求。

## 调整

- `useReset` 在 API 层补充防御性参数校验：
  - 缺手机号：`toast.inputPhoneNumber`
  - 缺验证码：`toast.inputVerifyCode`
  - 缺新密码：`toast.inputPassword`
  - 缺 `serial`：`toast.missingPasswordResetSerial`
- 移除硬编码英文错误，统一使用 i18n 文案。

## 验证

- 本轮只做源码静态复核和登录页 HTTP 只读复核。
- 未运行单元测试、构建或验证脚本。
- 未触发真实验证码发送、验证码校验、重置密码或其他 mutation。
