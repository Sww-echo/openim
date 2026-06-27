# 2026-06-21 联系人与会话只读兜底日志降级

## 变更

- `src/store/contact.ts`
  - `getFriendListByReq` 中 businessApi 好友列表合并失败时由 `console.warn` 改为 `console.debug`。
  - `getBlackListByReq` 中 businessApi 黑名单合并失败时由 `console.warn` 改为 `console.debug`。
  - OpenIM SDK 基线读取失败仍保留用户级错误提示。
- `src/store/conversation.ts`
  - 当前群详情读取 businessApi `/room/openim/detail` 失败时由 `console.warn` 改为 `console.debug`。
  - 当前群成员信息读取 businessApi `/room/openim/members` 失败时由 `console.warn` 改为 `console.debug`。
  - OpenIM SDK 基线读取失败仍保留用户级错误提示。

## 浏览器复测

- 刷新真实浏览器当前页 `http://127.0.0.1:7777/index.html#/contact/myGroups`。
- 页面正常渲染通讯录和“我的群组”列表，展示 2 个真实群。
- 刷新后初始快照控制台显示 0 errors；后续 idle 阶段出现已知 OpenIM WS 握手失败错误，来源为 `ws://47.238.134.161:10001`，不是本轮 `/business-api` 只读兜底分支。
- 关键业务只读请求继续通过 `/business-api` proxy：
  - `/business-api/friends/list?userId=10000003&access_token=...` 返回 200。
  - `/business-api/friends/queryBlacklistWeb?pageIndex=0&pageSize=100&access_token=...` 返回 200。
  - `/business-api/friends/newFriendListWeb?userId=10000003&pageIndex=0&pageSize=100&access_token=...` 返回 200。
  - `/business-api/room/openim/join-requests?...roomId=4011035808...` 返回 200。
  - `/business-api/room/openim/join-requests?...roomId=3413653759...` 返回 200。

## 结论

- businessApi 作为只读增强来源时，不应因为兜底失败污染浏览器 warning/error；SDK 基线仍负责兜底展示。
- 用户主动写操作和 SDK 基线读取失败未被静默吞掉，仍按原有错误提示处理。
- 本轮未运行单元测试、构建或验证脚本，未触发真实 mutation。
