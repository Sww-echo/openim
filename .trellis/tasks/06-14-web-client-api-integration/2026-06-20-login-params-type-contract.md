# 2026-06-20 登录参数类型契约收敛

## 背景

上一轮已按 Swagger `/account/login` “当前阶段使用手机号和密码登录”收敛登录页，只保留手机号、密码和固定企业号字段。

继续复核类型定义时发现 `API.Login.LoginParams` 仍保留验证码登录形态：

- `verifyCode` 被定义为必填。
- `phoneNumber` 被定义为可选。
- `email` 仍存在于登录参数中。

这会让后续代码误以为 `/account/login` 仍支持验证码或邮箱登录，和当前页面及 Swagger 摘要不一致。

## 本次处理

- `src/api/typings.d.ts`
  - 移除登录参数中的 `email` 和必填 `verifyCode`。
  - 将 `phoneNumber` 改为必填。
  - 保留 `areaCode`、`password`、可选 `account/deviceID/enterpriseCode/invitationCode`。

## 接口影响

- `/account/login` 的类型约束与页面调用收敛到手机号密码登录。
- 注册、找回密码、验证码发送和验证码校验类型未修改。

## 验证状态

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。浏览器验证仅做登录页只读打开，不提交 `/account/login`。
