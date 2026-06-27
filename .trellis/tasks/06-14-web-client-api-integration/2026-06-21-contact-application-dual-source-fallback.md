# 2026-06-21 联系人申请列表双通道兜底

## 背景

- Web 端“新的好友”和“群通知”需要同时兼容 OpenIM SDK 申请列表与 businessApi 申请列表。
- 原实现中部分申请列表读取先等 SDK 成功，再尝试业务列表；如果 SDK 读取失败，业务列表不会继续尝试，并且会写入 `console.error`。
- 这类入口属于只读列表，不应因为 SDK 或 businessApi 单侧失败导致整页失败或污染控制台错误。

## 本轮调整

- `src/store/contact.ts`
  - `getRecvFriendApplicationListByReq`
  - `getSendFriendApplicationListByReq`
  - `getRecvGroupApplicationListByReq`
  - `getSendGroupApplicationListByReq`
- 上述四个读取函数改为：
  - SDK 列表读取和 businessApi 列表读取相互独立。
  - SDK 失败时继续尝试 businessApi。
  - businessApi 失败时保留 SDK 结果。
  - 两侧读取失败均仅 `console.debug`，不再 `console.error`。
  - 群申请发出列表也补充 businessApi `/room/openim/join-requests` 的合并兜底。
- 同意/拒绝好友申请、同意/拒绝群申请等 mutation 逻辑未改，仍保留原有错误提示。

## 真实浏览器复测

- 使用真实浏览器打开：
  - `#/contact/newFriends`
  - `#/contact/groupNotifications`
- “新的好友”页面展示真实申请记录：
  - `10000002907853` 等待验证。
  - `橙子皮4`、`橙子皮1` 已同意记录。
- 网络请求确认：
  - OpenIM SDK：`/friend/get_friend_apply_list`、`/friend/get_self_friend_apply_list` 返回 200。
  - businessApi：`/business-api/friends/newFriendListWeb?...` 返回 200。
  - OpenIM SDK：`/group/get_recv_group_applicationList`、`/group/get_user_req_group_applicationList` 返回 200。
  - businessApi：`/business-api/room/openim/join-requests?...roomId=4011035808`、`roomId=3413653759` 返回 200。
- 打开“群通知”后页面保持正常，Playwright console error 复查为 0。
- 打开“新的好友”时曾出现 OpenIM WebSocket 握手失败日志：
  - `ws://47.238.134.161:10001 ... Connection closed before receiving a handshake response`
  - 该错误来自 OpenIM WS 连接，不是本轮申请列表读取逻辑。

## 结论

联系人申请列表现在具备 SDK 与 businessApi 双通道只读兜底能力；任一数据源失败不会阻断另一路结果，也不会把只读失败升级为用户级错误或 console error。

本轮未点击同意/拒绝，未触发好友申请处理、群申请处理或其他 mutation；未运行单元测试、构建或验证脚本。
