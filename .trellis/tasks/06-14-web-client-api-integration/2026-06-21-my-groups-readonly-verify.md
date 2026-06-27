# 2026-06-21 我的群组与群成员只读复测

## 验收范围

- 浏览器：真实 Google Chrome，经 Playwright CLI 连接当前会话。
- 页面：`http://127.0.0.1:7777/index.html#/contact/myGroups`
- 当前账号：`10000003`
- 本轮只查看群列表和群资料卡，不点击发送消息、保存群设置、邀请、踢人、转让、审核等入口。

## 结果

- 通讯录点击“我的群组”后，页面展示 2 个群：
  - `啊啊i`，成员数 `3`
  - `橙子皮、橙子皮1、橙子皮4`，成员数 `3`
- 点击群 `啊啊i` 后，资料卡展示：
  - 群名：`啊啊i`
  - 群 ID：`4011035808`
  - 创建时间：`2026/6/7`
  - 群成员：`aaa`、`橙子皮1`、`橙子皮4`
- 网络请求观察：
  - 群列表仍来自 OpenIM SDK 增量群数据，例如 `group/get_incremental_join_groups`、`group/get_incremental_group_members_batch`。
  - 群资料卡触发 `POST /business-api/room/openim/members?pageIndex=0&pageSize=100&roomId=4011035808&access_token=...`，HTTP 返回 200。
- 控制台：
  - 0 errors。
  - 1 warning：`getOpenIMGroupMembers failed { resultCode: 1010101, resultMsg: 请求参数验证失败，缺少必填参数或参数错误 }`。
- 截图：`output/playwright/chrome-my-groups-detail-readonly-verify-20260621.png`

## 结论

- “我的群组”列表当前仍由 OpenIM SDK 数据驱动。
- 群成员业务接口入口已保留并发起请求，但后端对 OpenIM `groupID` 作为 `roomId` 的兼容仍不稳定：HTTP 为 200，业务体返回 `1010101` 参数校验失败。
- 页面能展示群成员，说明当前 SDK/本地数据兜底有效；该问题继续按“入口保留，后端调整 roomId 契约后复测”处理。
