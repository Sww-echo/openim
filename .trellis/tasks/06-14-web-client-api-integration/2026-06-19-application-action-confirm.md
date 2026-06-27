# 2026-06-19 申请同意/拒绝确认保护

## 背景

复查联系人申请和群申请处理链路时发现，通用申请项 `ApplicationItem` 的“同意/拒绝”按钮会直接调用上层 `onAccept/onReject`：

- 新朋友：
  - 同意：先调用业务 `/friends/add`，再同步 OpenIM SDK `acceptFriendApplication`。
  - 拒绝：调用 OpenIM SDK `refuseFriendApplication`。
- 群通知：
  - 同意/拒绝：如果通知对象中能解析到业务 `requestId`，先调用 `/room/openim/join-requests/handle`，再同步 OpenIM SDK；否则保留 SDK 处理。

上述均属于远端关系状态变更，应该与其他 mutation 一样先弹确认框。

## 处理

- `src/components/ApplicationItem/index.tsx`
  - 引入全局 `modal.confirm`。
  - “同意”按钮先弹确认框，用户确认后才执行 `onAccept`。
  - “拒绝”按钮先弹确认框，用户确认后才执行 `onReject`。
  - `loading` 状态改为 `try/finally`，避免远端调用失败后按钮一直 loading。
- `src/i18n/resources/zh.json`
  - 新增 `application.confirmAgree`：`确认同意这条申请吗？`
  - 新增 `application.confirmRefuse`：`确认拒绝这条申请吗？`
- `src/i18n/resources/en.json`
  - 新增 `application.confirmAgree`：`Approve this request?`
  - 新增 `application.confirmRefuse`：`Reject this request?`

## 真实 Chrome 复测

- 打开 `#/contact/newFriends` 后页面正常渲染，无 Vite 编译遮罩。
- 当前账号的新朋友数据包含：
  - 一条自己发出的待验证申请。
  - 多条已同意记录。
- 因当前没有“收到的待处理申请”，页面不显示“同意/拒绝”按钮，无法用真实数据点出确认框。
- 尝试进入群通知时当前登录态过期回到登录页，本轮未触发任何同意/拒绝动作。

## 说明

本轮没有运行单元测试、构建或验证脚本，未新增或修改测试文件。浏览器仅打开申请列表页面，没有提交 `/friends/add`、`/room/openim/join-requests/handle` 或 SDK accept/refuse 变更。

后续如需完整浏览器验收，需要一个当前账号收到的待处理好友申请或群申请；届时只打开确认框即可验证，真正点击 OK 仍需用户单独确认。
