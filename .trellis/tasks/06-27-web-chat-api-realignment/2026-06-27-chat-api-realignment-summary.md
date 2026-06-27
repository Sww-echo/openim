# Web 聊天功能最新接口对齐完成统计

## 范围

- 接口文档：`docs/openim-frontend-api-doc.json`
- 需求来源：`需求清单.txt` 的 `2.2 聊天功能`
- 代码范围：`src/api/chat.ts`、`src/api/file.ts`、`src/api/group.ts`、`src/pages/chat/queryChat/**`、`src/store/contact.ts`、`src/store/conversation.ts`

## 需求统计

| 需求项 | 状态 | 接入口径 |
| --- | --- | --- |
| 群聊列表 | 已对齐 | OpenIM SDK 会话/群组列表承担，业务详情按需用 `/room/openim/detail` 补齐 |
| 单聊列表 | 已对齐 | OpenIM SDK 会话列表 + `/friends/list`、`/friends/get` 业务资料补齐 |
| 群消息收发 | 已对齐 | `GET /room/openim/send-before` 前置校验，通过后用 OpenIM SDK 发送 |
| 文件上传下载 | 已对齐 | `/file/upload/context`、`/file/upload`、`/file/sign`、`/file/download` |
| 图片/视频预览 | 已对齐 | `/file/sign`、`/file/preview`，前端按签名 URL 或 Blob 渲染 |
| 聊天记录搜索 | 已对齐 | `/friend/openim/messages/search`、`/room/openim/messages/search`，失败时保留 SDK 本地历史兜底 |
| 消息转发、复制、删除 | 已对齐 | 复制为本地剪贴板；转发和普通发送由 SDK 承担；收藏/合并/撤回/资源删除按最新文档接口 |
| 群设置查看 | 已对齐 | `/room/openim/detail` + OpenIM 群资料 |
| 群成员查看，受权限控制 | 已对齐 | `/room/openim/members` 优先，SDK 成员列表兜底；入口按群角色和 `showMember/lookMemberInfo` 控制 |

- 总数：9
- 已按最新文档或 SDK 责任边界对齐：9
- 仍沿用旧 Swagger 主流程接口：0

## 已接入最新文档接口

- 单聊/群聊发送前校验：`GET /friend/openim/send-before`、`GET /room/openim/send-before`
- 单聊/群聊消息搜索：`GET /friend/openim/messages/search`、`GET /room/openim/messages/search`
- 群消息撤回：`POST /room/openim/message/recall`
- 合并消息：`GET /message/merge/context`、`GET /message/merge/preview`、`POST /message/merge/save`、`GET /message/merge/forward-before`、`GET /message/merge/saved`、`GET /message/merge/detail`、`POST /message/merge/delete`
- 消息收藏：`GET /message/favorites`、`GET /message/favorites/context`、`POST /message/favorites/add`、`POST /message/favorites/update`、`POST /message/favorites/merge`、`POST /message/favorites/delete`、`GET /message/favorites/detail`
- 文件能力：`GET /file/upload/context`、`POST /file/upload`、`GET /file/sign`、`GET /file/download`、`GET /file/preview`、`GET /file/resources`、`GET /file/resources/detail`、`GET /file/resources/references`、`GET /file/storage/overview`、`GET /file/storage/room-overview`、`POST /file/delete`、`POST /file/reference/invalidate`、`GET /file/reference/status`
- 群共享聊天资源：`GET /room/openim/shares`、`GET /room/openim/share/detail`、`POST /room/openim/share/add`、`POST /room/openim/share/delete`
- 群设置/成员查看：`GET /room/openim/detail`、`GET /room/openim/members`

## 替换或移除的旧接口

- `/room/sendMsgBefore` -> `GET /room/openim/send-before`
- `/user/collection/list` -> `GET /message/favorites`
- `/room/share/find` -> `GET /room/openim/shares`
- `/room/share/get` -> `GET /room/openim/share/detail`
- `/room/add/share` -> `POST /room/openim/share/add`
- `/room/share/delete` -> `POST /room/openim/share/delete`
- 群聊列表旧 `/room/list` 不再作为主数据源，改由 OpenIM SDK 会话/群组列表承担。

## SDK 承担项

- 单聊列表、群聊列表、会话状态同步、实际消息发送。
- 文本、图片、视频、文件等 OpenIM 消息体创建。
- 普通消息转发和本地消息删除。
- 搜索接口不可用时的本地历史消息兜底。

## 文档缺口

- 最新文档没有用户端 HTTP 会话列表接口，列表必须继续由 OpenIM SDK 承担。
- 最新文档没有“复制消息”的后端接口，复制保持前端本地能力。
- 最新文档没有普通消息的服务端物理删除接口；当前只支持 SDK 本地删除、群消息撤回、收藏/合并记录删除和文件资源删除。
- 合并转发需要聊天记录搜索返回可用 `auditId`；没有审计 ID 的本地消息只能走 SDK 普通转发。

## 验证结果

- `npm run verify:web-api-coverage`：通过，`expectedCount=101`，`missingInApiDoc=[]`，`missingInSource=[]`，`unexpectedSourceOnly=[]`，`unexpectedSourceNotInApiDoc=[]`。
- `npm run verify:web-api-contract`：通过，`checkedCount=240`，`failedCount=0`。
- `npm run verify:web-api-lint`：通过。
- `npm run verify:web-api-e2e` 远程验证通过：
  - 登录 `userID=10000004`。
  - `GET /friend/openim/send-before`、`GET /room/openim/send-before` 通过。
  - 单聊/群聊消息搜索通过。
  - 消息收藏列表、已保存合并消息列表通过。
  - 群详情、群成员、群公告、入群审核、在线成员、特殊成员、已读详情能力通过。
- 早前真实文件链路验证已通过：
  - `GET /file/upload/context`、`POST /file/upload`、`GET /file/resources/detail`、`GET /file/sign`、签名下载和签名预览均成功。

## 剩余风险

- 合并预览和合并转发需要提供真实 `auditIds` 才能做端到端写入验证，本轮远程脚本未提供该数据，因此只验证了接口契约和可选入口。
- 实际消息到达仍依赖 OpenIM SDK 和当前登录会话；HTTP 文档只覆盖发送前业务校验和审计/资源类能力。
