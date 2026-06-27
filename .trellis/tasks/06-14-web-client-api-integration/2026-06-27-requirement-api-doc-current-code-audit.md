# 2026-06-27 需求清单、最新接口文档与当前代码接入统计

## 需求目标

需求来源：`需求清单.txt`。

当前目标只覆盖 Web 用户端：

- 登录功能：企业号验证、个人账号登录、Web 端多账号保存、多账号一键切换、不同账号数据隔离、IP 限制登录提示、宵禁登录限制提示。
- 聊天功能：群聊列表、单聊列表、群消息收发、文件上传下载、图片/视频预览、聊天记录搜索、消息转发/复制/删除、群设置查看、群成员查看且受权限控制。
- 群管理功能：群主/管理员管理入口、群公告管理、群成员管理、群权限设置、消息销毁设置、邀请审核、查看已读详情、查看在线成员。

## 最新接口文档

当前接口对接文档统一以 `docs/openim-frontend-api-doc.json` 为准，不再使用旧 `docs/openim-swagger.json`。

最新文档统计：

- groupCount：28
- operationCount：450
- uniqueOperationCount：433
- 实际唯一 path：430
- responseFieldDocCount：95

和需求直接相关的主线接口：

- 登录：`/enterprise/code/validate`、`/account/login`、`/account/register`、`/account/code/send`、`/account/code/verify`、`/user/openim/token`
- 单聊/好友：`/friends/list`、`/friends/page`、`/friends/get`、`/friends/add`、`/friends/delete`、`/friends/remark`、`/friends/queryBlacklistWeb`、`/friend/openim/send-before`、`/friend/openim/messages/search`
- 文件：`/file/upload/context`、`/file/upload`、`/file/sign`、`/file/download`、`/file/preview`、`/file/resources`
- 群聊/群管理：`/room/add`、`/room/openim/detail`、`/room/openim/members`、`/room/openim/notices`、`/room/openim/notice/add`、`/room/openim/notice/update`、`/room/openim/notice/delete`、`/room/openim/join-requests`、`/room/openim/join-requests/handle`、`/room/openim/message/read-detail`、`/room/openim/online-members`、`/room/openim/send-before`、`/room/openim/shares`、`/room/openim/share/add`、`/room/openim/share/delete`
- 消息：`/message/favorites/**`、`/message/merge/**`
- 通知公告：`/system/announcements/**`、`/user/notification/settings/**`

## 当前代码统计

扫描范围：`src/api/**`。

- 当前业务路径总数：162
- 已在最新接口文档中的路径：102
- 不在最新接口文档中的路径：60

不在最新文档中的路径主要分布：

- `/room/**`：39 个，主要在 `src/api/group.ts`
- `/user/**`：19 个，主要在 `src/api/login.ts`、`src/api/friend.ts`、`src/api/userSettings.ts`
- `/friends/**`：2 个，主要在 `src/api/friend.ts`

按文件分布：

- `src/api/chat.ts`：`/room/sendMsgBefore`、`/user/collection/list`
- `src/api/friend.ts`：`/friends/modify/phoneRemark`、`/friends/update`、`/user/get/v1`、`/user/getBindInfo`、`/user/getOnLine`、`/user/getUserInfo`、`/user/public/search/list`、`/user/update`
- `src/api/group.ts`：旧 `/room/**` 兼容接口最多，包括 `/room/list`、`/room/getRoom`、`/room/member/list`、`/room/update`、`/room/delete`、`/room/notice/list` 等
- `src/api/login.ts`：`/user/logout`、`/user/outtime`、`/user/password/reset`、`/user/password/reset/v1`、`/user/password/update`、`/user/password/update/v1`、`/user/verify/password`
- `src/api/report.ts`：`/user/checkReportUrl`、`/user/report`
- `src/api/userSettings.ts`：`/user/settings`、`/user/settings/update`、`/user/update/OfflineNoPushMsg`

## 替换目标

后续接入需要把主流程里旧兼容接口迁移到最新接口文档中的接口：

- `/room/sendMsgBefore` -> `/room/openim/send-before`
- `/room/getRoom`、`/room/get` -> `/room/openim/detail`
- `/room/member/list`、`/room/member/getMemberListByPage` -> `/room/openim/members`
- `/room/notice/list`、`/room/noticesPage` -> `/room/openim/notices`
- `/room/updateNotice` -> `/room/openim/notice/update`
- `/room/notice/delete` -> `/room/openim/notice/delete`
- `/room/share/find` -> `/room/openim/shares`
- `/room/add/share` -> `/room/openim/share/add`
- `/room/share/delete` -> `/room/openim/share/delete`
- `/user/settings`、`/user/settings/update` -> `/user/notification/settings`、`/user/notification/settings/update`
- `/user/update` -> `/user/profile/update`
- `/user/get/v1`、`/user/getUserInfo` -> `/user/get` 或 `/user/getByAccount`

## 文档缺口

以下旧接口在最新 `docs/openim-frontend-api-doc.json` 中没有明确等价接口，不能再按旧 Swagger 继续强接：

- `/room/list`
- `/room/join`
- `/room/delete`
- `/room/transfer`
- `/room/update`
- `/room/set/admin`
- `/user/password/reset`
- `/user/password/update`

处理原则：

- 最新文档已有替代接口的，迁移到最新接口。
- OpenIM SDK 已覆盖且最新文档无业务接口的，优先保留 SDK 主链路。
- 最新文档无明确等价接口的，标记为文档缺口，不再作为旧 Swagger 对接目标。
