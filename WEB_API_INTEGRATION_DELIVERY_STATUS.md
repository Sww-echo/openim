# Web 用户端接口接入交付状态

更新时间：2026-06-25

## 1. 范围

本文只统计 OpenIM Electron Demo 的 Web 用户端接口接入情况。

本次接入范围包括：
- 登录、注册、账号相关能力。
- 聊天列表、单聊、群聊、消息收发前置校验、聊天记录搜索。
- 好友、联系人、黑名单、新朋友。
- 文件上传、预览、下载、资源列表、存储概览。
- 群资料、群成员、群公告、入群审核、在线成员、已读详情、群设置。
- 系统公告、通知设置。

本次不接入：
- 后台管理端、开放平台、支付、红包、运营治理、直播、客服、活动奖励、机器人、好友分组等非 Web IM 主线能力。

## 2. 环境配置

| 项目         | 当前值                        | 状态                                    |
| ------------ | ----------------------------- | --------------------------------------- |
| businessApi  | `http://47.238.134.161:8092`  | 已接入，通过 `/business-api` proxy 转发 |
| openIMApiURL | `http://47.238.134.161:10002` | 已接入，OpenIM SDK/API 使用             |
| openIMWsURL  | `ws://47.238.134.161:10001`   | 已接入，OpenIM SDK WebSocket 使用       |
| 本地业务代理 | `/business-api`               | 已接入，用于规避浏览器跨域              |
| 业务 token   | `access_token`                | businessApi 请求使用                    |
| OpenIM token | `openIM.token`                | OpenIM SDK 登录使用                     |
| 固定企业号   | `LOCALTEST001`                | 登录、注册、验证码流程使用              |
| Swagger JSON | `docs/openim-swagger.json`    | 已保存到本地，文档 path 数量 844        |

源码侧当前已封装约 100 个业务接口路径，覆盖 Web 用户端主线能力。

## 3. 总体结论

| 分类               | 接入状态           | 可用性结论                                                                                       |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------ |
| 基础链路           | 已接入             | 可用。`/business-api` proxy、业务 token、OpenIM token 分离、登录跳转链路已打通                   |
| 登录、注册、账号   | 已接入             | 核心可用。手机号密码登录已有真实浏览器成功记录；注册已按 Swagger 对齐，`invitationCode` 非必填   |
| 单聊、群聊消息收发 | 已接入             | 实际消息收发走 OpenIM SDK；发送前校验、搜索、收藏、合并消息、撤回增强走 businessApi              |
| 好友、联系人       | 已接入             | SDK 提供基础数据，businessApi 补资料、搜索、新朋友、黑名单                                       |
| 聊天记录和资源     | 已接入             | 单聊搜索、收藏列表、合并消息列表、文件资源列表等只读接口已有可用记录                             |
| 文件能力           | 已接入             | 文件资源、签名、预览链路已封装；上传、下载、删除属于真实副作用，未主动触发验收                   |
| 群管理             | 大量接入           | 前端入口和请求已接通，但多个 `/room/openim/**` 接口受后端 `roomId` 契约影响，业务体暂不可用      |
| 写操作 mutation    | 已接入但未真实确认 | 删除、保存、审核、上传、下载、清空、转让、解散等只确认源码链路和参数防护，未主动触发远端状态变更 |
| 非本期范围接口     | 不接或暂缓         | 后台、支付、红包、运营、机器人等不属于本次 Web 用户端接入范围                                    |

## 4. 已接入且已有可用记录

### 4.1 基础链路

| 能力                                | 状态                   |
| ----------------------------------- | ---------------------- |
| `/business-api` 本地代理            | 可用                   |
| businessApi 自动携带 `access_token` | 可用                   |
| OpenIM token 与业务 token 分离      | 可用                   |
| 登录后进入 `#/chat`                 | 已有真实浏览器成功记录 |
| OpenIM SDK 会话、好友、群基础同步   | 已有真实浏览器成功记录 |

### 4.2 登录、注册、账号

| 接口                        | 用途                    | 当前状态                                    |
| --------------------------- | ----------------------- | ------------------------------------------- |
| `/enterprise/code/validate` | 企业号验证              | 已接入；后端曾偶发 HTTP 500                 |
| `/account/login`            | 手机号密码登录          | 已接入；`18888888888 / czp0422+` 曾登录成功 |
| `/user/openim/token`        | 获取或刷新 OpenIM token | 已接入；后端曾偶发 HTTP 500                 |
| `/account/register`         | 注册                    | 已按 Swagger 对齐，`invitationCode` 非必填  |
| `/account/code/send`        | 发送验证码              | 已按 query 参数对齐                         |
| `/account/code/verify`      | 校验验证码              | 已按 query 参数对齐                         |
| `/user/password/reset`      | 找回密码                | 已按 Swagger 路径对齐                       |
| `/user/password/update`     | 修改密码                | 已封装并挂到账户设置入口                    |

