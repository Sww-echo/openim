# 2026-06-25 群成员列表兼容接口接入

## 接口

- `/room/member/getMemberListByPage`
- `/room/member/list`

## 接入位置

- `src/api/group.ts`
  - 新增 `getLegacyGroupMembersByPage()`，按 Swagger 传 `roomId/pageIndex/pageSize/joinTime`。
  - 新增 `getLegacyGroupMembersByKeyword()`，按 Swagger 传 `roomId/keyword`。

- `src/hooks/useGroupMembers.ts`
  - 群成员列表读取时，同时请求：
    - `/room/openim/members`
    - `/room/member/getMemberListByPage`
  - 两个业务来源统一归一化为 `GroupMemberItem`，并按 `userID` 合并。
  - 若业务侧无有效成员数据，仍保留 OpenIM SDK `getGroupMemberList()` 兜底。

## 状态

已接入，待浏览器确认真实响应结构。

`/room/member/list` 是关键字查询接口，当前群成员列表没有搜索输入，因此本轮先完成封装，不主动用空关键字触发查询。后续若新增成员搜索输入，可直接复用 `getLegacyGroupMembersByKeyword()`。

本轮未运行单元测试，未新增或修改单元测试。真实浏览器复测仍等待自动化登录调用测试接口权限确认。
