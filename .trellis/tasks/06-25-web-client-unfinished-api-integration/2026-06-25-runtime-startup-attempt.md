# 2026-06-25 运行验证尝试

## 本轮用户授权

- 用户明确当前都是测试数据，允许真实调用接口和修改测试数据。
- 本任务后续 Web 端接口验证可按真实接口执行，但仍只覆盖 Web 用户端范围。
- 页面内删除、解散、转让、清空等高风险操作仍保留二次确认，避免误触。

## 启动验证

- 已确认 `7777` 端口当前未监听。
- 已确认 `.env` 配置：
  - `VITE_CHAT_URL=/business-api`
  - `VITE_BUSINESS_API_TARGET=http://47.238.134.161:8092`
  - `VITE_API_URL=http://47.238.134.161:10002`
  - `VITE_WS_URL=ws://47.238.134.161:10001`
- 已确认 `vite.proxy.ts` 中 `/business-api` 会转发到 `VITE_BUSINESS_API_TARGET`，并去掉 `/business-api` 前缀。
- 已确认 `src/api/business.ts` 使用 `VITE_CHAT_URL` 创建业务请求实例。
- 已确认 `src/layout/useGlobalEvents.tsx` 使用 `VITE_API_URL` 和 `VITE_WS_URL` 初始化 OpenIM SDK。

## 当前阻塞与后续进展

- 当前 Codex shell 找不到 `npm`。
- `where.exe` 能定位到 `C:\nvm4w\nodejs\node.exe` 和 `C:\nvm4w\nodejs\npm.cmd`，但沙箱内直接执行工作区外 Node 路径失败。
- 按权限规则提权执行 Node 被审批系统拒绝，不能继续绕过执行。
- 因此当时未能由 Codex shell 启动 `npm run dev:web`。
- 后续检查发现 `127.0.0.1:7777` 已监听，说明本地 Web 服务已由外部环境启动。

## 运行态探测

- `http://127.0.0.1:7777/index.html#/login` 返回 HTTP 200。
- `http://127.0.0.1:7777/@vite/client` 返回 HTTP 200。
- `http://127.0.0.1:7777/src/main.tsx` 返回 HTTP 200。
- `http://127.0.0.1:7777/business-api/openim-swagger.html` 返回 HTTP 200，确认 `/business-api` proxy 可转发到 `8092`。
- 当前 shell 不存在 `npx`，无法按 Playwright CLI 方式做真实浏览器自动化复测。
- 未新增、未修改、未运行单元测试。

## 待继续

- 真实浏览器打开：
  - `http://127.0.0.1:7777/index.html#/login`
- 登录后继续复测：
  - 登录跳转。
  - businessApi 是否经 `/business-api` 代理发起。
  - OpenIM SDK 是否连接 `10002/10001`。
  - 群设置、成员、公告、共享、发送前校验等已接入口是否能触发请求。
