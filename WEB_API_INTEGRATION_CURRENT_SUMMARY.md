# Web 用户端接口接入现状汇总

更新时间：2026-06-24

## 1. 范围说明

本文档只统计 OpenIM Electron Demo 的 Web 用户端接口接入情况，不覆盖后台管理、开放平台、支付、红包、运维补偿、文件清理策略等非 Web 用户端能力。

当前约束：

- 本项目后续不新增、不修改单元测试。
- 不运行单元测试、构建、覆盖检查或验证脚本作为本轮结论依据。
- 功能验收只使用真实浏览器复测。
- 不主动触发发送、上传、下载、删除、审核、群设置保存、解散、转让等真实远端写操作，除非用户单独确认。

## 2. 环境与配置基线

| 项目         | 当前值                        | 状态                              |
| ------------ | ----------------------------- | --------------------------------- |
| businessApi  | `http://47.238.134.161:8092`  | 已通过 `/business-api` proxy 转发 |
| openIMApiURL | `http://47.238.134.161:10002` | OpenIM SDK/API 使用               |
| openIMWsURL  | `ws://47.238.134.161:10001`   | OpenIM SDK WebSocket 使用         |
| 本地业务代理 | `/business-api`               | 已接入 Vite 多套配置              |
| 业务 token   | `access_token`                | 登录后随 businessApi 请求携带     |
| OpenIM token | `openIM.token`                | 仅用于 OpenIM SDK 登录            |
| 固定企业号   | `LOCALTEST001`                | 登录、注册、验证码相关流程使用    |
| Swagger JSON | `docs/openim-swagger.json`    | 已保存到本地                      |

## 3. 总体统计

| 分类                           |        数量级 | 说明                                                                                      |
| ------------------------------ | ------------: | ----------------------------------------------------------------------------------------- |
| Swagger 路径                   |        约 844 | 以本地 `docs/openim-swagger.json` 为准                                                    |
| 源码业务接口封装               |        约 111 | 来自 `src/api/**` 的 businessApi 路径扫描，包含兼容、暂缓和本期不接路径                   |
| 已接入且有可用记录             |         约 45 | 登录、公告、通讯录、好友资料、通知设置、聊天搜索、聊天资源、文件资源只读链路为主          |
| 已接入但后端业务体暂不可用     | 约 8 个主入口 | 主要集中在 `/room/openim/**` 和群文件容量，HTTP 可达但业务体返回 `1010101` 或“群ID不合法” |
| 已接入但未做真实 mutation 验收 |           40+ | 发送、上传、下载、删除、审核、群设置保存、好友关系变更等有副作用操作                      |
| 未实现或本期不接               |    多个接口域 | `/console/**`、支付、红包、运维、清理策略、开放平台等非 Web 用户端能力                    |

## 4. 已接入且可用

### 4.1 基础链路

| 能力                                | 当前状态               |
| ----------------------------------- | ---------------------- |
| `/business-api` 代理                | 可用                   |
| businessApi 自动携带 `access_token` | 可用                   |
| OpenIM token 与业务 token 分离      | 可用                   |
| 登录后进入 `#/chat`                 | 已有真实浏览器可用记录 |
| OpenIM SDK 会话、好友、群基础同步   | 已有真实浏览器可用记录 |

### 4.2 登录与账号

| 接口                        | 用途                    | 当前状态                                         |
| --------------------------- | ----------------------- | ------------------------------------------------ |
| `/enterprise/code/validate` | 企业号验证              | 已接入，已有 HTTP 200 记录，后端曾偶发 500       |
| `/account/login`            | 手机号密码登录          | 已接入，`18888888888 / czp0422+` 曾登录成功      |
| `/user/openim/token`        | 获取或刷新 OpenIM token | 已接入，后端曾偶发 500                           |
| `/account/register`         | 注册                    | 已按 Swagger 对齐，`invitationCode` 已改为非必填 |
| `/account/code/send`        | 发送验证码              | 已按 query 参数对齐                              |
| `/account/code/verify`      | 校验验证码              | 已按 query 参数对齐                              |
| `/user/password/reset`      | 找回密码                | 已按 Swagger 路径对齐                            |
| `/user/password/update`     | 修改密码                | 已封装并挂到账户设置入口                         |

说明：

- 登录响应中业务鉴权取 `access_token`。
- OpenIM SDK 登录取 `openIM.token`。
- 企业号固定为 `LOCALTEST001`。
- 注册流程已收敛为手机号、固定企业号、昵称、密码、确认密码。

### 4.3 系统公告

