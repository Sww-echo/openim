# 2026-06-25 `/user/logout` 接入

## 背景

旧任务中 `/user/logout` 因为缺少稳定 `deviceKey/devicekey/telephone(MD5)` 来源而暂缓。用户现在明确当前为测试数据，并授权真实调用接口和触发写操作，因此本轮优先把该接口接入正常手动退出链路。

## 实现

- `src/api/login.ts`
  - 新增 `logoutBusinessUser()`。
  - 从当前保存账号优先读取手机号和区号，本地登录手机号兜底。
  - 生成稳定 Web 端 `deviceKey/devicekey`：`openim-web-${accountKey}-${platform}`。
  - `telephone` 按 Swagger 要求传 `md5(phoneNumber)`。
  - `access_token` 继续由 `businessRequest` 拦截器自动追加。

- `src/store/user.ts`
  - 正常手动退出 `userLogout(false)` 时，先尝试调用 `/user/logout`。
  - 业务退出失败只写 `console.debug`，继续执行 OpenIM SDK logout 和本地登录态清理，避免测试接口异常导致用户无法退出。
  - 强制退出 `userLogout(true)` 保持本地清理路径，不再额外调用业务退出，避免 token 失效场景递归触发接口。

## 验证

- 本轮只做静态核对，未运行单元测试、构建、覆盖检查或验证脚本。
- 尚未打开浏览器点击退出；后续可用真实浏览器验证 `/business-api/user/logout` 请求是否发出及后端响应。

