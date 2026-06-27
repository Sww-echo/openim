# Web 用户端接口接入

## 范围声明

本次任务只接入 Web 用户端功能需要的接口。

不接入后台管理端、平台总后台、企业后台管理页、移动端、支付/转账、商务圈、直播、客服、商品、订单、运营活动等非 Web 用户端首期范围。

## 背景

Web 用户端需要覆盖登录、聊天、文件上传下载、聊天记录搜索和群管理等核心 IM 工作流。更新后的 Swagger 已保存到 `docs/openim-swagger.json`，前置梳理任务为 `06-14-web-client-api-coverage`。

本任务目标是把需求功能与 Swagger 接口对齐，并在现有 Web demo 中完成接口接入改造。OpenIM SDK 能直接承担的能力不重复用业务 API 重做，业务 API 只承担账号、token、权限校验、文件、搜索、群管理等补充能力。

## 接入目标

### 1. 登录功能

需要接入：

- 企业号验证：`/enterprise/code/validate`
- 个人账号登录：`/account/login`
- 验证码能力：`/account/code/send`、`/account/code/verify`
- OpenIM token：`/user/openim/token`
- 多账号保存、一键切换、账号数据隔离：前端本地存储 + OpenIM SDK 登录态隔离

需要确认：

- IP 限制登录提示和宵禁登录限制提示，优先由 `/account/login` 返回明确错误码和错误消息。
- Swagger 中相关预检接口主要在 `/console/**/security/**` 下，若 Web 端需要直接调用，必须先确认后端允许用户端调用。

### 2. 聊天功能

需要接入：

- 群聊列表、单聊列表：优先使用 OpenIM SDK 会话能力。
- 群消息收发：OpenIM SDK 发送；发送前调用 `/room/openim/send-before` 做业务校验。
- 单聊消息收发：OpenIM SDK 发送；发送前调用 `/friend/openim/send-before` 做业务校验。
- 文件上传下载：`/file/upload/context`、`/file/upload`、`/file/sign`、`/file/download`
- 图片/视频预览：`/file/preview`、`/file/compress`、`/file/convert`
- 聊天记录搜索：`/friend/openim/messages/search`、`/room/openim/messages/search`
- 消息转发：合并转发使用 `/message/merge/preview`、`/message/merge/forward-before`
- 消息删除：需按产品语义确认是本地删除、服务端删除还是撤回；群消息撤回接口为 `/room/openim/message/recall`
- 群设置查看、群成员查看：`/room/openim/detail`、`/room/openim/members`

### 3. 群管理功能

需要接入：

- 群主/管理员管理入口：基于 OpenIM 群角色 + 后端权限字段判断。
- 群公告管理：`/room/openim/notices`、`/room/openim/notice/update`、`/room/openim/notice/delete`
- 群成员管理：`/room/openim/members`、`/room/openim/member/remark/update`
- 群权限设置：优先接入 Swagger 中已有明确用户端接口，缺口需后端确认。
- 消息销毁设置：当前 Swagger 未看到统一设置接口，需确认后端字段或替代接口。
- 邀请审核：`/room/openim/join-requests`、`/room/openim/join-requests/handle`
- 查看已读详情：`/room/openim/message/read-detail`
- 查看在线成员：`/room/openim/online-members`

## 非目标

- 不实现后台管理端安全配置、登录审计、IP 绑定配置和宵禁配置管理。
- 不接入支付、转账、消费记录。
- 不接入商务圈、直播间、客服、商品、订单、转盘、在线奖励。
- 不改造后端接口定义。
- 不把 OpenIM SDK 已提供的会话和消息收发能力重复封装成业务 API。

## 验收标准

- Web 登录页能完成企业号校验、账号登录，并保存业务 token、OpenIM token、OpenIM userID。
- 多账号切换后，当前账号 token、SDK 登录用户和本地缓存数据不串号。
- IP 限制和宵禁限制能在登录阶段展示明确提示；若后端接口未提供用户端能力，任务中记录阻塞点。
- 单聊/群聊发送前校验能接入，校验失败时阻止 SDK 发送并展示后端提示。
- 文件上传、下载、预览链路走通。
- 单聊/群聊聊天记录搜索可用。
- 群详情、成员列表、公告、邀请审核、已读详情、在线成员按权限可见并可用。
- 所有本次新增 API 都走 `/business-api` proxy，避免浏览器跨域。

## 风险与待确认

- 更新后的 Swagger 未包含当前代码使用的 `/user/find/full`、`/user/search/full`，需要确认是否移除，或迁移到 `/friends/get`、`/friends/list`、`/room/member/get` 等接口。
- `/console/**/security/**` 是后台接口，不应默认作为 Web 用户端接口接入。
- “消息删除”“群权限设置”“消息销毁设置”的接口语义需要后端确认。
- OpenIM SDK 返回数据和业务 API 返回数据字段命名可能不一致，接入层需要做小范围 normalize，不把字段兼容散落到页面组件。
