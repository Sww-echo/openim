# 2026-06-25 `/user/getOnLine` 接入

## 接口

- Swagger 路径：`/user/getOnLine`
- 用途：获取用户在线状态。
- 参数：`userId`，Swagger 标注为查询目标用户在线状态。

## 接入位置

- `src/api/friend.ts`
  - 新增 `BusinessOnlineStatus` 类型。
  - 新增 `getBusinessUserOnlineStatus()`，通过 `businessRequest` 调用 `/user/getOnLine`。
  - 缺少目标用户时兜底当前登录用户，避免空参数请求。

- `src/pages/common/UserCardModal/index.tsx`
  - 打开用户资料卡时，在原有 SDK/业务用户资料读取后，补充调用 `/user/getOnLine`。
  - 自己的资料卡也会读取当前用户在线状态。
  - 在线状态只作为增强字段展示，接口失败只写 `console.debug`，不阻断资料卡展示。

- `src/i18n/resources/zh.json`
- `src/i18n/resources/en.json`
  - 新增 `placeholder.onlineStatus` 文案。
  - 复用既有 `placeholder.online` 和 `placeholder.offLine`。

## 状态判断

已接入，待浏览器确认真实响应结构。

本轮尝试使用测试账号直连外部业务接口验证响应结构，但网络提权请求被审批器拒绝；按权限规则未继续绕过。当前只完成静态核对，后续在本地服务可用后通过浏览器打开用户卡片，观察 `/business-api/user/getOnLine` 请求和展示结果。

## 原则说明

- KISS：不新增在线成员页或状态管理模块，只增强已有用户资料卡。
- YAGNI：仅解析常见返回字段 `isOnline/online/onlineStatus/status`，未知结构不强行展示。
- DRY：复用现有 `businessRequest`、`unwrapData` 和用户卡片资料加载链路。
- SOLID：接口封装仍集中在 `src/api/friend.ts`，页面只负责读取和展示。
