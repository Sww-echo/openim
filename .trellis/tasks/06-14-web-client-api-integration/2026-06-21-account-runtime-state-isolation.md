# 2026-06-21 多账号运行态隔离补充

## 背景

继续按 Web 用户端接口接入任务复核“多账号保存 / 一键切换 / 不同账号数据隔离”。

现有实现已经具备：

- `IM_WEB_SAVED_ACCOUNTS` 保存多账号 profile。
- `IM_WEB_CURRENT_ACCOUNT` 标记当前账号。
- 聊天草稿通过 `getAccountScopedKey` 写入 `IM_ACCOUNT:${accountKey}:CHAT_DRAFT:${conversationID}`。
- 账号切换时先 `IMSDK.logout()`，再切换业务 token、OpenIM token 和 userID，并清空联系人、会话 store 后 reload。

本轮发现切换账号路径依赖 reload 重建 `useUserStore.selfInfo`，reload 之前内存态中仍可能短暂保留上一个账号头像/昵称。虽然页面马上刷新，但这属于多账号数据隔离边界，应该和 contact/conversation store 一样显式清理。

## 实现

- `src/store/type.d.ts`
  - `UserStore` 新增 `clearUserRuntimeState()`。
- `src/store/user.ts`
  - 新增 `clearUserRuntimeState`，清空 `selfInfo` 并重置 `progress`。
- `src/layout/LeftNavBar/index.tsx`
  - 账号切换成功写入目标账号 token 后，先调用 `clearUserRuntimeState()`，再清空联系人和会话 store，最后 reload。

该改动只清理当前运行态，不删除已保存账号、不清业务 token、不改变登录或切换接口契约。

## 复测

- 真实 Chrome 重新打开 `http://127.0.0.1:7777/index.html#/login`。
- 使用 `18888888888 / czp0422+` 登录成功进入 `#/chat`。
- 网络请求：
  - `/business-api/enterprise/code/validate` 返回 200。
  - `/business-api/account/login` 返回 200。
  - `/business-api/system/announcements/unread-count`、`/business-api/user/get`、`/business-api/friends/queryBlacklistWeb`、`/business-api/friends/newFriendListWeb`、`/business-api/friends/list` 返回 200。
  - OpenIM SDK 相关请求继续走 `http://47.238.134.161:10002/**` 并返回 200。
- 页面正常停留在 `#/chat`，控制台错误复查为 0。
- 截图：`output/playwright/chrome-account-runtime-clear-verify.png`。

本轮未运行单元测试、构建或验证脚本；未触发发送、上传、下载、删除、审核、群设置保存、通知设置更新或其他真实业务 mutation。
