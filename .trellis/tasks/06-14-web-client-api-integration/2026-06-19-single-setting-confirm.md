# 2026-06-19 单聊设置确认保护

## 背景

继续审计 Web 端远端写操作入口时，发现单聊设置抽屉中以下入口会直接写业务接口：

- `Block this Conversation`：调用 `/friends/update/OfflineNoPushMsg`，再同步 OpenIM SDK 会话免打扰。
- `Sticky on Top`：调用 `/friends/update/OfflineNoPushMsg`，再同步 OpenIM SDK 会话置顶。
- `Automatically delete messages regularly`：调用 `/friends/update` 更新 `chatRecordTimeOut`。

上述操作都会改变远端单聊设置，应与黑名单、解除好友、群设置保存等 mutation 入口保持一致，先展示确认框，用户确认后再提交。

## 处理

- `src/pages/chat/queryChat/SingleSetting/index.tsx`
  - 新增 `confirmUpdateSingleSetting`，统一展示单聊设置保存确认框。
  - `updateSingleNoPush` 改为只在确认框 `OK` 后调用 `/friends/update/OfflineNoPushMsg` 和 `IMSDK.setConversationRecvMessageOpt`。
  - `updateSingleTop` 改为只在确认框 `OK` 后调用 `/friends/update/OfflineNoPushMsg` 和 `IMSDK.pinConversation`。
  - `updateSingleChatRecordTimeOut` 改为只在确认框 `OK` 后调用 `/friends/update`。
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmUpdateSingleSetting`：`确认保存当前单聊设置吗？`
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmUpdateSingleSetting`：`Save this single chat setting?`

## 真实 Chrome 复测

- 使用真实 Chrome 插件受控标签打开 `http://127.0.0.1:7777/index.html#/chat/si_10000003_10000009`。
- 单聊会话正常渲染，右上角设置齿轮可打开单聊设置抽屉。
- 点击 `Block this Conversation` 开关后，弹出确认框：
  - 标题：`Save`
  - 内容：`Save this single chat setting?`
  - 按钮：`Cancel`、`OK`
- 点击 `Cancel` 后确认框关闭，未点击 `OK`，未提交设置变更。
- 打开 `Automatically delete messages regularly` 下拉并选择 `7 day(s)` 后，同样弹出确认框：
  - 标题：`Save`
  - 内容：`Save this single chat setting?`
- 点击 `Cancel` 后确认框关闭，未提交 `/friends/update`。

## 说明

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。浏览器复测只打开确认框并取消，没有点击 `OK`，未触发 `/friends/update/OfflineNoPushMsg`、`/friends/update` 或 OpenIM SDK 设置写操作。
