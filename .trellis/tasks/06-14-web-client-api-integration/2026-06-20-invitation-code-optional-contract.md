# 2026-06-20 invitationCode 非必填收敛

## 背景

- 用户此前明确要求 `invitationCode` 非必填，并要求企业号固定为 `enterpriseCode: "LOCALTEST001"`。
- 复核当前实现时发现登录、注册、验证码参数仍把固定企业号同时写入 `invitationCode`。
- 本地 `docs/openim-swagger.json` 中 `/account/code/send`、`/account/code/verify` 仍把 `invitationCode` 标记为 query required；该处与用户联调口径不一致，本次实现以用户确认的 `invitationCode` 非必填和固定 `enterpriseCode` 为准。

## 调整

- 登录、注册、验证码参数归一化改为固定传 `enterpriseCode: "LOCALTEST001"`。
- 不再默认传 `invitationCode: "LOCALTEST001"`。
- 登录/注册表单字段从 `invitationCode` 收敛为 `enterpriseCode`，页面仍展示固定企业号入口。
- 登录/注册文案从“企业号/邀请码”改为“企业号”，避免继续暗示邀请码必填。
- 企业号输入提示和校验失败提示同步收敛为企业号语义，避免固定企业号校验失败时仍展示“邀请码不存在”。
- 登录页和注册页提交前均先调用 `/enterprise/code/validate` 校验固定企业号；校验失败时阻断后续 `/account/login` 或 `/account/register`。
- 接口契约脚本中的过期描述从固定 `invitationCode` 更新为固定 `enterpriseCode`；本轮未运行该脚本。

## 边界

- Swagger 中 `invitationCode` 作为可选参数的文档兼容性保留，类型字段也保留兼容历史调用。
- 本轮未运行单元测试、构建或验证脚本。
- 未触发真实登录、注册、验证码发送或其他远端 mutation；企业号校验只在用户实际提交表单时触发。
- 本机 Chrome/Playwright 只读打开 `http://127.0.0.1:7777/index.html#/login`：页面正常渲染，显示“企业号”，不再显示“企业号/邀请码”，无 Vite overlay，控制台 0 error。
