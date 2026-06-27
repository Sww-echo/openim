# 2026-06-21 好友列表与详情只读复测

## 背景

继续补充 Web 用户端好友资料接口的真实 Chrome 只读证据。当前账号 `10000003` 的通讯录中已有真实好友数据，可以覆盖好友列表合并展示和好友详情读取。

本轮只打开通讯录和查看好友资料，不点击备注编辑、发送消息、删除好友、加入黑名单或其他关系变更入口。

## 复测过程

- 使用 Playwright CLI 连接真实 Google Chrome 的 `default` 会话。
- 当前页面从聊天页切换到：`http://127.0.0.1:7777/index.html#/contact`。
- 打开通讯录默认 `我的好友`。
- 点击好友 `橙子皮1` 查看资料卡。

## 结果

- `我的好友` 列表展示真实好友：
  - `橙子皮1`
  - `橙子皮4`
- 好友资料卡展示：
  - 昵称：`橙子皮1`
  - userID：`10000006`
  - 性别：`男`
  - 备注、生日、手机号、邮箱为空值兜底 `-`
- 网络请求确认：
  - `POST /business-api/friends/list?userId=10000003&access_token=...` 返回 200。
  - `POST /business-api/friends/get?userId=10000003&toUserId=10000006&access_token=...` 返回 200。
  - `POST /business-api/user/get?userId=10000006&access_token=...` 返回 200。
  - `POST /business-api/user/avatar/get?userId=10000006&update=0&access_token=...` 返回 200。
- 控制台复查：
  - `console error` 数量为 0。
- 截图：
  - `output/playwright/chrome-friend-list-detail-readonly-verify-20260621.png`

## 结论

好友列表和好友详情只读链路可用：通讯录仍以 OpenIM SDK 数据为基线，同时合并 `/friends/list` 和 `/friends/get` 的业务资料；用户基础资料和头像兜底分别通过 `/user/get`、`/user/avatar/get` 读取。

本轮未运行单元测试、构建或验证脚本；未新增或修改测试文件；未触发好友备注保存、删除好友、拉黑、发送消息、加好友或其他真实 mutation。

观察到少量 OpenIM SDK 背景轮询请求曾短暂 `net::ERR_FAILED` 后恢复，不影响本轮 `/business-api/**` 好友只读接口结论。
