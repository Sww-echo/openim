# Web 群管理功能按最新接口文档重新对齐

## 需求范围

- 群主/管理员管理入口
- 群公告管理
- 群成员管理
- 群权限设置
- 消息销毁设置
- 邀请审核
- 查看已读详情
- 查看在线成员

## 最新文档接口

后续只以 `docs/openim-frontend-api-doc.json` 为准。

- 创建群：`POST /room/add`
- 群详情：`GET /room/openim/detail`
- 群成员：`GET /room/openim/members`、`GET /room/openim/member/detail`
- 群公告：`GET /room/openim/notices`、`GET /room/openim/notice/detail`、`POST /room/openim/notice/add`、`POST /room/openim/notice/update`、`POST /room/openim/notice/delete`
- 邀请/入群审核：`GET /room/openim/join-requests`、`GET /room/openim/join-request/detail`、`POST /room/openim/join-requests/handle`
- 已读详情：`GET /room/openim/message/read-detail`
- 在线成员：`GET /room/openim/online-members`
- 特殊成员：`GET /room/openim/special-members`、`POST /room/openim/member/set-special-role`
- 当前用户群设置：`POST /room/openim/member/set-offline-no-push`、`POST /room/openim/member/set-top`、`POST /room/openim/member/clear-message`
- 群成员备注：`POST /room/openim/member/remark/update`
- 群助手：`/room/openim/group-helpers/**`
- 群二维码：`/room/openim/qr/**`

## 旧接口处理

以下旧接口需要从群管理主流程迁移：

- `/room/getRoom`、`/room/get` -> `/room/openim/detail`
- `/room/member/list`、`/room/member/getMemberListByPage` -> `/room/openim/members`
- `/room/member/get` -> `/room/openim/member/detail`
- `/room/notice/list`、`/room/noticesPage` -> `/room/openim/notices`
- `/room/updateNotice` -> `/room/openim/notice/update`
- `/room/notice/delete` -> `/room/openim/notice/delete`
- `/room/add/share`、`/room/share/find`、`/room/share/get`、`/room/share/delete` 迁移到聊天任务中的 `/room/openim/share/**`
- `/room/queryGroupHelper`、`/room/addGroupHelper`、`/room/deleteGroupHelper`、`/room/*AutoResponse` -> `/room/openim/group-helpers/**`

## 文档缺口

以下旧能力在最新接口文档中没有明确用户端等价接口，不能按旧文档强接：

- `/room/list`：群聊列表优先由 OpenIM SDK 会话/群组列表承担，业务增强只读可用 `/room/openim/detail` 和 `/room/openim/mapping` 按需补齐。
- `/room/join`：最新文档有 `/room/openim/qr/join`，普通搜索入群/直接入群如无文档等价，先记录缺口。
- `/room/delete`、`/room/transfer`、`/room/member/delete`、`/room/member/update`：最新文档无明确用户端等价接口，优先 SDK 或记录缺口。
- `/room/update`：群权限设置、消息销毁设置在最新文档中没有统一用户端更新接口，需要逐项确认是否由 `/room/add` 默认权限模板、后台模板或后端补文档承担。
- `/room/set/admin`：最新文档无用户端管理员设置接口，不能继续按旧接口作为新目标。
- `/room/openim/member/mute`、`/room/openim/member/unmute`、`/room/openim/member/remark/delete`：当前源码存在但最新文档未列出，需移出主线或等待文档补充。

## 实施拆分

1. 静态核对 `src/api/group.ts` 和群设置/群通知页面，列出所有旧 `/room/**` 调用。
2. 将群详情、成员、公告、审核、已读详情、在线成员迁移到 `/room/openim/**`。
3. 将群助手、二维码、特殊成员能力按最新文档接口和权限字段对齐。
4. 对最新文档缺口建立页面降级策略：SDK 承担、隐藏入口、只读展示或明确提示后端未提供接口。
5. 使用真实接口和浏览器流程验证群管理入口、公告、成员、审核、已读详情、在线成员。

## 完成统计要求

完成本任务时必须新增 Trellis 记录，至少包含：

- 需求项总数、已完成数、未完成数
- 最新文档内已接接口列表
- 替换掉的旧接口列表
- 最新文档缺口列表
- 真实接口调用或浏览器验证结果
- 剩余风险和后续动作
