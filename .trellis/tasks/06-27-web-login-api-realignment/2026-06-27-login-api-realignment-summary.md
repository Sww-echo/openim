# Web 登录功能最新接口对齐完成统计

## 范围

- 接口文档：`docs/openim-frontend-api-doc.json`
- 需求来源：`需求清单.txt` 的 `2.1 登录功能`
- 代码范围：`src/api/login.ts`、`src/utils/request.ts`、`src/utils/storage.ts`、`src/store/user.ts`、`src/layout/useGlobalEvents.tsx`、`src/pages/login/**`、`src/layout/LeftNavBar/index.tsx`

## 需求统计

| 需求项 | 状态 | 证据 |
| --- | --- | --- |
| 企业号验证 | 已完成 | `GET /enterprise/code/validate`，真实接口验证 `LOCALTEST001` 有效 |
| 个人账号登录 | 已完成 | `POST /account/login`，真实接口和 Chrome 登录均通过 |
| Web 端多账号保存 | 已完成 | `setIMProfile` 写入 `IM_WEB_SAVED_ACCOUNTS`，Chrome 验证通过 |
| 多账号一键切换 | 已完成 | `switchIMProfile` + 保存账号菜单，Chrome 验证通过 |
| 不同账号数据隔离 | 已完成 | 两个临时账号的 `userID/chatToken/imToken` 均不同，Chrome 验证切换后状态恢复 |
| IP 限制登录提示 | 已完成 | `data.allowed=false`、`reason=user_login_ip_not_allowed`、`clientIp`、`allowedIps` 解析并转为可读提示；未强造后端拦截场景 |
| 宵禁登录限制提示 | 已完成 | `/user/openim/token` 的 `data.allowed=false` 和 `curfew` 响应解析并转为可读提示；未强造后端宵禁场景 |

- 总数：7
- 已完成：7
- 未完成：0

## 已接入最新文档接口

- `GET /config/openim/status`：真实接口健康检查通过。
- `GET /enterprise/code/validate`：企业号校验，前端固定测试企业号 `LOCALTEST001`。
- `POST /account/register`：临时账号注册验证通过，注册无需短信验证码。
- `POST /account/login`：个人账号登录，返回业务 `access_token` 和 OpenIM 登录参数。
- `POST /account/code/send`：验证码发送，按文档 query 参数发送 `areaCode/phoneNumber/telephone`。
- `POST /account/code/verify`：验证码校验，按文档 query 参数发送 `areaCode/phoneNumber/telephone/verifyCode`。
- `GET /user/openim/token`：刷新当前登录用户 OpenIM token，真实接口验证通过。

## 替换或移除的旧接口

- `/user/outtime`：不再调用；登录限制由 `/account/login` 和 `/user/openim/token` 响应承接。
- `/user/logout`：不再调用；退出由 OpenIM SDK logout + 本地状态清理承担。
- `/user/password/reset`、`/user/password/reset/v1`：不再调用。
- `/user/password/update`、`/user/password/update/v1`：不再调用。
- `/user/verify/password`：不再调用。

## 文档缺口

- 最新文档未提供用户端退出业务接口，因此不能再按旧 `/user/logout` 对接。
- 最新文档未提供用户端忘记密码、修改密码、校验旧密码接口；当前入口返回“最新接口文档未提供该功能接口”，等待后端补文档或确认产品降级。
- IP 限制和宵禁限制已有响应解析和提示逻辑，但测试环境当前未配置可稳定复现的拦截账号或时间窗口；本次只验证正常登录与 token 刷新。

## 验证结果

- `npm run verify:web-api-coverage`：通过，`missingInApiDoc=[]`、`missingInSource=[]`、`unexpectedSourceOnly=[]`、`unexpectedSourceNotInApiDoc=[]`。
- `npm run verify:web-api-contract`：通过，`checkedCount=212`、`failedCount=0`，新增登录 GET 方法和旧接口禁用断言。
- `npx eslint --quiet "src/api/login.ts" "src/layout/useGlobalEvents.tsx" "src/store/user.ts" "scripts/verify-web-api-contract.mjs"`：通过。
- 真实接口验证：
  - `/config/openim/status` HTTP 200，`resultCode=1`，OpenIM 服务可达。
  - `/enterprise/code/validate?code=LOCALTEST001` HTTP 200，`valid=true`、`allowRegister=true`。
  - 注册临时账号 `18892517876 -> userID=10000038`、`18892521356 -> userID=10000039` 成功。
  - 两个临时账号分别调用 `/account/login` 和 `/user/openim/token` 成功，`userID/chatToken/imToken` 相互隔离。
- Chrome 浏览器验证：
  - 使用本机 Google Chrome 登录两个临时账号，均跳转 `#/chat`。
  - IndexedDB `OpenCorp-Config` 中 `IM_CHAT_TOKEN`、`IM_TOKEN`、`IM_USERID`、`IM_WEB_CURRENT_ACCOUNT` 写入符合登录响应。
  - 保存账号菜单切回账号 `10000038` 后，本地 token 和 userID 恢复为账号 1。
- `npm run verify:web-api-ui` 未作为最终证据：项目 Playwright 自带 Chromium 未安装，命令在启动浏览器前失败；已用系统 Google Chrome 直接验证替代。

## 剩余风险

- TypeScript 全量 `tsc --noEmit` 仍受既有群、文件、通知类型问题影响，登录改动相关文件未出现新的 lint 问题。
- 如果后端未来恢复用户端密码类接口，需要按最新文档重新接入，而不是恢复旧 Swagger 路径。
- 如果要强验证 IP 限制和宵禁限制，需要后端提供可控测试账号、IP 白名单或时间窗口。
