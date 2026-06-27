# 2026-06-25 旧群列表与按 JID 查群详情兼容接入

## 接口

- `/room/list`
- `/room/list/his`
- `/room/getRoomByJid`

## 接入位置

- `src/api/group.ts`
  - 新增 `getLegacyRoomList()`，按 Swagger 传 `pageIndex/pageSize/roomName`。
  - 新增 `getLegacyRoomHistoryList()`，按 Swagger 传 `type/pageIndex/pageSize`。当前仅封装，不混入“我的群”，避免历史或退出群污染当前群列表。
  - 新增 `getLegacyRoomInfoByJid()`，按 Swagger 传 `roomJid`。
  - `getBusinessGroupInfo()` 增加 `/room/getRoomByJid` 兜底，顺序为 `/room/openim/detail` -> `/room/getRoom` -> `/room/getRoomByJid` -> `/room/get`。

- `src/store/contact.ts`
  - 群列表刷新时保留 OpenIM SDK `getJoinedGroupListPage()` 主链路。
  - 同步读取 `/room/list`，将业务群列表归一化为 `GroupItem` 后按 `groupID` 合并。
  - businessApi 读取失败只写 `console.debug`，不阻断 SDK 群列表。

## 状态

已完成源码接入，待浏览器确认真实响应结构。

本轮未新增、未修改、未运行单元测试。`/room/list/his` 暂只封装，后续如需要“历史群/已退出群”入口再使用。