| 接口                                 | 当前状态                 |
| ------------------------------------ | ------------------------ |
| `/system/announcements`              | 列表只读可用             |
| `/system/announcements/detail`       | 详情只读可用             |
| `/system/announcements/unread-count` | 未读数只读可用           |
| `/system/announcements/read`         | 已接入，写操作未真实触发 |
| `/system/announcements/read-all`     | 已接入，写操作未真实触发 |

### 4.4 通讯录、好友资料、黑名单

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

当前策略：

- OpenIM SDK 是通讯录基础数据源。
- businessApi 是资料增强、搜索、新朋友、黑名单补充数据源。
- businessApi 只读失败时保留 SDK 兜底结果，不阻断页面。

### 4.5 用户通知设置

| 接口                                   | 当前状态                 |
| -------------------------------------- | ------------------------ |
| `/user/notification/settings`          | 读取可用                 |
| `/user/notification/settings/defaults` | 默认设置已接入           |
| `/user/notification/settings/update`   | 已接入，写操作未真实触发 |

### 4.6 聊天搜索、收藏、合并消息、文件资源只读

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

已补充的前置防护：

- 收藏缺 `favoriteId` 时禁用详情、编辑、删除相关入口。
- 合并消息缺 `mergeId` 时禁用详情、删除相关入口。
- 文件资源缺 `fileId` 时禁用详情、下载、删除相关入口。
- 群共享文件缺 `shareId` 时隐藏删除入口。

### 4.7 文件基础能力

| 接口                         | 当前状态                      |
| ---------------------------- | ----------------------------- |
| `/file/upload/context`       | 已接入                        |
| `/file/upload`               | 已接入，未真实上传验收        |
| `/file/sign`                 | 已接入，预览/下载签名链路可用 |
| `/file/download`             | 已接入，未真实下载验收        |
| `/file/preview`              | 已接入，预览链路可读          |
| `/file/compress`             | 已接入                        |
| `/file/compress/async`       | 已接入                        |
| `/file/convert`              | 已接入                        |
| `/file/convert/async`        | 已接入                        |
| `/file/thumbnail`            | 已接入                        |
| `/file/delete`               | 已接入，未真实删除验收        |
| `/file/reference/invalidate` | 已接入，未真实失效验收        |

说明：

- 图片、视频、普通文件发送入口已经接入业务文件链路。
- 实际消息发送仍由 OpenIM SDK 完成。
- 上传、下载、删除、引用失效属于副作用操作，当前未主动触发。

## 5. 已接入但后端业务体暂不可用

这些接口前端入口、代理和请求路径已接通，真实浏览器中可以发出请求。当前主要问题是后端尚未兼容 `roomId=OpenIM groupID`，或需要返回稳定业务 `roomId` 映射。

| 接口                               | 当前现象                                      | 前端策略                   |
| ---------------------------------- | --------------------------------------------- | -------------------------- |
| `/room/openim/detail`              | HTTP 可达，业务体参数校验失败                 | SDK/本地数据兜底           |
| `/room/openim/members`             | HTTP 可达，业务体参数校验失败                 | SDK 成员列表兜底           |
| `/room/openim/notices`             | HTTP 200 后业务体失败                         | 展示空态                   |
| `/room/openim/online-members`      | HTTP 200 后 `1010101`                         | 展示空态                   |
| `/room/openim/join-requests`       | 不传 `status` 曾 HTTP 500，已默认 `status=-1` | 保留入口，等待后端契约修正 |
| `/room/openim/shares`              | HTTP 可达，业务体可能失败                     | 展示空态                   |
| `/file/storage/room-overview`      | HTTP 200 后“群ID不合法”                       | 展示空详情                 |
| `/room/openim/message/read-detail` | HTTP 200 后 `1010101`                         | 展示空态                   |

已验证过的群：

| 群              | 现象                                                          |
| --------------- | ------------------------------------------------------------- |
| `sg_3413653759` | 普通成员入口可见，在线成员、公告等请求可发出，但业务体失败    |
| `sg_4011035808` | 管理员入口可见，入群审核带 `status=-1` 后可进入 HTTP 200 路径 |

## 6. 已接入但未确认真实 mutation

以下接口会改变远端状态，或涉及发送、上传、下载、删除、审核、群设置保存等动作。当前只确认源码封装、页面入口、二次确认链路和必要参数防护，不主动触发真实操作。

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

### 6.3 群管理操作

