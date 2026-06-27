# 2026-06-25 群成员免打扰/置顶兼容接口接入

## 接口

- `/room/member/setOfflineNoPushMsg`

## 接入位置

- `src/api/group.ts`
  - 新增 `LegacyGroupMemberSettingParams`。
  - 新增 `setLegacyGroupMemberOfflineNoPush()`，按 Swagger 传 `roomId/offlineNoPushMsg/type/userId`。

- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - 群免打扰保存时，同时调用：
    - `/room/openim/member/set-offline-no-push`
    - `/room/member/setOfflineNoPushMsg`，其中 `type=0`
  - 群置顶保存时，同时调用：
    - `/room/openim/member/set-top`
    - `/room/member/setOfflineNoPushMsg`，其中 `type=1`
  - 两个业务接口至少一个成功即可继续 OpenIM SDK 本地会话状态更新。

## 状态

已接入，待浏览器确认真实响应结构。

当前群相关接口仍可能受后端 `roomId` 契约影响。此前已有多处 `/room/openim/**` 返回“群ID不合法”或 `1010101` 的记录，本次旧接口作为兼容同步接入，不替代 OpenIM SDK 的会话置顶/免打扰能力。

本轮未运行单元测试，未新增或修改单元测试。真实浏览器复测仍等待自动化登录调用测试接口权限确认。
