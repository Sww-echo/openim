# Web 用户端接口接入报告

更新时间：2026-06-25

## 结论

本次接入只覆盖 Web 用户端，不包含后台管理、开放平台、支付、红包、运维补偿、文件清理策略等非 Web 用户端能力。

当前前端主链路已经打通：

- 业务接口统一通过 `/business-api` 代理转发到 `http://47.238.134.161:8092`。
- OpenIM API 使用 `http://47.238.134.161:10002`。
- OpenIM WebSocket 使用 `ws://47.238.134.161:10001`。
- 业务接口鉴权使用登录返回的 `access_token`，随业务请求追加。
- OpenIM SDK 登录使用 `openIM.token`，不和业务 token 混用。
- 企业号固定为 `LOCALTEST001`。
- 后续验收遵循当前约束：不新增/修改单元测试，不运行单元测试、构建、覆盖检查或验证脚本，只用真实浏览器复测。

整体状态：登录、账号、多账号、公告、通讯录、好友资料、聊天搜索、文件资源、通知设置等 Web 用户端主流程已接入并有真实浏览器可用记录。群管理相关入口也已接入，但多数组业务接口当前受后端 `roomId` 契约影响，HTTP 可以返回，但业务体仍返回参数校验失败，等待后端兼容 OpenIM `groupID` 或提供业务 `roomId` 映射后复测。

## 当前统计

| 分类                         | 状态       | 说明                                                                                    |
| ---------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| Swagger 本地文档             | 已保存     | `docs/openim-swagger.json`，最近记录路径数为 844                                        |
| 基础配置与代理               | 已完成     | `/business-api` proxy、业务 token、OpenIM token 分离已完成                              |
| 已验证可用接口               | 约 45 个   | 登录、账号、公告、好友资料、通知设置、聊天搜索、聊天资源、文件资源只读链路              |
| 已接入但后端业务体失败       | 约 8 个    | 主要集中在 `/room/openim/**` 和群文件容量，现象多为 `resultCode=1010101` 或“群ID不合法” |
| 已接入但未真实 mutation 验收 | 约 40+ 个  | 好友变更、黑名单、收藏/转发/撤回、文件上传下载删除、群管理保存/审核等                   |
| 本期不接或暂缓               | 多个接口域 | `/console/**`、支付、红包、运维补偿、旧接口、开放平台、文件清理策略等                   |

## 已接入且已验证可用

### 基础链路

- `/business-api` 代理已生效。
- 业务请求会携带 `access_token`。
- OpenIM SDK/API 请求仍走 `10002`，不走业务服务。
- 真实浏览器已验证登录后进入 `#/chat`。

### 登录与账号

已接入接口：

- `/enterprise/code/validate`
- `/account/login`
- `/user/openim/token`
- `/account/register`
- `/account/code/send`
- `/account/code/verify`
- `/user/password/reset`
- `/user/password/update`

已验证情况：

- 账号 `18888888888 / czp0422+` 曾成功登录。
- `/enterprise/code/validate`、`/account/login` 返回 HTTP 200。
- 登录后 OpenIM SDK 能同步会话、好友、群信息。
- 注册流程已按文档收敛为手机号、固定企业号、昵称、密码、确认密码，不强制短信验证码。
- `invitationCode` 已按用户要求改为非必填。
- 登录返回 token 取业务 `access_token`，OpenIM SDK 取 `openIM.token`。

### 系统公告

已接入接口：

- `/system/announcements`
- `/system/announcements/detail`
- `/system/announcements/unread-count`
- `/system/announcements/read`
- `/system/announcements/read-all`

已验证情况：

- 公告列表、详情、未读数只读链路返回 HTTP 200。
- 页面能展示真实公告数据。
- 标记已读、全部已读属于写操作，保留确认链路，当前未做真实 mutation 验收。

### 通讯录与好友资料

已接入接口：

- `/friends/list`
- `/friends/get`
- `/friends/newFriendListWeb`
- `/friends/queryBlacklistWeb`
- `/user/get`
- `/user/avatar/get`

已验证情况：

- 好友列表可展示真实好友。
- 好友资料卡可展示用户信息。
- 新朋友列表可展示真实申请记录。
- 黑名单列表返回 HTTP 200，当前为空态。
- OpenIM SDK 作为基础数据源，businessApi 作为增强数据源；businessApi 失败时保留 SDK 兜底。

### 用户通知设置

已接入接口：

