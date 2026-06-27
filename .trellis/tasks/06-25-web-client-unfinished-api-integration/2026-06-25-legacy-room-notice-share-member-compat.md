# 2026-06-25 旧群公告、群共享和群成员详情兼容接入

## 接口

- `/room/get`
- `/room/member/get`
- `/room/noticesPage`
- `/room/notice/list`
- `/room/updateNotice`
- `/room/notice/delete`
- `/room/share/find`
- `/room/share/get`
- `/room/add/share`
- `/room/share/delete`

## 接入位置

- `src/api/group.ts`
  - 新增旧群详情 `getLegacyRoomInfo()`，作为 `/room/openim/detail` 和 `/room/getRoom` 后的群资料兜底。
  - 新增旧群成员详情 `getLegacyGroupMember()`，按 Swagger 的 `roomId/userId` 调用 `/room/member/get`。
  - 新增旧群公告列表、搜索、更新、删除封装。
  - 新增旧群共享文件列表、详情、新增、删除封装。

- `src/utils/businessPayload.ts`
  - 新增 `mergeBusinessRecordsByKey()`，统一按业务 ID 合并新旧接口列表结果。
  - 新增 `settleAtLeastOneBusinessRequest()`，用于兼容写操作中“新旧接口至少一个成功即可继续”的场景。

- `src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx`
  - 群公告列表同时读取 `/room/openim/notices` 和 `/room/noticesPage`，按 `noticeId/id` 合并。
  - 群公告保存同时调用 `/room/openim/notice/update` 和 `/room/updateNotice`。
  - 群公告删除同时调用 `/room/openim/notice/delete` 和 `/room/notice/delete`。

- `src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx`
  - 群共享文件列表同时读取 `/room/openim/shares` 和 `/room/share/find`，按 `shareId/id` 合并。
  - 群共享文件详情读取 `/room/share/get`。
  - 群共享文件删除同时调用 `/room/openim/share/delete` 和 `/room/share/delete`。

- `src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx`
  - 群文件或视频消息发送成功后，共享文件登记同时调用 `/room/openim/share/add` 和 `/room/add/share`。

- `src/pages/common/UserCardModal/index.tsx`
  - 用户资料卡在有群上下文时尝试读取 `/room/member/get`，作为群成员资料增强。

## 状态

已完成源码接入，待浏览器确认真实响应结构。

本轮未新增、未修改、未运行单元测试。尝试运行 `tsc --noEmit --pretty false` 做类型检查时，因执行工作区外 Node/npm 需要提权且审批器返回 404 拒绝，未继续绕过执行。