### 4.3 好友、联系人、用户资料

| 接口                         | 当前状态                         |
| ---------------------------- | -------------------------------- |
| `/friends/list`              | 好友列表可读，OpenIM SDK 兜底    |
| `/friends/get`               | 好友资料可读                     |
| `/friends/newFriendListWeb`  | 新朋友列表可读                   |
| `/friends/queryBlacklistWeb` | 黑名单列表可读，当前账号多为空态 |
| `/user/get`                  | 用户资料可读                     |
| `/user/avatar/get`           | 头像增强可读                     |
| `/friends/page`              | 好友搜索增强已封装               |
| `/user/public/search/list`   | 公开用户搜索已封装               |
| `/user/getByAccount`         | 通讯号查询已封装                 |

### 4.4 系统公告和通知设置

| 接口                                   | 当前状态       |
| -------------------------------------- | -------------- |
| `/system/announcements`                | 列表只读可用   |
| `/system/announcements/detail`         | 详情只读可用   |
| `/system/announcements/unread-count`   | 未读数只读可用 |
| `/user/notification/settings`          | 读取可用       |
| `/user/notification/settings/defaults` | 默认设置已接入 |

以下接口已接入，但会改变状态，未主动触发真实写操作：
- `/system/announcements/read`
- `/system/announcements/read-all`
- `/user/notification/settings/update`

### 4.5 聊天搜索、收藏、合并消息、文件资源

| 接口                             | 当前状态                                      |
| -------------------------------- | --------------------------------------------- |
| `/friend/openim/messages/search` | 单聊搜索已有 HTTP 200 和结果展示记录          |
| `/room/openim/messages/search`   | 群聊搜索已接入，受群 `roomId` 契约影响        |
| `/message/favorites`             | 收藏列表可读                                  |
| `/message/favorites/context`     | 收藏上下文可读                                |
| `/message/favorites/detail`      | 收藏详情已接入                                |
| `/message/merge/saved`           | 已保存合并消息列表可读                        |
| `/message/merge/context`         | 合并消息上下文可读                            |
| `/message/merge/detail`          | 合并消息详情已接入                            |
| `/message/merge/preview`         | 合并预览已接入                                |
| `/file/resources`                | 文件资源列表可读                              |
| `/file/resources/detail`         | 文件详情可读，已有真实文件 `chuanxi.jpg` 记录 |
| `/file/reference/status`         | 引用状态可读                                  |
| `/file/resources/references`     | 引用关系可读                                  |
| `/file/storage/overview`         | 当前用户容量概览可读                          |

## 5. 已接入但后端业务体暂不可用

这些接口前端入口、代理和请求路径已接通，浏览器中能发出请求。当前主要问题是后端暂未兼容 `roomId=OpenIM groupID`，或没有返回稳定业务 `roomId` 映射。

| 接口                               | 当前现象                                      | 前端策略                   |
| ---------------------------------- | --------------------------------------------- | -------------------------- |
| `/room/openim/detail`              | HTTP 可达，业务体参数校验失败                 | SDK 或本地数据兜底         |
| `/room/openim/members`             | HTTP 可达，部分场景业务体失败                 | SDK 成员列表兜底           |
| `/room/openim/notices`             | HTTP 200 后业务体失败                         | 展示空态                   |
| `/room/openim/online-members`      | HTTP 200 后返回 `1010101`                     | 展示空态                   |
| `/room/openim/join-requests`       | 不传 `status` 曾 HTTP 500；已默认 `status=-1` | 保留入口，等待后端契约修正 |
| `/room/openim/shares`              | HTTP 可达，业务体可能失败                     | 展示空态                   |
| `/file/storage/room-overview`      | HTTP 200 后返回“群ID不合法”                   | 展示空详情                 |
| `/room/openim/message/read-detail` | HTTP 200 后返回 `1010101`                     | 展示空态                   |

已观察群：
- `sg_3413653759`：普通成员入口可见，在线成员、公告等请求可发出，但业务体失败。
- `sg_4011035808`：管理员入口可见，入群审核带 `status=-1` 后可进入 HTTP 200 路径。

