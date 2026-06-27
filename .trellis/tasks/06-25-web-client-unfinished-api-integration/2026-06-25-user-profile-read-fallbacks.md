# 2026-06-25 用户资料只读兜底接口接入

## 接口

- `/user/getUserInfo`
- `/user/get/v1`

## Swagger 核对

- `/user/getUserInfo` 无参数，用于读取当前登录用户资料。
- `/user/get/v1` 参数：
  - `userId`：可选，用户编号。
  - `roomId`：可选，群上下文。

## 实现

- `src/api/friend.ts` 新增：
  - `getCurrentBusinessUserInfo()`
  - `getBusinessUserInfoV1()`
- `src/api/login.ts` 继续作为聚合出口导出上述方法。
- 自己的资料卡打开时，在本地 `selfInfo` 基础上尝试读取 `/user/getUserInfo` 补充业务资料。
- 他人资料卡打开时，在 SDK、`/user/get` 基础上尝试读取 `/user/get/v1`；有群上下文时传 `roomId`。
- 两个接口均为只读增强，失败只写 `console.debug`，不阻断资料卡展示。

## 验证

- 已静态确认新增路径、封装、聚合导出和资料卡调用点存在。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 155。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查。
- 本轮未做真实浏览器资料卡接口复测，待登录后打开自己/好友/群成员资料卡确认。