| 接口                                         | 用途                    | 当前状态                                                                     |
| -------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| `/room/update`                               | 群设置保存              | 已接入，已补 `roomId` 防护，未真实保存                                       |
| `/room/delete`                               | 解散群                  | 已接入，已补 `roomId` 防护，未真实执行                                       |
| `/room/transfer`                             | 转让群                  | 已接入，已补 `roomId/toUserId` 防护，未真实执行                              |
| `/room/member/update`                        | 群成员更新              | 已接入，已补 `roomId/目标成员列表` 防护，未真实执行                          |
| `/room/member/delete`                        | 移除/退出群成员         | 已接入，已补 `roomId/userId` 防护，未真实执行                                |
| `/room/set/admin`                            | 设置/取消管理员         | 已接入，未真实执行                                                           |
| `/room/join`                                 | 加群                    | 已接入，未真实执行                                                           |
| `/room/openim/notice/update`                 | 更新群公告              | 已接入，已补 `roomId/noticeId/noticeContent` 防护，未真实保存                |
| `/room/openim/notice/delete`                 | 删除群公告              | 已接入，已补 `roomId/noticeId` 防护，未真实删除                              |
| `/room/openim/join-requests/handle`          | 同意/拒绝入群申请       | 已接入，缺真实 `requestId` 验收                                              |
| `/room/openim/member/set-special-role`       | 设置隐身/监控等特殊成员 | 已接入，未真实执行                                                           |
| `/room/openim/member/remark/update`          | 更新群成员备注          | 已接入，未真实保存                                                           |
| `/room/openim/member/remark/delete`          | 删除群成员备注          | 已接入，未真实删除                                                           |
| `/room/openim/member/mute`                   | 禁言成员                | 已接入，未真实执行                                                           |
| `/room/openim/member/unmute`                 | 解除禁言                | 已接入，未真实执行                                                           |
| `/room/openim/member/set-offline-no-push`    | 群免打扰                | 已接入，已补 `roomId` 防护，未真实保存                                       |
| `/room/openim/member/set-top`                | 群置顶                  | 已接入，已补 `roomId` 防护，未真实保存                                       |
| `/room/openim/member/clear-message`          | 清空群消息游标          | 已接入，已补 `roomId` 防护，未真实确认执行                                   |
| `/room/openim/group-helpers/add`             | 添加群助手              | 已接入，已补 `roomId/helperId` 防护，未真实执行                              |
| `/room/openim/group-helpers/delete`          | 删除群助手              | 已接入，已补 `roomId/groupHelperId` 防护，未真实执行                         |
| `/room/openim/group-helpers/keywords/add`    | 添加关键词              | 已接入，已补 `roomId/groupHelperId/keyword/value` 防护，未真实执行           |
| `/room/openim/group-helpers/keywords/update` | 更新关键词              | 已接入，已补 `roomId/groupHelperId/keyWordId/keyword/value` 防护，未真实执行 |
| `/room/openim/group-helpers/keywords/delete` | 删除关键词              | 已接入，已补 `roomId/groupHelperId/keyWordId` 防护，未真实执行               |
| `/room/openim/qr/create`                     | 生成群二维码            | 已接入，已补 `roomId` 防护，未真实生成                                       |
| `/room/openim/qr/resolve`                    | 解析群二维码            | 已接入，已有 `code` 防护，未真实解析                                         |
| `/room/openim/qr/join`                       | 二维码入群              | 已接入，已有 `code` 防护，未真实入群                                         |

2026-06-24 补充：群邀请、踢人、转让入口已在选择弹窗和入口按钮层统一 trim `groupID/roomId/userID`，缺少群上下文或目标用户 ID 时不再打开无效选择弹窗或进入业务接口调用链路。群免打扰、群置顶、清空群消息游标现在必须先完成 businessApi 调用，成功后才继续同步 OpenIM SDK 或本地状态。

## 7. 已接入但还没确认的功能点

| 功能点                              | 当前原因                                   |
| ----------------------------------- | ------------------------------------------ |
| 管理员或群主账号下的完整群管理流程  | 需要稳定管理员账号和后端 `roomId` 契约修正 |
| 入群审核同意/拒绝                   | 需要真实业务 `requestId`，且属于 mutation  |
| 特殊成员设置、管理员设置、禁言/解禁 | 需要真实目标成员与用户确认后触发           |
| 群助手添加、删除、关键词增删改      | 已有防护，未触发真实请求                   |
| 群二维码生成、解析、扫码入群        | 已有防护，未触发真实请求                   |
| 群公告编辑和删除                    | 已有防护，未触发真实请求                   |
| 群设置保存、消息销毁设置保存        | 已有 `roomId` 防护，未触发真实请求         |
| 文件真实上传、下载、删除、引用失效  | 属于副作用操作，未主动触发                 |
| 图片/视频业务预览完整链路           | 需要带真实业务 `fileId` 的消息数据         |
| 群消息发送、撤回、收藏、转发、删除  | 发送走 SDK，业务增强未做真实 mutation 验收 |

## 8. 未实现或本期不接