- `/user/notification/settings`
- `/user/notification/settings/defaults`
- `/user/notification/settings/update`

已验证情况：

- 设置读取返回 HTTP 200。
- 页面展示 Web 端相关开关。
- 更新接口属于写操作，保留二次确认，未触发真实 mutation。

### 聊天搜索与聊天资源

已接入接口：

- `/friend/openim/messages/search`
- `/room/openim/messages/search`
- `/message/favorites`
- `/message/favorites/context`
- `/message/merge/saved`
- `/message/merge/context`
- `/message/merge/detail`
- `/message/merge/preview`
- `/file/resources`
- `/file/resources/detail`
- `/file/reference/status`
- `/file/resources/references`
- `/file/storage/overview`

已验证情况：

- 单聊聊天记录搜索返回 HTTP 200，并能展示搜索结果。
- 收藏消息、已保存合并消息、文件资源列表返回 HTTP 200。
- 真实文件 `chuanxi.jpg` 的文件详情、引用状态、引用关系返回 HTTP 200。
- 只读失败时前端降级为空态或空详情，不再弹业务错误 toast。
- 聊天资源操作已按必填 ID 做按钮层防护：收藏缺 `favoriteId`、合并消息缺 `mergeId`、文件资源缺 `fileId`、群共享文件缺 `shareId` 时，不暴露不可执行的详情、编辑或删除操作。

### 文件基础能力

已接入接口：

- `/file/upload/context`
- `/file/upload`
- `/file/sign`
- `/file/download`
- `/file/preview`
- `/file/compress`
- `/file/compress/async`
- `/file/convert`
- `/file/convert/async`
- `/file/thumbnail`
- `/file/delete`
- `/file/reference/invalidate`

当前状态：

- 上传、签名、下载、预览、压缩、异步压缩、转码、异步转码、缩略图、删除、引用失效等封装已接入。
- 文件资源详情、签名预览等只读路径已有验证记录。
- 上传、下载、删除、引用失效属于副作用操作，未做真实点击验收。

## 已接入但后端业务体暂不可用

以下接口前端入口、代理和请求路径已经接通，真实浏览器中可以发出请求；但当前后端业务体多返回 `resultCode=1010101`、参数校验失败或“群ID不合法”。前端策略是保留入口、发起请求、失败空态兜底，等待后端契约修正后再复测。

### 群详情与成员

- `/room/openim/detail`
- `/room/openim/members`

当前现象：

- 前端传入当前 OpenIM `groupID`，例如 `3413653759` 或 `4011035808`。
- HTTP 状态通常为 200。
- 业务体返回参数校验失败。
- 页面继续使用 OpenIM SDK 或本地数据兜底展示群信息和成员。

### 群公告、入群审核、在线成员

- `/room/openim/notices`
- `/room/openim/join-requests`
- `/room/openim/online-members`

当前现象：

- 普通成员群设置可见入口：群公告、群二维码、在线成员。
- 管理员群 `sg_4011035808` 可见入口：入群审核、特殊成员、群助手、群权限、消息销毁、转让群组、解散群组。
- `/room/openim/online-members?pageIndex=0&pageSize=100&roomId=3413653759` 返回 HTTP 200，但业务体 `resultCode=1010101`。
- `/room/openim/join-requests` 不传 `status` 时后端曾返回 HTTP 500；已在 `getOpenIMJoinRequests` 统一默认 `status=-1`，请求可进入 HTTP 200 路径。
- `/room/openim/join-requests/handle` 按 Swagger 要求必须有 `requestId` 和 `action=approve/reject`；前端已在列表项缺少业务 `requestId` 时禁用同意/拒绝按钮，避免暴露不可执行的审核操作。
- `/room/openim/member/set-special-role` 按 Swagger 要求必须有 `roomId/userId/role`；前端已在特殊成员列表项缺少目标 `userId` 时禁用角色设置按钮，避免暴露不可执行的特殊成员操作。
- 完整带有效 `access_token` 的入群审核 UI 成功态，还需要后端登录接口恢复后继续复测。

### 群共享文件与群容量

- `/room/openim/shares`
- `/file/storage/room-overview`

当前现象：

- 群共享文件请求能发出，页面按空态兜底。
- 群容量概览返回 HTTP 200，但业务体提示“群ID不合法”。
- 根因仍指向后端未兼容 OpenIM `groupID` 作为业务 `roomId`。

### 群消息已读详情

- `/room/openim/message/read-detail`

当前现象：

