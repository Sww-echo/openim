# 2026-06-26 `/user/outtime` 运行态验证

## 验证链路

- 通过本地 proxy 调用 `/business-api/account/login`。
- 测试账号：`18888888888`。
- 登录响应：`resultCode=1`。
- 登录响应中存在 `access_token`，用户编号为 `10000004`。
- 使用该 `access_token` 和 `userId=10000004` 调用 `/business-api/user/outtime`。
- `/user/outtime` 响应：`resultCode=1`。

## 结论

- `/user/outtime` 已通过本地 proxy 与真实业务后端验证可达。
- 当前前端接入策略正确：登录恢复后异步触发，失败不阻断 OpenIM SDK 登录和 `initStore()`。

## 约束

- 未运行单元测试。
- 未修改测试数据。
- 未打印完整 token。
