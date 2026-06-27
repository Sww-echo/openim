# 2026-06-23 入群审核列表 status 默认值修正

## 背景

真实浏览器使用 `18888888888 / czp0422+` 进入群 `#/chat/sg_4011035808` 后，群设置抽屉可见管理员/群主入口：

- 入群审核
- 特殊成员
- 群助手
- 群权限开关
- 消息销毁设置
- 转让群组
- 解散群组

仅点击 `入群审核` 只读入口时，旧请求为：

```text
POST /business-api/room/openim/join-requests?pageIndex=0&pageSize=50&roomId=4011035808
```

该请求返回 HTTP 500，响应体为空。

同一浏览器会话中，通讯录群通知预加载请求带 `status=-1`：

```text
POST /business-api/room/openim/join-requests?pageIndex=0&pageSize=100&roomId=4011035808&status=-1
```

该类请求返回 HTTP 200。Swagger 中 `status` 是可选参数，描述为 `-1 全部，0 待审核，1 已通过，2 已拒绝，3 已过期`。

## 修改

- `src/api/group.ts`
  - `JoinRequestParams` 明确增加 `status?: number`。
  - `getOpenIMJoinRequests` 统一默认传 `status: -1`。
- `src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx`
  - 移除调用点重复默认值，交由 API 封装补齐。
- `src/store/contact.ts`
  - 移除通讯录群通知调用点重复默认值，交由 API 封装补齐。

## 复测

- 未运行单元测试、构建、覆盖检查或验证脚本。
- 浏览器动态导入当前 Vite 模块并调用：

```ts
getOpenIMJoinRequests({
  roomId: "4011035808",
  pageIndex: 0,
  pageSize: 50,
});
```

- 网络请求已变为：

```text
POST /business-api/room/openim/join-requests?pageIndex=0&pageSize=50&status=-1&roomId=4011035808
```

- HTTP 状态为 200，业务体为：

```json
{"resultCode":1030101,"resultMsg":"缺少访问令牌"}
```

该结果证明参数形态已从 HTTP 500 恢复到后端可处理路径；业务失败原因是当前浏览器在 HMR 后回到登录页，业务 token 未重新注入到该动态调用。

## 当前限制

本轮尝试重新登录时，`/business-api/enterprise/code/validate?code=LOCALTEST001` 和 `/business-api/user/openim/token` 返回 HTTP 500 且响应体为空，导致无法完成完整 UI 登录后复测。待业务后端恢复后，需要重新打开群 `sg_4011035808` 的 `入群审核` 面板，确认带 `access_token` 的 UI 请求业务体。

本轮未点击同意、拒绝、特殊成员角色设置、群助手添加/删除、群设置保存、清空消息、转让、解散等 mutation 操作。
