# 2026-06-21 新的好友只读复测

## 验收范围

- 浏览器：真实 Google Chrome，经 Playwright CLI 连接当前会话。
- 页面：`http://127.0.0.1:7777/index.html#/contact/newFriends`
- 当前账号：`10000003`
- 本轮仅做只读打开和网络观察，未点击同意、拒绝、添加好友、删除或其他关系变更入口。

## 结果

- 通讯录点击“新的好友”后，页面展示 4 条真实申请记录：
  - `10000002907853`，状态“等待验证”，验证信息 `hi`
  - `橙子皮4`，状态“已同意”
  - `橙子皮4`，状态“已同意”
  - `橙子皮1`，状态“已同意”，验证信息 `hello`
- 网络请求确认：
  - `POST /business-api/friends/newFriendListWeb?userId=10000003&pageIndex=0&pageSize=100&access_token=...` 返回 HTTP 200。
- 控制台错误复查：0 errors。
- 截图：`output/playwright/chrome-new-friends-readonly-verify-20260621.png`

## 结论

- Web 新朋友列表已按 Swagger 的 `/friends/newFriendListWeb` 业务接口接入，并能展示真实业务数据。
- 好友申请处理动作仍需单独确认后才能验收，本轮未触发任何 mutation。
