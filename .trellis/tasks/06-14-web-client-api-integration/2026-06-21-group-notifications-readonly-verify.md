# 2026-06-21 群通知只读复测

## 验收范围

- 浏览器：真实 Google Chrome，经 Playwright CLI 连接当前会话。
- 页面：`http://127.0.0.1:7777/index.html#/contact/groupNotifications`
- 当前账号：`10000003`
- 本轮仅打开群通知列表，不点击同意、拒绝或任何审核处理入口。

## 结果

- 通讯录点击“群通知”后，页面显示“群通知”标题，当前无可见申请列表数据。
- 网络请求观察：
  - OpenIM SDK 背景接口 `POST http://47.238.134.161:10002/group/get_recv_group_applicationList` 返回 200。
  - OpenIM SDK 背景接口 `POST http://47.238.134.161:10002/group/get_user_req_group_applicationList` 返回 200。
  - 本次未观察到新增的 `/business-api/room/openim/join-requests` 列表请求。
- 控制台错误复查：0 errors。
- 截图：`output/playwright/chrome-group-notifications-readonly-verify-20260621.png`

## 结论

- 通讯录“群通知”入口当前仍主要依赖 OpenIM SDK 申请列表数据。
- 业务审核处理兼容代码已存在，但真实业务申请 ID 透传仍需后端或真实申请数据进一步验证。
- 本轮未触发 `/room/openim/join-requests/handle` 或任何审核 mutation。