## 6. 已接入但未确认真实写操作

以下接口会改变远端状态，或涉及发送、上传、下载、删除、审核、群设置保存等动作。目前只确认源码封装、页面入口、确认链路和参数防护，未主动触发真实操作。

### 6.1 好友操作

| 接口                               | 用途               | 当前状态                                 |
| ---------------------------------- | ------------------ | ---------------------------------------- |
| `/friends/add`                     | 添加好友           | 已接入，已补 `toUserId` 防护，未真实提交 |
| `/friends/delete`                  | 删除好友           | 已接入，已补 `toUserId` 防护，未真实提交 |
| `/friends/remark`                  | 修改好友备注       | 已接入，已补 `toUserId` 防护，未真实提交 |
| `/friends/update`                  | 好友资料或关系更新 | 已接入，已补 `toUserId` 防护，未真实提交 |
| `/friends/update/OfflineNoPushMsg` | 好友免打扰         | 已接入，已补目标用户防护，未真实提交     |
| `/friends/blacklist/add`           | 加入黑名单         | 已接入，已补 `toUserId` 防护，未真实提交 |
| `/friends/blacklist/delete`        | 移出黑名单         | 已接入，已补 `toUserId` 防护，未真实提交 |
| `/user/update`                     | 更新个人资料       | 已接入，未真实提交                       |

### 6.2 消息操作

| 接口                            | 用途               | 当前状态           |
| ------------------------------- | ------------------ | ------------------ |
| `/friend/openim/send-before`    | 单聊发送前业务校验 | 已接入             |
| `/room/openim/send-before`      | 群聊发送前业务校验 | 已接入             |
| `/room/openim/message/recall`   | 群消息撤回增强     | 已接入，未真实撤回 |
| `/message/favorites/add`        | 收藏消息           | 已接入，未真实提交 |
| `/message/favorites/update`     | 更新收藏           | 已接入，未真实提交 |
| `/message/favorites/delete`     | 删除收藏           | 已接入，未真实提交 |
| `/message/favorites/merge`      | 收藏合并消息       | 已接入，未真实提交 |
| `/message/merge/save`           | 保存合并消息       | 已接入，未真实提交 |
| `/message/merge/forward-before` | 合并消息转发前校验 | 已接入，未真实转发 |
| `/message/merge/delete`         | 删除已保存合并消息 | 已接入，未真实删除 |

说明：
- 单聊、群聊消息实际收发仍走 OpenIM SDK。
- businessApi 负责发送前校验、撤回增强、收藏、合并消息、转发前置等业务能力。

### 6.3 文件操作

| 接口                         | 用途           | 当前状态               |
| ---------------------------- | -------------- | ---------------------- |
| `/file/upload/context`       | 获取上传上下文 | 已接入                 |
| `/file/upload`               | 文件上传       | 已接入，未真实上传验收 |
| `/file/sign`                 | 文件签名       | 已接入                 |
| `/file/download`             | 文件下载       | 已接入，未真实下载验收 |
| `/file/preview`              | 文件预览       | 已接入                 |
| `/file/compress`             | 图片压缩       | 已接入                 |
| `/file/compress/async`       | 异步图片压缩   | 已接入                 |
| `/file/convert`              | 视频转换       | 已接入                 |
| `/file/convert/async`        | 异步视频转换   | 已接入                 |
| `/file/thumbnail`            | 缩略图生成     | 已接入                 |
| `/file/delete`               | 删除文件资源   | 已接入，未真实删除     |
| `/file/reference/invalidate` | 文件引用失效   | 已接入，未真实失效     |

### 6.4 群管理操作

