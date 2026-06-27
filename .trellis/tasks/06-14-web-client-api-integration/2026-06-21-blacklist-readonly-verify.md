# 2026-06-21 通讯录黑名单只读复测

## 验收范围

- 浏览器：真实 Google Chrome，经 Playwright CLI 连接当前会话。
- 入口：左上角账号菜单 -> 账号设置 -> 通讯录黑名单。
- 当前页面停留：`http://127.0.0.1:7777/index.html#/contact/myGroups`
- 本轮只打开黑名单弹窗，不点击移出黑名单、语言切换、通知开关或其他设置保存入口。

## 结果

- 账号设置弹窗正常打开，展示“个人设置”“选择语言”“消息提示”“修改密码”“通讯录黑名单”等入口。
- 点击“通讯录黑名单”后弹窗显示空态：`暂无数据`。
- 网络请求观察：
  - `POST /business-api/friends/queryBlacklistWeb?pageIndex=0&pageSize=100&access_token=...` 返回 200。
  - 打开账号设置时 `POST /business-api/user/notification/settings?access_token=...` 返回 200。
- 控制台错误复查：0 errors。
- 截图：`output/playwright/chrome-blacklist-readonly-verify-20260621.png`

## 结论

- Web 黑名单列表已接入 `/friends/queryBlacklistWeb`，当前账号无黑名单数据时能正常展示空态。
- 通知设置读取接口仍正常；本轮未触发 `/user/notification/settings/update`、`/friends/blacklist/delete` 或其他 mutation。
