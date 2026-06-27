# 2026-06-19 发送申请确认保护

## 背景

继续排查 Web 端远端写操作入口时，发现两个发送申请链路仍会在点击按钮后直接调用业务接口：

- 用户卡片的好友申请：`UserCardModal/SendRequest.tsx` 直接调用 `addBusinessFriend`，对应 `/friends/add`。
- 群卡片的入群申请：`GroupCardModal/index.tsx` 直接调用 `joinBusinessGroup`，对应 `/room/openim/join`。

这两类操作都会改变远端关系状态，应与申请同意/拒绝、公告已读等 mutation 入口保持一致，先展示确认框，用户确认后再提交。

## 处理

- `src/pages/common/UserCardModal/SendRequest.tsx`
  - 引入全局 `modal.confirm`。
  - 将原发送逻辑拆为 `submitApplication`。
  - 点击 `Send` 时先展示 `application.confirmSendFriendRequest`，确认后才调用 `/friends/add`。
- `src/pages/common/GroupCardModal/index.tsx`
  - 引入全局 `modal.confirm`。
  - 将原发送逻辑拆为 `submitApplication`。
  - 点击入群申请发送时先展示 `application.confirmJoinGroup`，确认后才调用 `/room/openim/join`。
- `src/i18n/resources/zh.json`
  - 新增 `application.confirmSendFriendRequest`：`确认发送好友申请吗？`
  - 新增 `application.confirmJoinGroup`：`确认申请加入该群吗？`
- `src/i18n/resources/en.json`
  - 新增 `application.confirmSendFriendRequest`：`Send this friend request?`
  - 新增 `application.confirmJoinGroup`：`Apply to join this group?`

## 真实 Chrome 复测

- 使用真实 Chrome 插件连接的受控标签打开 `http://127.0.0.1:7777/index.html#/login`。
- 使用账号 `18888888888 / czp0422+` 登录成功进入 `#/chat`。
- 进入 `#/contact/newFriends`，打开第一条待验证用户 `10000002907853` 的用户卡片。
- 点击 `Add Friends` 进入好友验证页。
- 点击 `Send` 后弹出确认框：
  - 标题：`Send`
  - 内容：`Send this friend request?`
  - 按钮：`Cancel`、`OK`
- 点击 `Cancel` 后确认框关闭，未点击 `OK`，未提交 `/friends/add`。

## 群申请验证状态

- 通过顶部 `+` -> `Add Group` 搜索真实群：
  - `4011035808`
  - `3413653759`
- 两个群都属于当前账号已加入群，群卡片只显示 `Send Message`，不会进入入群申请页。
- 因当前没有可搜索到的未加入群数据，本轮未能在真实 Chrome 中点出 `Apply to join this group?` 确认框；代码路径已接入确认保护，待提供一个当前账号未加入且业务接口可搜索到的群后补做浏览器确认。

## 说明

本轮未新增或修改测试文件，未运行单元测试、构建或验证脚本。所有验证只通过真实 Chrome 页面完成，且未点击任何确认框的 `OK`，没有主动触发远端关系变更。