| 接口                                         | 用途               | 当前状态                                                      |
| -------------------------------------------- | ------------------ | ------------------------------------------------------------- |
| `/room/update`                               | 群设置保存         | 已接入，已补 `roomId` 防护，未真实保存                        |
| `/room/delete`                               | 解散群             | 已接入，已补 `roomId` 防护，未真实执行                        |
| `/room/transfer`                             | 转让群             | 已接入，已补 `roomId/toUserId` 防护，未真实执行               |
| `/room/member/update`                        | 群成员更新         | 已接入，已补成员 ID 防护，未真实执行                          |
| `/room/member/delete`                        | 移除或退出群成员   | 已接入，已补 `roomId/userId` 防护，未真实执行                 |
| `/room/set/admin`                            | 设置或取消管理员   | 已接入，未真实执行                                            |
| `/room/join`                                 | 加群               | 已接入，未真实执行                                            |
| `/room/openim/notice/update`                 | 更新群公告         | 已接入，已补 `roomId/noticeId/noticeContent` 防护，未真实保存 |
| `/room/openim/notice/delete`                 | 删除群公告         | 已接入，已补 `roomId/noticeId` 防护，未真实删除               |
| `/room/openim/join-requests/handle`          | 同意或拒绝入群申请 | 已接入，缺真实 `requestId` 验收                               |
| `/room/openim/member/set-special-role`       | 设置特殊成员角色   | 已接入，未真实执行                                            |
| `/room/openim/member/remark/update`          | 更新群成员备注     | 已接入，未真实保存                                            |
| `/room/openim/member/remark/delete`          | 删除群成员备注     | 已接入，未真实删除                                            |
| `/room/openim/member/mute`                   | 禁言成员           | 已接入，未真实执行                                            |
| `/room/openim/member/unmute`                 | 解除禁言           | 已接入，未真实执行                                            |
| `/room/openim/member/set-offline-no-push`    | 群免打扰           | 已接入，未真实保存                                            |
| `/room/openim/member/set-top`                | 群置顶             | 已接入，未真实保存                                            |
| `/room/openim/member/clear-message`          | 清空群消息         | 已接入，未真实执行                                            |
| `/room/openim/group-helpers/add`             | 添加群助手         | 已接入，未真实执行                                            |
| `/room/openim/group-helpers/delete`          | 删除群助手         | 已接入，未真实执行                                            |
| `/room/openim/group-helpers/keywords/add`    | 添加关键词         | 已接入，未真实执行                                            |
| `/room/openim/group-helpers/keywords/update` | 更新关键词         | 已接入，未真实执行                                            |
| `/room/openim/group-helpers/keywords/delete` | 删除关键词         | 已接入，未真实执行                                            |
| `/room/openim/qr/create`                     | 生成群二维码       | 已接入，未真实生成                                            |
| `/room/openim/qr/resolve`                    | 解析群二维码       | 已接入，未真实解析                                            |
| `/room/openim/qr/join`                       | 二维码入群         | 已接入，未真实入群                                            |

## 7. SDK 和 businessApi 分工

### 7.1 OpenIM SDK/API 负责

- 会话列表。
- 好友和群基础同步。
- 单聊、群聊消息实际收发。
- 历史消息基础拉取。
- WebSocket 长连接。
- 本地会话、消息、草稿等 SDK 状态。
- 当前建群仍保留 SDK 路径，等待后端明确 Web 建群业务契约。

### 7.2 businessApi 负责

- 企业号校验、登录、注册、验证码、找回密码、修改密码。
- 系统公告、公告已读。
- 好友资料增强、新朋友、黑名单、好友关系变更。
- 发送前业务校验。
- 聊天记录搜索、收藏、合并消息、撤回增强。
- 文件上传、签名、预览、下载、资源列表、引用关系、容量概览。
- 群公告、群成员、入群审核、在线成员、已读详情、群助手、群权限、群设置等业务管理能力。

## 8. 当前未确认或待后端对齐

| 功能点                                   | 当前原因                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| 完整群管理流程                           | 需要稳定管理员账号和后端 `roomId` 契约修正                                |
| 群详情、群成员、公告、在线成员、已读详情 | 多个 `/room/openim/**` 接口 HTTP 可达但业务体返回失败                     |
| 入群审核同意或拒绝                       | 需要真实业务 `requestId`，且属于 mutation                                 |
| 特殊成员、管理员、禁言、群免打扰、群置顶 | 需要真实目标成员和用户确认后触发                                          |
| 群公告编辑、删除                         | 已有参数防护，未触发真实保存或删除                                        |
| 群设置保存、消息销毁设置保存             | 已有 `roomId` 防护，未触发真实保存                                        |
| 文件真实上传、下载、删除、引用失效       | 属于副作用操作，未主动触发                                                |
| 图片、视频业务预览完整链路               | 需要带真实业务 `fileId` 的消息数据继续验收                                |
| 群消息发送、撤回、收藏、转发、删除       | 消息发送走 SDK，业务增强未做真实 mutation 验收                            |
| 群共享文件新增登记                       | 已补 `roomId/url/name/size` 防护，真实文件或视频发送属于 mutation，未触发 |

## 9. 仍未实现或暂缓接入

