# 2026-06-20 SDK 登录并发去重

## 触发原因

浏览器用测试账号 `18888888888 / czp0422+` 登录复测时，页面先进入 `#/chat`，随后回到 `#/login`。控制台日志显示同一账号短时间内出现两次 `IMSDK.login`：

- 第一次 operationID：`f52c0f31-d631-4e9f-9d9b-7dd4447b31a6`
- 第二次 operationID：`e2a5c4f2-3ec4-4a46-bad2-6fce47b5f144`

随后 OpenIM SDK 收到 `TokenKickedError`，并触发本地退出。

## 本次修复

- `src/layout/useGlobalEvents.tsx`
  - 新增模块级 `loginOpenIMSDKOnce(userID, token)`。
  - 使用 `userID + token` 作为登录 key。
  - 同一 key 已有 `IMSDK.login` 进行中时，后续调用复用同一个 Promise，不再重复调用 SDK 登录。
  - 同一 key 已经登录成功时，后续路由挂载不再重复调用 SDK 登录。
  - SDK 返回 `10102 User has logged in repeatedly` 时按幂等成功处理，继续初始化 store，不再作为错误打印并回退登录页。
  - Electron 与 Web 分支仍保留原有 `initSDK/login` 参数。

## 边界

- 该修复只消除前端并发重复登录，不改变业务登录 `/account/login`、OpenIM token、业务 token 的使用方式。
- 若同一账号在其他真实客户端登录导致被踢，仍应按既有 `OnKickedOffline` 流程退出。
- 本轮不运行单元测试、构建或验证脚本。

## 浏览器复测

- 账号：`18888888888`
- 首次复测现象：页面进入 `#/chat` 后返回 `#/login`，新增日志区间出现两次 `SDK => run login with args`，随后出现 `TokenKickedError`。
- 修复后重新登录：
  - 页面稳定停留在 `http://127.0.0.1:7777/index.html#/chat`。
  - 新增日志区间只出现 1 次 `SDK => run login with args`。
  - 继续观察的新日志区间：`loginCount=0`、`kickedCount=0`、`errorLineCount=0`。
  - 未发送消息、未修改群设置、未触发上传/下载或其他业务 mutation。
- 后续进入通讯录和群聊 `sg_4011035808` 时又观察到一次 `10102 User has logged in repeatedly`，页面未被踢但控制台产生 error；已补充“已登录 key 跳过”和 `10102` 幂等成功处理。
- 补充处理后，在已登录状态从群聊 `#/chat/sg_4011035808` 切到通讯录 `#/contact`，新增日志区间为 `loginCount=0`、`repeatedLogin10102=0`、`kickedCount=0`、`errorLineCount=0`。
