# Web 登录功能按最新接口文档重新对齐

## 需求范围

- 企业号验证
- 个人账号登录
- Web 端多账号保存
- 多账号一键切换
- 不同账号数据隔离
- IP 限制登录提示
- 宵禁登录限制提示

## 最新文档接口

后续只以 `docs/openim-frontend-api-doc.json` 为准。

- `GET|POST /enterprise/code/validate`：企业号校验
- `POST /account/login`：个人账号登录，需处理 `data.allowed=false`、`reason=user_login_ip_not_allowed`、`clientIp`、`allowedIps`
- `POST /account/register`：注册能力，仅在登录链路需要跳转或注册入口时核对
- `POST /account/code/send`：验证码发送
- `POST /account/code/verify`：验证码校验
- `GET /user/openim/token`：刷新或获取当前登录用户 OpenIM token，需处理宵禁返回 `data.allowed=false`
- `GET /config/openim/status`：环境联调状态检查，可作为真实接口验证前置

## 旧接口处理

以下接口不在最新文档中，不能再作为新对接目标：

- `/user/outtime`：用 `/account/login` 和 `/user/openim/token` 的宵禁/限制响应承接。
- `/user/logout`：最新文档无用户端业务退出接口；退出主链路由 OpenIM SDK logout + 本地状态清理承担，若后端补文档再接。
- `/user/password/reset`、`/user/password/update` 及 `/v1` 变体：最新文档无明确等价接口，先记录为文档缺口，不作为本登录功能主线验收条件。
- `/user/verify/password`：最新文档无明确等价接口，保留为缺口或移出主流程。

## 实施拆分

1. 静态核对 `src/api/login.ts`、`src/utils/request.ts`、`src/utils/storage.ts`、`src/store/user.ts`，列出所有登录相关接口是否在最新文档中。
2. 将登录、企业号校验、OpenIM token 刷新参数和响应解析对齐最新文档。
3. 检查登录失败提示：IP 限制、宵禁限制、普通账号密码错误必须展示后端可读原因。
4. 检查多账号保存和切换：业务 token、OpenIM token、userID、当前账号 key、内存 store 必须隔离。
5. 使用真实接口和浏览器流程验证登录、切换账号、退出登录后状态清理。

## 完成统计要求

完成本任务时必须新增 Trellis 记录，至少包含：

- 需求项总数、已完成数、未完成数
- 最新文档内已接接口列表
- 替换掉的旧接口列表
- 最新文档缺口列表
- 真实接口调用或浏览器验证结果
- 剩余风险和后续动作