| 模块                               | 状态 | 原因                                |
| ---------------------------------- | ---- | ----------------------------------- |
| 好友分组                           | 暂缓 | 不在用户给出的 Web 端必须覆盖列表中 |
| 机器人、群机器人                   | 暂缓 | 不在本次 Web 用户端核心范围         |
| 支付、红包                         | 不接 | 非 Web IM 主线能力                  |
| 后台管理、运营治理                 | 不接 | 属于管理端或运营端能力              |
| 开放平台                           | 不接 | 非本次 Web 用户端接入范围           |
| 文件清理策略、直播、客服、活动奖励 | 不接 | 非本次 Web 用户端接入范围           |

## 10. 已补的源码防护

| 模块                                 | 已补内容                                                                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 登录注册                             | 固定企业号 `LOCALTEST001`；注册 `invitationCode` 非必填；业务 token 取 `access_token`                                                                |
| 账号/RTC API 封装层                  | 验证码、登录、注册、重置密码、修改密码、企业号校验、OpenIM token 刷新、RTC token 请求统一 trim 账号字段和 token 字段，缺必填参数时短路               |
| 聊天资源                             | `favoriteId/mergeId/fileId/shareId` 缺失时不暴露不可执行操作                                                                                         |
| 消息右键、搜索、转发                 | 收藏、撤回、已读详情补 `clientMsgID/serverMsgID/seq` 定位字段防护；搜索和转发统一 trim `roomId/groupID/userID`                                       |
| 好友、用户 API 封装层                | 用户资料、头像、好友资料、搜索、好友关系变更、黑名单、新朋友列表统一 trim 用户 ID 和关键词，缺必填 ID 时短路                                         |
| 公告、通知设置 API 封装层            | 公告详情、标已读补 `announcementId`；通知设置读取和更新统一 trim `roomId/type/scope`，过滤无效更新项                                                 |
| 聊天 API 封装层                      | 发送前校验、聊天搜索、群消息撤回、合并消息、收藏消息统一 trim ID 和 CSV 参数，缺必填目标或定位字段时短路                                             |
| 只读列表参数                         | 公告列表、收藏列表、合并消息列表、黑名单列表、新朋友列表统一过滤空白分页、状态、关键词等可选参数                                                     |
| 文件 API 封装层                      | 签名、预览、下载、压缩、转码、缩略图、资源详情、房间容量、删除、引用失效等统一 trim `fileId/roomId/reason/signature`，缺必填参数时短路               |
| 群管理 API 封装层                    | 群详情、成员、公告、入群审核、群助手、特殊成员、群设置、二维码等统一 trim `roomId/userId/requestId/noticeId/shareId/helperId/code`，缺必填参数时短路 |
| 群成员管理                           | 成员备注、禁言、解禁、管理员变更等补目标成员 ID 防护                                                                                                 |
| 群二维码                             | 生成需要 `roomId`，解析和入群需要 `code`                                                                                                             |
| 群助手                               | 增删助手、关键词增删改统一补 `roomId` 和相关 ID 防护                                                                                                 |
| 群公告、入群审核、在线成员、特殊成员 | 列表入口缺 `roomId` 时空态，不发无效请求；公告保存和删除补必填防护                                                                                   |
| 群设置保存、退出、解散               | 缺 `roomId` 时不更新本地状态，不进入确认链路                                                                                                         |
| 群邀请、踢人、转让                   | 统一 trim `groupID/roomId/userID`，缺上下文时不打开无效选择弹窗                                                                                      |
| 群通知处理                           | 同意或拒绝前校验 `groupID/userID`，缺 ID 时不调用 businessApi 或 OpenIM SDK                                                                          |
| 群共享文件登记                       | `/room/openim/share/add` 前校验 `roomId/url/name/size`，缺必填参数时跳过异步登记                                                                     |

## 11. 当前风险

- 后端多个群接口仍需要明确业务 `roomId` 和 OpenIM `groupID` 的映射关系。
- 部分后端接口曾出现 HTTP 500，例如 `/enterprise/code/validate`、`/user/openim/token`。
- OpenIM WS `ws://47.238.134.161:10001` 偶发握手失败。
- 写操作没有主动真实验收，需要用户明确授权和可回滚测试数据。

## 12. 下一步建议

1. 后端先确认 `roomId` 契约：是否支持直接传 OpenIM `groupID`，还是需要提供稳定业务 `roomId` 映射接口。
2. 前端继续把剩余群 API 封装层做参数归一化，减少无效请求。
3. 准备一组可回滚的测试数据后，再逐项验收 mutation：加好友、入群审核、公告保存、群设置保存、文件上传下载、消息收藏和撤回。
4. 浏览器复测只覆盖真实页面路径，不新增或修改单元测试。
