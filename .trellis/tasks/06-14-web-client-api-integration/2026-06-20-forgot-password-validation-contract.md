# 2026-06-20 忘记密码验证码参数前置校验

## 背景

- Swagger `/account/code/send`、`/account/code/verify` 均要求手机号相关参数；当前阶段仅支持手机号验证码。
- 忘记密码页的“发送验证码”按钮此前直接读取表单值调用 `/account/code/send`，手机号为空时可能向业务接口发送缺少 `phoneNumber/telephone` 的请求。
- 验证码输入外层 `Form.Item` 包住 `Space.Compact`，存在表单绑定落到容器而不是实际 `Input` 的风险。

## 调整

- “发送验证码”点击前先执行 `form.validateFields(["areaCode", "phoneNumber"])`；校验失败时只展示前端字段错误，不触发远端验证码接口。
- 手机号字段新增必填规则。
- 验证码字段改为内层 `Form.Item noStyle` 绑定实际 `Input`，并新增必填规则。
- 发送验证码按钮在倒计时或请求中禁用/显示 loading，避免重复触发。
- 缺少 reset `serial` 时的可见提示改为 i18n 文案，不再展示英文技术字符串。

## 验证

- 本轮只做源码和文案 JSON 静态复核。
- 未运行单元测试、构建或验证脚本。
- 未点击发送验证码、下一步、重置密码，也未触发任何远端 mutation。