- 群消息右键菜单已接入“消息已读列表”。
- 请求携带 `roomId`、`clientMsgID`、`serverMsgID`、`seq`。
- HTTP 200 后业务体返回 `1010101`。
- 页面展示空态，浏览器 console error 为 0。

## 已接入但未做真实写操作验收

以下接口会产生远端状态变化、发送、上传、下载、删除、审核或设置变更。当前只确认代码路径、入口和二次确认链路，不主动触发真实 mutation。

### 好友操作

- `/friends/add`
- `/friends/delete`
- `/friends/remark`
- `/friends/update`
- `/friends/update/OfflineNoPushMsg`
- `/friends/blacklist/add`
- `/friends/blacklist/delete`

说明：

- 新朋友列表可读已验证。
- 添加、删除、备注、拉黑、取消拉黑、免打扰、置顶等操作需要用户明确确认后再做真实浏览器验收。

### 消息操作

- `/friend/openim/send-before`
- `/room/openim/send-before`
- `/room/openim/message/recall`
- `/message/favorites/add`
- `/message/favorites/update`
- `/message/favorites/delete`
- `/message/favorites/detail`
- `/message/favorites/merge`
- `/message/merge/save`
- `/message/merge/forward-before`
- `/message/merge/delete`

说明：

- 单聊/群聊实际消息收发仍由 OpenIM SDK 执行。
- businessApi 负责发送前业务校验、撤回增强、收藏、合并消息、转发前置等能力。
- 收藏、合并消息、文件资源和群共享文件操作已按接口必填 ID 控制按钮可用性。
- 撤回、收藏、删除、转发、发送等真实动作未主动触发。

### 群管理操作

- `/room/update`
- `/room/delete`
- `/room/transfer`
- `/room/member/update`
- `/room/member/delete`
- `/room/set/admin`
- `/room/join`
- `/room/openim/notice/update`
- `/room/openim/notice/delete`
- `/room/openim/join-requests/handle`
- `/room/openim/member/set-special-role`
- `/room/openim/member/remark/update`
- `/room/openim/member/remark/delete`
- `/room/openim/member/mute`
- `/room/openim/member/unmute`
- `/room/openim/member/set-offline-no-push`
- `/room/openim/member/set-top`
- `/room/openim/member/clear-message`
- `/room/openim/group-helpers/context`
- `/room/openim/group-helpers`
- `/room/openim/group-helpers/available`
- `/room/openim/group-helpers/add`
- `/room/openim/group-helpers/delete`
- `/room/openim/group-helpers/keywords/add`
- `/room/openim/group-helpers/keywords/update`
- `/room/openim/group-helpers/keywords/delete`
- `/room/openim/qr/create`
- `/room/openim/qr/resolve`
- `/room/openim/qr/join`

说明：

- 群公告、入群审核、特殊成员、群助手、群权限、消息销毁、在线成员、群二维码等入口已接入。
- 查询类入口按只读失败空态处理。
- 入群审核和特殊成员设置已按接口必填 ID 做按钮禁用防护。
- 群成员备注、禁言、解禁、管理员设置已按目标成员 `userID` 做按钮和执行层防护。
- 群二维码生成已按必填 `roomId` 做按钮和执行层防护；二维码解析、扫码入群已按必填 `code` 做按钮和执行层防护。
- 群助手添加/移除、关键词增删改已按 `roomId/helperId/groupHelperId/keyWordId/keyword/value` 做按钮和执行层防护。
- 群公告列表、更新、删除已按 `roomId/noticeId/noticeContent` 做按钮和执行层防护。
- 群设置保存、解散群组、退出群组已按 `roomId/userId` 做执行层防护，缺业务 ID 时不再只更新本地状态或进入确认链路。
- 修改、删除、审核、转让、解散、清空、添加助手、关键词增删改等动作未触发真实 mutation。

## SDK 与 businessApi 分工

### OpenIM SDK/API 负责

- 会话列表。
- 好友和群基础同步。
- 单聊、群聊消息实际收发。
- 历史消息基础拉取。
- WebSocket 长连接。
- 本地会话、消息、草稿等 SDK 状态。
- 建群当前仍保留 SDK 路径，等待后端提供明确 Web 建群业务契约。

### businessApi 负责

