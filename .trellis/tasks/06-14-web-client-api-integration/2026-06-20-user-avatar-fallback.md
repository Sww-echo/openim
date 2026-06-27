# 2026-06-20 用户头像接口兜底接入

## 背景

- 最新 Swagger 提供用户端只读接口 `/user/avatar/get`，用于获取用户头像 URL，并支持 `update` 参数控制是否追加时间戳避免缓存。
- 当前 Web 已通过 `/user/get`、`/friends/get` 等接口读取用户资料，但部分业务响应可能不带头像字段。

## 实现

- 新增 `getBusinessUserAvatar(userId, update)` 封装，使用 `/user/avatar/get`。
- 在精确用户资料查询链路中接入头像兜底：
  - `getBusinessUserInfo([userID])`
  - `getBusinessUserByAccount(account)`
- 仅当已归一化用户资料缺少 `faceURL` 且存在 `userID` 时才调用头像接口。
- 不在好友列表、搜索列表等批量列表归一化阶段逐项请求头像，避免引入额外请求风暴。
- 头像响应兼容 `faceURL/faceUrl/avatar/avatarUrl/avatarURL/headimgurl/headImgUrl/url`，如果响应本身就是字符串或数字，也会作为 URL 文本兜底。

## 验证

- `src/api/friend.ts` 经本地 Vite 模块请求返回 200。
- 登录页 HTTP 200。
- 受控 Chrome 使用测试账号登录成功，`/business-api/account/login`、`/business-api/user/get` 和关键 OpenIM 接口返回 200，页面正常停留在 `#/chat`。
- 后续只读复测中观察到当前账号在缺少头像时调用 `/user/avatar/get` 可能返回业务内部异常；前端已调整为按 `userID` 缓存失败并静默保留原资料，避免重复失败请求和控制台告警。
- 本轮未运行单元测试、构建或验证脚本。
- 未触发上传、下载、发送、删除、审核、群设置保存等 mutation。
