# 2026-06-20 最新 Swagger 未支持路径反扫

## 背景

在重新保存最新 `docs/openim-swagger.json` 后，对当前源码中的业务路径做反向扫描，目标是找出“代码会调用，但最新 Swagger 不支持”的接口，避免继续依赖旧契约。

## 扫描结果

- 首轮发现：
  - `/account/password/reset`：`src/api/login.ts` 的历史找回密码兜底。
  - `/user/rtc/get_token`：`src/api/imApi.ts` 的旧 RTC/LiveKit token 获取接口。
- 已处理 `/account/password/reset`：
  - `useReset` 现在只调用最新 Swagger 支持的 `/user/password/reset`。
  - 缺少验证码校验返回的 `serial` 时直接返回 `Missing password reset serial`，不再调用未支持的历史接口。
  - 忘记密码页面在验证码校验成功回调中已前置检查 `serial/deviceSerial/deviceID/deviceId`；缺失时停留在验证码步骤并提示错误，不再进入新密码表单。
  - 请求层公开路径白名单移除 `/account/password/reset`。
- 复扫后仅剩 `/user/rtc/get_token`：
  - 最新 Swagger 只有 `/user/openMeet`，摘要为“获取视频会议地址”，参数为 `toUserId/area`。
  - 当前 RTC UI 使用 LiveKit，需要 `{ serverUrl, token }`，`/user/openMeet` 不能直接替代旧 token 契约。
  - 音视频通话不在本次 Web 用户端首期明确需求清单内，暂不强行迁移；后续若纳入范围，需要后端提供当前 Web RTC 的 `serverUrl/token` 契约或明确 `/user/openMeet` 返回结构。

## 验证状态

- 已完成源码路径与最新 Swagger 路径的只读反扫。
- 已用浏览器只读打开登录页的“忘记密码”入口，页面正常展示手机号、验证码、发送验证码和下一步按钮；控制台 0 error。
- 未运行单元测试、构建或验证脚本。
- 未点击发送验证码、下一步、登录、找回密码提交、音视频呼叫或其他真实 mutation。