- 企业号校验、登录、注册、验证码、找回密码、修改密码。
- 系统公告和公告已读。
- 好友资料增强、新朋友列表、黑名单、好友关系变更。
- 发送前业务校验。
- 聊天记录搜索、收藏、合并消息、消息撤回增强。
- 文件上传、签名、预览、下载、资源列表、引用关系、容量概览。
- 群公告、群成员、入群审核、在线成员、已读详情、群助手、群权限、群设置等业务管理能力。

## 暂未确认的功能点

- 管理员或群主账号下的完整群管理流程。
- 入群审核同意/拒绝，需要真实业务 `requestId`。
- 特殊成员设置、管理员设置、禁言/解禁。
- 群助手添加、删除、关键词增删改已完成必填参数防护，但未触发真实请求验收。
- 群二维码生成、解析、扫码入群已完成必填参数防护，但未触发真实请求验收。
- 群公告编辑和删除已完成必填参数防护，但未触发真实请求验收。
- 群设置保存、消息销毁设置保存已完成 `roomId` 防护，但未触发真实请求验收。
- 文件真实上传、下载、删除、引用失效。
- 图片/视频业务预览在有真实业务 `fileId` 消息上的完整验证。
- 群消息发送、撤回、收藏、转发、删除的真实链路。

## 未实现或本期不接

### 不属于本次 Web 用户端范围

- `/console/**`
- `/pay/**`
- `/alipay/**`
- `/transfer/**`
- `/skTransfer/**`
- `/consumeRecord/**`
- `/b/**`
- `/liveRoom/**`
- `/CustomerService/**`
- `/user/goods/**`
- `/user/buyOrder/**`
- `/zhuanpan/**`
- `/onlineAward/**`
- `/file/cleanup/**`
- `/file/storage/enterprise-overview`
- `/room/openim/status`
- `/room/openim/batch-status`
- `/room/openim/mapping`
- `/room/openim/resync*`
- `/room/openim/copy-room`
- `/room/openim/failed`
- `/friends/attention/**`
- `/friends/fans/list`
- `/friends/friendsAndAttention`
- `/friendGroup/**`
- `/room/openim/red-packet/**`
- `/room/openim/robot/**`

### 暂缓接入

- `/user/logout`
  - Swagger 存在，但缺稳定 `deviceKey/devicekey/telephone(MD5)` 来源。
  - 当前继续使用 SDK logout 和本地账号态清理。

- `/room/add`
  - 当前契约仍是旧系统复杂 `room + text + keys`。
  - 现有建群继续使用 OpenIM SDK。
  - 等后端提供明确 Web 建群契约后再业务化。

- `/user/rtc/get_token`
  - 当前源码仍有旧 RTC 能力。
  - 音视频不属于本期 Web 用户端接入主线。

## 当前主要风险

1. 群业务 `roomId` 契约未打通。
   - 多个 `/room/openim/**` 接口 HTTP 层可达，但业务体失败。
   - 当前前端传的是 OpenIM `groupID`，后端疑似需要业务 `roomId` 或做映射兼容。

2. 入群审核接口实际要求 `status`。
   - Swagger 中 `status` 为可选。
   - 后端当前不传 `status` 时可能 HTTP 500。
   - 前端已统一默认 `status=-1`，但完整 UI 成功态还要带有效 `access_token` 复测。

3. 写操作未做真实验收。
   - 当前按用户要求不主动触发发送、上传、下载、删除、审核、群设置保存等副作用动作。
   - 源码审计确认主要写入口有二次确认，但远端成功态仍需后续逐项确认。

4. 业务后端偶发 500。
   - 最近曾观察企业号校验接口和 `/business-api/user/openim/token` 返回 HTTP 500 且响应体为空。
   - 该问题影响完整 UI 登录后复测，不属于前端代理配置问题。

5. OpenIM WS 连接不稳定。
   - `ws://47.238.134.161:10001` 偶发握手失败。
   - 会影响 SDK 同步状态和会话体验，需要与后端服务状态一起排查。

## 下一步建议

1. 后端优先兼容 `roomId=OpenIM groupID`，或在群详情/成员接口返回稳定业务 `roomId` 映射。
2. 后端确认 `/room/openim/join-requests` 的 `status` 是否应改为必填，或修复不传 `status` 的 HTTP 500。
3. 提供稳定群主/管理员账号和测试群数据，用于复测群管理入口。
4. 提供可操作测试数据：待处理入群申请、真实群公告、真实业务文件消息、可验证的群文件资源。
5. 写操作按模块逐项验收，每次只确认一个操作范围，避免误触发送、删除、审核、清空、转让、解散等高风险动作。
