# `/user/outtime` 登录态检查接入

## 变更

- 新增 `checkBusinessAccountOuttime()`，按 Swagger 调用 `/user/outtime`。
- `access_token` 继续由 `businessRequest` 请求拦截器自动追加。
- `userId` 优先使用登录恢复流程里的 `IMUserID`，缺失时兜底读取本地存储。
- 在 OpenIM SDK 正常登录成功后触发登录态检查。
- 在 SDK 返回 `10102` 已登录分支同样触发登录态检查。

## 设计口径

- `/user/outtime` 属于登录态/离线状态健康检查，不替代 OpenIM SDK 登录。
- 调用失败只写 `console.debug`，不阻断 SDK 登录、`initStore()` 和页面跳转。
- 不新增 UI，不扩展非 Web 用户端功能。

## 验证

- 静态确认 `src/api/login.ts` 已封装 `/user/outtime`。
- 静态确认 `src/layout/useGlobalEvents.tsx` 两条登录成功路径均已异步触发。
- 本地 `http://127.0.0.1:7777/index.html#/login` 返回 HTTP 200。
- 未新增、未修改、未运行单元测试。
