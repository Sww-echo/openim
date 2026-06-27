# 2026-06-20 登录提交 payload 不原地修改

## 调整

- `LoginForm` 不再直接修改 `onFinish` 收到的 `params.password`。
- 提交 `/account/login` 时在 payload 中单独写入 `password: md5(params.password ?? "")`。

## 原因

- 避免表单值对象被原地改写后，在异常重试、企业号校验失败后再次提交等场景出现重复 MD5 或状态污染风险。
- 保持登录表单输入态和接口提交态分离。

## 验证

- 本轮只做源码静态复核。
- 未运行单元测试、构建或验证脚本。
- 未触发真实登录或其他 mutation。