### 8.1 不属于本次 Web 用户端范围

| 接口域                                                                                          | 说明                                |
| ----------------------------------------------------------------------------------------------- | ----------------------------------- |
| `/console/**`                                                                                   | 后台管理或安全管理域                |
| `/pay/**`、`/alipay/**`、`/transfer/**`、`/skTransfer/**`                                       | 支付、转账域                        |
| `/consumeRecord/**`                                                                             | 消费记录域                          |
| `/b/**`、`/liveRoom/**`、`/CustomerService/**`                                                  | 非当前 Web IM 主线                  |
| `/user/goods/**`、`/user/buyOrder/**`                                                           | 商品和订单域                        |
| `/zhuanpan/**`、`/onlineAward/**`                                                               | 活动奖励域                          |
| `/file/cleanup/**`                                                                              | 文件清理策略                        |
| `/file/storage/enterprise-overview`                                                             | 企业级容量概览，非 Web 用户端主线   |
| `/room/openim/status`、`/room/openim/batch-status`                                              | 运维或状态补偿能力                  |
| `/room/openim/mapping`、`/room/openim/resync*`、`/room/openim/copy-room`、`/room/openim/failed` | OpenIM 映射、重同步、失败补偿类能力 |
| `/friends/attention/**`、`/friends/fans/list`、`/friends/friendsAndAttention`                   | 关注/粉丝域，非当前 Web IM 主线     |
| `/friendGroup/**`                                                                               | 好友分组域，当前 UI 主线未覆盖      |
| `/room/openim/red-packet/**`                                                                    | 红包域                              |
| `/room/openim/robot/**`                                                                         | 机器人域                            |

### 8.2 暂缓接入

| 接口                  | 暂缓原因                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `/user/logout`        | Swagger 存在，但缺稳定 `deviceKey/devicekey/telephone(MD5)` 来源；当前继续使用 SDK logout 和本地状态清理 |
| `/room/add`           | 契约仍偏旧系统 `room + text + keys`；当前建群继续走 OpenIM SDK，等待后端明确 Web 建群业务契约            |
| `/user/rtc/get_token` | 源码仍有旧 RTC 封装，但音视频不属于本期 Web 用户端主线                                                   |

## 9. SDK 与 businessApi 分工

### 9.1 OpenIM SDK/API 负责

- 会话列表。
- 好友和群基础同步。
- 单聊、群聊消息实际收发。
- 历史消息基础拉取。
- WebSocket 长连接。
- 本地会话、消息、草稿等 SDK 状态。
- 当前建群仍保留 SDK 路径，等待后端明确 Web 建群业务契约。

### 9.2 businessApi 负责

- 企业号校验、登录、注册、验证码、找回密码、修改密码。
- 系统公告、公告已读。
- 好友资料增强、新朋友、黑名单、好友关系变更。
- 发送前业务校验。
- 聊天记录搜索、收藏、合并消息、撤回增强。
- 文件上传、签名、预览、下载、资源列表、引用关系、容量概览。
- 群公告、群成员、入群审核、在线成员、已读详情、群助手、群权限、群设置等业务管理能力。

## 10. 当前主要风险

1. 群业务 `roomId` 契约未打通。
   多个 `/room/openim/**` 接口 HTTP 层可达，但业务体失败。前端当前传 OpenIM `groupID`，后端需要兼容或提供业务 `roomId` 映射。

2. 写操作未真实验收。
   当前遵守“不主动触发 mutation”的约束，未执行发送、上传、下载、删除、审核、群设置保存、转让、解散、清空等动作。

3. 入群审核接口和 Swagger 存在差异。
   Swagger 中 `status` 可选，但后端不传时曾返回 HTTP 500。前端已统一默认 `status=-1`。

4. 部分接口依赖真实业务 ID。
   入群审核需要 `requestId`，特殊成员需要 `userId`，聊天资源操作需要 `favoriteId/mergeId/fileId/shareId`，群二维码需要 `roomId/code`。

5. 外部服务偶发不稳定。
   业务后端曾出现 HTTP 500，OpenIM WS `ws://47.238.134.161:10001` 偶发握手失败。

## 11. 下一步建议

1. 后端优先兼容 `roomId=OpenIM groupID`，或在群详情、成员接口返回稳定业务 `roomId` 映射。
2. 后端确认 `/room/openim/join-requests` 的 `status` 是否应改为必填，或修复不传 `status` 的 HTTP 500。
3. 提供稳定群主/管理员账号、待处理入群申请、真实业务文件消息，用真实浏览器逐项复测。
4. mutation 按模块单独确认后再测，每次只验证一个操作范围，避免误触发送、删除、审核、清空、转让、解散等高风险动作。
