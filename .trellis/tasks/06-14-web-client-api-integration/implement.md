# 接入拆分

## 2026-06-21 聊天资源上下文与容量概览只读复测

- [x] 真实浏览器进入 `#/chat/si_10000003_10000021`，打开聊天资源弹窗。
- [x] “收藏消息”列表请求 `/business-api/message/favorites?pageIndex=0&pageSize=50&deleted=0` 返回 HTTP 200；点击“收藏上下文”后 `/business-api/message/favorites/context` 返回 HTTP 200，并展示收藏元数据。
- [x] “已保存合并消息”列表请求 `/business-api/message/merge/saved?pageIndex=0&pageSize=50&deleted=0` 返回 HTTP 200；点击“合并上下文”后 `/business-api/message/merge/context` 返回 HTTP 200，并展示合并转发/保存元数据。
- [x] “文件资源”列表请求 `/business-api/file/resources?pageIndex=0&pageSize=50&deleted=0` 返回 HTTP 200，展示两条真实 `chuanxi.jpg`；点击“容量概览”后 `/business-api/file/storage/overview` 返回 HTTP 200，并展示当前账号容量、quota 和 recentUploads。
- [x] 网络侧未出现 `/file/download`、`/file/delete`、`/file/reference/invalidate`、收藏/合并删除或保存等写操作；Playwright console error/warning 复查均为 0。
- [x] 详细记录见 `2026-06-21-chat-resource-context-overview-readonly-verify.md`；本轮未运行单元测试、构建或验证脚本，未触发真实 mutation 或下载。

## 2026-06-21 图片视频预览只读兜底日志降级

- [x] `MediaMessageRender` 图片消息业务预览 URL 读取失败由 `console.warn` 降为 `console.debug`，继续回退 OpenIM SDK 图片 URL。
- [x] `VideoMessageRender` 视频消息业务预览 URL 读取失败由 `console.warn` 降为 `console.debug`，继续回退 OpenIM SDK 视频 URL。
- [x] 文件下载、消息右键下载、收藏、撤回、删除等用户主动操作仍保留确认或错误提示。
- [x] 真实浏览器当前 `#/contact/myGroups` 页面正常渲染 2 个群；当前页无图片/视频消息节点，未触发真实媒体预览读取。控制台剩余错误为已知 OpenIM WS 握手失败，非本轮业务预览问题。
- [x] 详细记录见 `2026-06-21-media-preview-readonly-debug.md`；本轮未运行单元测试、构建或验证脚本，未触发真实 mutation 或下载。

## 2026-06-21 联系人与会话只读兜底日志降级

- [x] `src/store/contact.ts` 中 businessApi 好友列表、黑名单合并失败由 `console.warn` 降为 `console.debug`；OpenIM SDK 基线失败仍保留用户级错误提示。
- [x] `src/store/conversation.ts` 中 businessApi 群详情、当前成员合并失败由 `console.warn` 降为 `console.debug`；OpenIM SDK 基线失败仍保留用户级错误提示。
- [x] 真实浏览器刷新 `#/contact/myGroups` 后页面正常展示 2 个群，`/business-api/friends/list`、`/business-api/friends/queryBlacklistWeb`、`/business-api/friends/newFriendListWeb`、`/business-api/room/openim/join-requests` 等请求继续返回 HTTP 200。
- [x] 详细记录见 `2026-06-21-contact-conversation-readonly-debug.md`；本轮未运行单元测试、构建或验证脚本，未触发真实 mutation。

## 2026-06-21 系统公告与通知设置只读兜底

- [x] `SystemAnnouncements` 的列表和详情读取失败已改为只读空态/当前项兜底 + `console.debug`，不再对读取失败弹用户级错误 toast。
- [x] 系统公告标已读、全部标已读仍保留确认和错误提示；本轮未触发 `/system/announcements/read` 或 `/system/announcements/read-all`。
- [x] `PersonalSettings` 的通知设置读取失败已改为隐藏通知设置分组 + `console.debug`，不再因为只读读取失败打断设置弹窗。
- [x] 通知设置更新仍保留二次确认和错误提示；本轮未触发 `/user/notification/settings/update`。
- [x] 真实浏览器复测确认 `/business-api/system/announcements`、`/business-api/system/announcements/unread-count`、`/business-api/system/announcements/detail`、`/business-api/user/notification/settings` 均返回 HTTP 200。
- [x] 详细记录见 `2026-06-21-announcement-notification-readonly-fallback.md`；本轮未运行单元测试、构建或验证脚本，未触发真实 mutation。

## 2026-06-21 群设置业务入口只读复测

- [x] 真实 Chrome 使用 `18888888888 / czp0422+` 进入群会话 `#/chat/sg_4011035808`，打开群设置抽屉，只读复测群公告、入群审核、特殊成员、群助手、在线成员入口。
- [x] 已确认只读请求走 `/business-api` proxy：`/room/openim/notices`、`/room/openim/join-requests`、`/room/openim/special-members`、`/room/openim/group-helpers/context`、`/room/openim/group-helpers`、`/room/openim/group-helpers/available`、`/room/openim/online-members` 均返回 HTTP 200。
- [x] 发现只读面板在后端业务体返回 `1010101` 或 `群ID格式不正确` 时会调用 `feedbackToast({ error })`，导致浏览器出现 `src/utils/common.ts` 的 `console.error`。
- [x] 已将 `GroupBusinessEntrances` 和 `GroupHelperPanel` 的只读加载失败改为置空 + `console.debug` 兜底；mutation 分支仍保留二次确认和 `feedbackToast`。
- [x] 刷新后再次打开群公告确认请求仍发出，且未再新增 `src/utils/common.ts` 的 console error；截图保存到 `output/playwright/chrome-group-settings-business-readonly-20260621.png`。
- [x] 详细记录见 `2026-06-21-group-settings-readonly-panels.md`；本轮未运行单元测试、构建或验证脚本，未触发任何真实 mutation。

## 2026-06-21 群通知 businessApi 列表兜底

- [x] 通讯录「群通知」列表在 OpenIM SDK 申请列表基础上补充 `/room/openim/join-requests` 只读业务列表尝试，不替换 SDK 基线数据。
- [x] 当前按 `groupList` 遍历群并传入 `roomId=groupID`、`status=-1`、`pageIndex=0`、`pageSize=100`，返回数据归一化为 `GroupApplicationItem` 后与 SDK 列表合并。
- [x] businessApi 失败时降级为 `console.debug` 并保留 SDK 兜底；同意/拒绝 mutation 链路未扩大，仍依赖可解析的业务 `requestId` 和原有确认流程。
- [x] 真实 Chrome 只读复测 `#/contact/groupNotifications`：页面正常空态；`/business-api/room/openim/join-requests` 对 `roomId=4011035808`、`roomId=3413653759` 均发出且 HTTP 200；后端业务体仍返回 `resultCode=1010101`，属于 OpenIM `groupID` 与 business `roomId` 契约不兼容。
- [x] Playwright console level 复查 0 errors、0 warnings；截图保存到 `output/playwright/chrome-group-notifications-business-list-fallback-20260621.png`；详细记录见 `2026-06-21-group-notifications-business-list-fallback.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未触发同意/拒绝、发送、上传、下载、删除、审核、群设置保存等真实 mutation。

## 原则

- 只接入 Web 用户端。
- 接口封装集中在 `src/api/**`，页面组件不直接拼业务字段。
- 业务 API 走 `/business-api` proxy。
- 业务 token 和 OpenIM token 分开使用。
- OpenIM SDK 已提供的会话和消息收发能力不重复造业务 API。
- Web 和 Electron dev 配置统一走 `/business-api` proxy，避免业务接口跨域。

## 阶段 1：请求层和登录基线

- [x] 确认 `createAxiosInstance` 对业务接口默认使用业务 token，不误带 OpenIM token。
- [x] `/business-api` proxy 覆盖 `vite.config.ts`、`vite.legacy.config.ts`、`vite.web.config.ts`。
- [x] 保留响应兼容：旧格式 `errCode === 0`，新格式 `resultCode === 1`。
- [x] 登录响应统一 normalize：`access_token` -> `chatToken`，`openIM.token` -> `imToken`，`openIM.userID/userId` -> `userID`。
- [x] 新增或完善企业号验证 API：`/enterprise/code/validate`。
- [x] 登录页和注册页新增固定企业号展示；当前企业号临时写死为 `LOCALTEST001`，输入框仅展示且不可编辑，登录、注册、发送验证码和校验验证码统一使用该固定企业号；最新注册流程不再触发短信验证码发送或校验。
- [x] `/account/code/send`、`/account/code/verify` 按 Swagger 参数定义改为 query 参数传递，并补充 `telephone`；按用户最新联调口径，`invitationCode` 非必填，当前实现固定传 `enterpriseCode: "LOCALTEST001"`，不再默认传 `invitationCode`。
- [x] 修改密码封装从 Swagger 不存在的 `/account/password/change` 迁移到 `/user/password/update`，按文档通过 query 传 `oldPassword/newPassword`；业务 `access_token` 继续由统一请求层追加。
- [x] 忘记密码发送验证码和校验验证码的 `usedFor` 已统一为修改密码场景 `2`；验证码校验响应必须返回 `serial/deviceSerial/deviceID/deviceId` 之一才进入新密码步骤，重置密码走 Swagger `/user/password/reset`，并按 query 传 `randcode/telephone/newPassword/serial`。
- [x] 忘记密码表单按 Swagger “验证码当前阶段仅支持手机号”收敛为手机号流程，不再跟随登录页 email 模式展示邮箱找回，避免 `/account/code/send` 缺少必填 `phoneNumber/telephone`。
- [x] 注册表单按 Swagger `/account/register` “注册无需短信验证码”收敛为直接注册流程，页面只保留手机号、固定企业号、昵称、密码和确认密码，不再触发 `/account/code/send` 或 `/account/code/verify`。
- [x] 登录页验证码登录入口按 Swagger “验证码当前阶段仅支持手机号”收敛：email 登录模式强制密码登录且不展示“验证码登录”，手机号登录模式保留验证码登录并保证发送验证码带 `areaCode/phoneNumber/telephone`。
- [x] 登录页账号入口按 Swagger `/account/login` “当前阶段使用手机号和密码登录”收敛为手机号登录，不再展示 email 登录 Tab，避免登录请求携带后端当前阶段未声明的邮箱字段。
- [x] 找回密码 reset 接口纳入请求层公开路径：最新 Swagger 支持的 `/user/password/reset` 不自动追加业务 `access_token`；历史 `/account/password/reset` 已移除，不再作为兜底路径。
- [x] OpenIM token 刷新接入 SDK 过期事件：`OnUserTokenExpired`、`OnUserTokenInvalid` 和 705 连接失败时先调用 `/user/openim/token`，刷新当前 IM token 和已保存账号后重试 SDK 登录；刷新失败才回退到登录过期退出。
- [x] 明确 IP 限制和宵禁错误码处理入口：Web 用户端不直接接 `/console/**/security/**`，统一展示 `/account/login` 失败响应里的 `errMsg/resultMsg/msg/message`。

## 阶段 2：多账号和数据隔离

- [x] 设计 Web 多账号本地存储结构。
- [x] 保存账号列表、当前账号、业务 token、OpenIM token、OpenIM userID。
- [x] 一键切换账号时重置当前 SDK 登录态并重新登录。
- [x] 隔离每个账号的本地缓存和会话数据读取入口：提供 `getAccountScopedKey`，切换时清空当前 store 并按目标账号 profile 重新启动。
- [x] 聊天输入草稿使用账号作用域缓存键保存：`IM_ACCOUNT:${accountKey}:CHAT_DRAFT:${conversationID}`，避免不同账号同一会话 ID 下草稿串读；发送文本消息后清理对应草稿。

## 阶段 3：聊天接口补充

- [x] 单聊发送前校验：`/friend/openim/send-before`。
- [x] 群聊发送前校验：`/room/openim/send-before`。
- [x] 发送链路接入发送前校验：校验通过后才调用 OpenIM SDK `sendMessage`。
- [x] 文本发送链路根据发送前校验结果决定是否清空输入：`send-before` 被后端拒绝时不调用 SDK、不插入本地消息，并保留当前输入内容。
- [x] 单聊聊天记录搜索：`/friend/openim/messages/search`。
- [x] 群聊聊天记录搜索：`/room/openim/messages/search`。
- [x] 聊天头部新增聊天记录搜索入口，单聊/群聊分别调用 `/friend/openim/messages/search`、`/room/openim/messages/search`。
- [x] 聊天记录搜索分页对齐 Swagger：`pageIndex` 从 0 开始，`pageSize` 不超过文档上限。
- [x] 群消息撤回：`/room/openim/message/recall`。
- [x] 消息右键菜单接入：文本复制、本地删除、收藏 `/message/favorites/add`、群消息业务撤回 `/room/openim/message/recall`，撤回成功后同步 SDK revoke。
- [x] 合并消息转发相关接口按产品入口接入。
- [x] 消息收藏和合并转发前置接口统一优先读取消息对象或 `message.ex` 中的审计 `auditId/messageAuditId/msgAuditId`，缺失时才使用 `serverMsgID/clientMsgID` 兜底。

## 阶段 4：文件上传下载和预览

- [x] 上传上下文：`/file/upload/context`。
- [x] 文件上传：`/file/upload`。
- [x] 文件签名：`/file/sign`。
- [x] 文件下载：`/file/download`。
- [x] 文件预览：`/file/preview`。
- [x] 图片压缩和视频转换按发送流程接入：`/file/compress`、`/file/convert`。
- [x] 图片消息发送链路先走业务文件接口：`/file/upload/context` -> `/file/upload` -> `/file/compress`，并把业务文件 `fileId` 写入 `message.ex`。
- [x] 文件上传场景参数对齐 Swagger 枚举：图片传 `image`，单聊普通文件/视频传 `common`，群文件/视频传 `room_share`；消息扩展中保留内部 `image/video/file` 类型和后端 `uploadScene`。
- [x] 图片、视频和普通文件发送入口已收敛为“确认后再上传并发送”：选择文件后先展示确认框，只有确认框 `OK` 后才进入业务上传、压缩/转码、SDK 消息创建和 `sendMessage`；取消确认只结束本地 Upload 请求状态，不触发远端上传或发送。
- [x] 图片消息渲染优先读取业务文件扩展，走 `/file/sign` + `/file/preview` 获取预览，失败回退 OpenIM SDK 原始图片地址。
- [x] 普通文件发送链路先走业务文件接口：`/file/upload/context` -> `/file/upload`，并使用 OpenIM SDK `createFileMessageByFile` 发送。
- [x] 视频发送链路先走业务文件接口：`/file/upload/context` -> `/file/upload` -> `/file/convert`，并使用 OpenIM SDK `createVideoMessageByFile` 发送。
- [x] 文件消息渲染新增下载入口，优先走 `/file/sign` + `/file/download`，失败前保留 OpenIM SDK URL 回退。
- [x] 视频消息渲染优先走 `/file/sign` + `/file/preview` 获取业务预览，失败回退 OpenIM SDK 视频地址。
- [x] 图片、视频、文件消息右键菜单新增下载入口，优先使用业务文件 `fileId` 签名下载。
- [x] 公共上传工具 `src/utils/imCommon.ts` 已用于个人头像、群头像等入口；上传时优先走 `/file/upload/context` + `/file/upload` 获取业务文件 URL，失败时再回退 OpenIM SDK `uploadFile`。

## 阶段 5：群管理

- [x] 群详情：`/room/openim/detail`。
- [x] 群成员：`/room/openim/members`。
- [x] 群成员列表页面从 OpenIM SDK 切换到 `/room/openim/members`，保留字段归一化以兼容当前 UI。
- [x] 在线成员：`/room/openim/online-members`。
- [x] 群成员、群公告、入群审核、在线成员、特殊成员列表分页对齐 Swagger：`pageIndex` 从 0 开始，群成员 `pageSize` 不超过 100。
- [x] 群公告列表、修改、删除。
- [x] 入群审核列表和处理。
- [x] 已读详情能力查询。
- [x] 群免打扰、置顶、清空消息游标。
- [x] 群设置抽屉新增当前用户群免打扰、群置顶、清空聊天记录入口，分别接入 `/room/openim/member/set-offline-no-push`、`/room/openim/member/set-top`、`/room/openim/member/clear-message`，并同步 OpenIM SDK 会话状态或本地消息列表。
- [x] 群设置抽屉新增特殊成员入口，接入 `/room/openim/special-members`、`/room/openim/member/set-special-role`，支持群主/管理员查看并设置普通/隐身/监控角色。
- [x] 群权限设置和消息销毁设置：已封装并接入 `/room/update`，覆盖入群验证、已读展示、成员可见、成员加好友、成员邀请、文件上传、会议/讲课、消息过期销毁、阅后即焚等核心开关。
- [x] 群消息销毁设置补齐数值项和提示开关：`messageDestroyDays`、`messageDestroyNoticeEnabled`、`burnAfterReadSeconds`、`burnAfterReadNoticeEnabled` 均通过 `/room/update` 接入群设置；数值保存前弹二次确认。
- [x] 群管理接口封装按 Swagger 必填字段收紧类型：特殊成员设置必须传 `roomId/userId/role`，群成员备注必须传 `roomId/targetUserId`，入群审核处理必须传 `requestId` 和 `action/agree`，群公告更新必须传 `noticeId` 和 `content/noticeContent`。
- [x] 群免打扰、群置顶封装按实际状态变更收紧类型，分别强制调用处传 `offlineNoPushMsg` 和 `top`。
- [x] “允许添加群成员为好友”开关同步 `/room/update` 的 `allowSendCard` 字段，避免只更新 OpenIM SDK 权限而未写业务配置。
- [x] 群设置抽屉新增群公告、入群审核、在线成员入口，分别接入 `/room/openim/notices`、`/room/openim/notice/update`、`/room/openim/notice/delete`、`/room/openim/join-requests`、`/room/openim/join-requests/handle`、`/room/openim/online-members`。
- [x] 群消息右键菜单新增已读详情入口，接入 `/room/openim/message/read-detail`。
- [x] 群消息已读详情从原始 JSON 弹窗升级为通用已读/未读成员列表展示，兼容常见 `readUsers/readMembers/unreadUsers/unreadMembers` 等字段，无法识别时保留原始响应兜底。
- [x] 群成员列表新增管理员/群主可用的成员备注编辑入口，接入 `/room/openim/member/remark/update`，保存成功后刷新当前列表显示。

## 阶段 6：资料和好友接口替换

- [x] 排查 `/user/find/full`、`/user/search/full` 使用点。
- [x] 如接口已废弃，替换为 `/friends/get`、`/friends/list`、`/room/member/get` 等文档内接口。
- [x] 统一用户资料字段 normalize，避免页面依赖多个后端字段形态。
- [x] 用户资料更新字段对齐 Swagger：`faceURL/headimgurl`、`gender/sex`、`birth/birthday`、`allowAddFriend/friendsVerify`、`allowBeep/isTyping`、`allowVibration/isVibration`、`globalRecvMsgOpt/chatSyncTimeLen` 统一映射；资料响应补充兼容 `headimgurl`、`phone`。
- [x] 补齐 Web 联系人常用业务接口封装：`/friends/update`、`/friends/add`、`/friends/delete`、`/friends/queryBlacklistWeb`、`/friends/blacklist/add`、`/friends/blacklist/delete`、`/friends/newFriendListWeb`。
- [x] 好友备注入口从只调用 OpenIM SDK 改为先调用业务 `/friends/remark`，再同步 SDK `updateFriends`，避免业务侧备注不同步。
- [x] 联系人 store 获取好友列表时合并业务 `/friends/list` 返回数据，保留 OpenIM SDK 列表作为基线。
- [x] 用户卡片查看好友资料时合并业务 `/friends/get` 返回详情，失败时保留原 SDK/用户资料展示。
- [x] 新朋友列表加载时合并业务 `/friends/newFriendListWeb` 返回数据，好友申请处理仍由 OpenIM SDK 负责。
- [x] 好友搜索、Web 黑名单、新朋友列表分页对齐 Swagger：`/friends/page`、`/friends/queryBlacklistWeb`、`/friends/newFriendListWeb` 均从 `pageIndex: 0` 开始。
- [x] 接受好友申请时先调用业务 `/friends/add`，成功后再同步 OpenIM SDK `acceptFriendApplication`，保证业务接口作为好友关系变更入口。
- [x] 拒绝好友申请仍由 OpenIM SDK `refuseFriendApplication` 处理；当前 Swagger 仅提供 `/friends/add`、`/friends/delete`、`/friends/newFriendListWeb` 等关系接口，没有好友申请拒绝/处理业务接口。
- [x] 解除好友时先调用业务 `/friends/delete`，再同步 OpenIM SDK `deleteFriend`。
- [x] 黑名单列表加载时合并业务 `/friends/queryBlacklistWeb`；拉黑和取消拉黑分别接入 `/friends/blacklist/add`、`/friends/blacklist/delete` 后再同步 OpenIM SDK。
- [x] 单聊设置新增免打扰和置顶开关，接入 `/friends/update/OfflineNoPushMsg` 并同步 OpenIM SDK `setConversationRecvMessageOpt`、`pinConversation`。
- [x] 单聊免打扰/置顶封装按 Swagger 必填参数收紧类型，强制调用处传 `offlineNoPushMsg`。
- [x] 单聊设置新增聊天记录保存时长入口，接入 `/friends/update` 的 `chatRecordTimeOut` 字段，使该接口进入实际 Web 设置流程。

## 阶段 7：消息收藏、合并消息和文件资源入口

- [x] 提取 `src/utils/businessPayload.ts`，统一处理业务响应中 `data/result/obj` 包裹、列表字段和常见文本/ID 字段读取，复用到聊天搜索、群业务入口和聊天资源弹窗。
- [x] 聊天记录搜索结果新增合并消息预览和保存入口，分别接入 `/message/merge/preview`、`/message/merge/save`，使用搜索结果中的审计 `id/auditId` 作为 `auditIds`。
- [x] 聊天记录搜索结果新增收藏入口，使用搜索结果中的审计 `id/auditId` 调用 `/message/favorites/add`，优先走 Swagger 推荐的消息审计 ID。
- [x] 聊天头部新增聊天资源入口，Tab 覆盖收藏消息、已保存合并消息、文件资源。
- [x] 收藏消息 Tab 接入 `/message/favorites`、`/message/favorites/detail`、`/message/favorites/delete`。
- [x] 已保存合并消息 Tab 接入 `/message/merge/saved`、`/message/merge/detail`、`/message/merge/delete`。
- [x] 文件资源 Tab 接入 `/file/resources`、`/file/resources/detail`、`/file/reference/status`、`/file/delete`，下载动作复用业务文件签名下载链路。
- [x] 文件资源列表分页对齐 Swagger：`pageIndex` 从 0 开始。
- [x] 文件签名下载/预览链路按 Swagger 必填字段收紧：`/file/sign` 必须传 `fileId`，`/file/download`、`/file/preview` 只有在签名响应包含 `fileId/expiresAt/signature` 时才继续请求。

## 验证

- [x] 2026-06-14 增量验证：群公告入口按 Swagger 必填字段修正为编辑已有公告，`/room/openim/notice/update` 必带 `noticeId`；消息转发选择器在 `FORWARD_MESSAGE` 场景开放群组目标，`/message/merge/forward-before` 按 `single/group` 传 `targetType/targetId`。`npx eslint --quiet "src/api/group.ts" "src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx" "src/pages/common/ChooseModal/index.tsx" "src/pages/common/ChooseModal/ChooseBox/index.tsx"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过；全量 `npx tsc --noEmit --pretty false` 仍失败但剩余错误位于既有 `DraggableModalWrap`、`RtcCallModal`、`store/conversation.ts`。
- [x] 2026-06-14 增量验证：收紧群详情业务响应拆包类型，修复 Draggable/LiveKit 第三方组件 JSX 类型适配后，全量 `npx tsc --noEmit --pretty false` 通过；`npx eslint --quiet "src/store/conversation.ts" "src/components/DraggableModalWrap/index.tsx" "src/pages/common/RtcCallModal/index.tsx" "src/pages/common/RtcCallModal/RtcControl.tsx" "src/pages/common/RtcCallModal/RtcLayout.tsx"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：消息转发链路不再只调用 `/message/merge/forward-before` 后丢弃响应；现在会从后端响应中归一化 OpenIM SDK message payload 并优先发送，未返回可用 payload 时回退 SDK `createForwardMessage`。`npx eslint --quiet "src/pages/common/ChooseModal/index.tsx"` 通过；`npx tsc --noEmit --pretty false` 通过。

- [x] `npm run build -- --config vite.web.config.ts`
- [x] 新增/触碰文件 lint：`npx eslint --quiet <touched files>`
- [x] Trellis Web 范围静态覆盖检查：`npm run verify:web-api-coverage`，63 个期望业务路径均已在 `src/api/**` 封装，且三个 Vite 配置均接入业务代理。
- [x] 2026-06-14 增量验证：文件链路、聊天记录搜索、群成员列表、群公告/审核/在线成员入口、消息菜单相关触碰文件 `npx eslint --quiet` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：普通文件/视频发送入口、文件下载渲染、视频预览渲染和附件右键下载相关触碰文件 `npx eslint --quiet` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过；全量 `npx tsc --noEmit --pretty false` 仍失败但错误位于既有文件，未指向本次新增文件。
- [x] 2026-06-14 增量验证：好友备注、群成员备注相关触碰文件 `npx eslint --quiet` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过；全量 `npx tsc --noEmit --pretty false` 剩余错误位于既有非本轮文件。
- [x] 2026-06-14 增量验证：特殊成员、群免打扰、群置顶、清空群消息游标相关触碰文件 `npx eslint --quiet` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过；全量 `npx tsc --noEmit --pretty false` 剩余错误位于既有非本轮文件。
- [x] 本地浏览器刷新 `http://127.0.0.1:7777/index.html#/login`，登录页可渲染，控制台 error 为 0；2026-06-14 本轮文件/视频链路、好友备注/群成员备注、特殊成员和当前用户群设置变更后复查仍通过。
- [x] 2026-06-14 增量验证：聊天资源弹窗、合并消息预览/保存和通用 payload 工具相关触碰文件 `npx eslint --quiet` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过；本地浏览器刷新登录页控制台 error 为 0；全量 `npx tsc --noEmit --pretty false` 仍失败但错误位于既有文件，未指向本轮新增文件。
- [x] 2026-06-14 增量验证：联系人/好友业务接口实际接入相关触碰文件 `npx eslint --quiet` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过；本地浏览器刷新登录页控制台 error 为 0；全量 `npx tsc --noEmit --pretty false` 仍失败但错误位于既有文件，未指向本轮新增/触碰的联系人文件。
- [x] 2026-06-14 增量验证：单聊聊天记录保存时长入口接入 `/friends/update`；`npx eslint --quiet "src/pages/chat/queryChat/SingleSetting/index.tsx"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：OpenIM token 过期刷新链路接入 `/user/openim/token`；`npx eslint --quiet "src/api/login.ts" "src/utils/storage.ts" "src/layout/useGlobalEvents.tsx"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：群消息已读详情弹窗改为已读/未读列表展示；`npx eslint --quiet "src/pages/chat/queryChat/MessageItem/index.tsx"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：企业号/邀请码校验进入登录、注册和验证码流程，验证码接口参数位置对齐 Swagger query 定义；`npx eslint --quiet "src/api/login.ts" "src/pages/login/LoginForm.tsx" "src/pages/login/RegisterForm.tsx" "src/pages/login/enterpriseCode.ts"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 浏览器复查：刷新 `http://127.0.0.1:7777/index.html#/login` 后登录页可渲染企业号/邀请码输入，控制台 error 为 0。
- [x] 2026-06-14 增量验证：聊天输入草稿接入账号作用域缓存；`npx eslint --quiet "src/utils/storage.ts" "src/pages/chat/queryChat/ChatFooter/index.tsx"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：群成员加好友权限开关补传 `/room/update` 的 `allowSendCard`；`npx eslint --quiet "src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：发送前校验失败时文本输入不清空；`npx eslint --quiet "src/pages/chat/queryChat/ChatFooter/useSendMessage.ts" "src/pages/chat/queryChat/ChatFooter/index.tsx" "src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx"` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：聊天搜索结果收藏改为直接使用审计 `id/auditId` 调 `/message/favorites/add`；文件上传传参从内部 `video/file` 场景改为 Swagger 定义的 `common/image/room_share`，发送前校验失败后的文件引用失效 reason 收紧为 `message_destroy`。`npx eslint --quiet "src/api/file.ts" "src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx" "src/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage.ts" "src/pages/chat/queryChat/ChatHeader/ChatMessageSearch.tsx"` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：聊天搜索、群成员/公告/审核/在线/特殊成员、文件资源列表分页按 Swagger 统一为 0 起始；群成员刷新页大小从 500 收紧到文档上限 100，后续页继续走滚动加载。`npx eslint --quiet "src/api/chat.ts" "src/api/file.ts" "src/api/group.ts" "src/hooks/useGroupMembers.ts" "src/pages/chat/queryChat/ChatHeader/ChatMessageSearch.tsx" "src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx"` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：用户资料更新补齐 `allowBeep -> isTyping` 映射，资料展示归一化补充 `headimgurl`、`phone` 兼容；`npx eslint --quiet "src/api/friend.ts"` 通过；`npx tsc --noEmit --pretty false` 通过。
- [x] 2026-06-14 增量验证：提取通用审计 ID 读取逻辑，右键收藏 `/message/favorites/add`、合并转发前置 `/message/merge/forward-before` 和聊天搜索操作优先使用 `auditId/messageAuditId/msgAuditId`；转发链路缺失可用 ID 时不向后端传 `"undefined"`，直接回退 SDK `createForwardMessage`。`npx eslint --quiet "src/utils/businessPayload.ts" "src/pages/chat/queryChat/MessageItem/index.tsx" "src/pages/common/ChooseModal/index.tsx" "src/pages/chat/queryChat/ChatHeader/ChatMessageSearch.tsx" "src/api/friend.ts"` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 增量验证：按 Swagger 必填字段收紧群特殊角色、群成员备注、入群审核处理、群公告更新、文件签名下载/预览的封装类型，并阻止文件签名缺少 `expiresAt/signature` 时继续请求下载/预览接口。`npx eslint --quiet "src/api/group.ts" "src/api/file.ts" "src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx"` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run verify:web-api-coverage` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 收尾复核：同步 `research.md` 的 Swagger 必填字段和文件签名保护说明后，重新执行 `npx eslint --quiet "src/api/group.ts" "src/api/file.ts" "src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx"`、`npx tsc --noEmit --pretty false`、`npm run verify:web-api-coverage`、`npm run build -- --config vite.web.config.ts` 均通过；覆盖脚本显示 63 个 Web 端期望业务路径无 `missingInSwagger`、无 `missingInSource`、无后台/支付/运营类排除路径误接入，三个 Vite 配置均保留 `/business-api` 代理。
- [x] 2026-06-14 增量验证入口：新增 `npm run verify:web-api-e2e`，默认 dry-run 不发送远端请求，只输出真实验收所需账号、好友、群、文件、消息数据；设置 `OPENIM_E2E_RUN_REMOTE=1` 且提供环境变量后，可执行登录、多账号 userID 隔离、好友/群/文件只读业务接口检查。`npm run verify:web-api-e2e` dry-run 通过；`node --check "scripts/verify-web-api-e2e.mjs"` 通过；`npm run verify:web-api-coverage` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 UI 验收入口：新增 `npm run verify:web-api-ui` 和 `e2e/web-api-ui.spec.ts`，默认跳过，不发送远端请求；设置 `OPENIM_E2E_RUN_UI=1`、`OPENIM_E2E_WEB_URL`、`OPENIM_E2E_ACCOUNT1_PHONE`、`OPENIM_E2E_ACCOUNT1_PASSWORD` 后，可通过 Web 登录表单请求 `/account/login` 并断言跳转 `#/chat`。为保证 e2e 文件可 lint，新增 `tsconfig.eslint.json` 并将 ESLint `parserOptions.project` 指向该配置，主 `tsc --noEmit` 范围不变。`npm run verify:web-api-ui` 默认 skip 通过；`npx eslint --quiet "e2e/web-api-ui.spec.ts"` 通过；`npx eslint --quiet "src/api/group.ts" "src/api/file.ts" "src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx"` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run verify:web-api-coverage` 通过；`npm run verify:web-api-e2e` dry-run 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 静态行为守护：新增并扩展 `npm run verify:web-api-behavior`，检查 22 条关键不变量：登录成功保存 profile 后再跳转聊天页、登录接口使用后端错误处理、`resultCode` 失败响应会 reject、后端 `errMsg/resultMsg/msg/message` 文本会透传展示、UI 登录验收断言 `/account/login` 与 `#/chat` 跳转、账号作用域缓存键包含当前账号、多账号切换重写业务 token/OpenIM token/userID、切换账号先退出 SDK 后切 profile、切换账号清空联系人/会话内存 store 后刷新进入聊天页、退出登录清空 profile 和内存 store 后回登录页、联系人新朋友/黑名单列表从 Swagger `pageIndex: 0` 开始、聊天草稿只在发送启动后清理、单聊/群聊 `send-before` 位于 `IMSDK.sendMessage` 前、`send-before` 失败未本地插入时返回 false、文件签名下载/预览必须有 `fileId/expiresAt/signature`。`npm run verify:web-api-behavior` 通过；`node --check "scripts/verify-web-api-behavior.mjs"` 通过；`npm run verify:web-api-coverage` 通过；`npm run verify:web-api-contract` 通过；`npm run verify:web-api-e2e` dry-run 通过；`npm run verify:web-api-ui` 默认 skip 通过；`npx tsc --noEmit --pretty false` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 远端 mutation 验收入口扩展：`npm run verify:web-api-e2e` 新增 `OPENIM_E2E_RUN_MUTATION=1` 显式变更模式；默认 dry-run 和只读模式不发变更请求。提供 `OPENIM_E2E_UPLOAD_FILE_PATH` 时可走 `/file/upload/context`、multipart `/file/upload`、`/file/sign`、`/file/preview`、`/file/download`，可选 `OPENIM_E2E_FETCH_FILE_BYTES=1` 实际拉取预览/下载字节；提供群 mutation 环境变量后可验证 `/room/openim/member/set-offline-no-push`、`/room/openim/member/set-top`、`/room/openim/member/remark/update`、`/room/openim/member/set-special-role`、`/room/openim/notice/update`、`/room/openim/join-requests/handle`，清空消息游标需同时设置 `OPENIM_E2E_GROUP_CLEAR_MESSAGE=1` 和 `OPENIM_E2E_CONFIRM_CLEAR_MESSAGE=1`。`npm run verify:web-api-e2e` dry-run 通过；`node --check "scripts/verify-web-api-e2e.mjs"` 通过；`npm run verify:web-api-behavior` 通过；`npm run verify:web-api-coverage` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 静态契约守护：新增并扩展 `npm run verify:web-api-contract`，检查 Swagger 参数位置/必填定义、源码请求形态、验证码查询别名、好友搜索/黑名单/新朋友分页、好友详情/备注/新增/删除/黑名单必填参数、单聊免打扰/置顶、群详情/成员/公告/审核/已读/免打扰/置顶/清空消息、文件签名/压缩/转换/资源详情/删除/引用失效参数、消息搜索/收藏/合并转发参数与 E2E 入口、业务 token/OpenIM token 分离、`.env` 后端地址以及三个 Vite 配置的 `/business-api` proxy；当前 166 条检查通过。`npm run verify:web-api-contract` 通过；`node --check "scripts/verify-web-api-contract.mjs"` 通过；`npm run verify:web-api-coverage` 通过；`npm run verify:web-api-behavior` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run verify:web-api-e2e` dry-run 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 远端只读消息验收入口扩展：`npm run verify:web-api-e2e` 新增聊天记录搜索、消息收藏列表/详情、已保存合并消息列表/详情、合并消息预览和合并消息转发前置校验的可选远端检查；新增 `OPENIM_E2E_MESSAGE_SEARCH_KEYWORD`、`OPENIM_E2E_MESSAGE_AUDIT_IDS`、`OPENIM_E2E_MESSAGE_FORWARD_TARGET_TYPE`、`OPENIM_E2E_MESSAGE_FORWARD_TARGET_ID`、`OPENIM_E2E_FAVORITE_ID`、`OPENIM_E2E_MERGE_ID` 等环境变量。默认 dry-run 仍不发送远端请求。`node --check "scripts/verify-web-api-e2e.mjs"` 通过；`npm run verify:web-api-e2e` dry-run 通过；`npm run verify:web-api-coverage` 通过；`npm run verify:web-api-contract` 通过；`npm run verify:web-api-behavior` 通过；`npx tsc --noEmit --pretty false` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 静态覆盖白名单守护：扩展 `npm run verify:web-api-coverage`，对 `sourceOnly` 和 `sourceNotInSwagger` 增加已知兼容白名单；当时除 `/room/openim/qr/create|join|resolve`、`/account/password/reset`、`/user/rtc/get_token` 外，新增非清单或非 Swagger 源码接口会失败。后续 2026-06-20 已移除 `/account/password/reset` 运行时调用，仅保留 RTC 旧能力待后端契约明确。历史验证记录保留为背景。
- [x] 2026-06-14 契约收紧复核：远端 `http://47.238.134.161:8092/v2/api-docs` 与本地 `docs/openim-swagger.json` 哈希一致，路径数均为 780；单聊 `/friends/update/OfflineNoPushMsg` 封装强制 `offlineNoPushMsg`，群免打扰/置顶封装分别强制 `offlineNoPushMsg`/`top`，并扩展 `npm run verify:web-api-contract` 到 166 条检查。`node --check "scripts/verify-web-api-contract.mjs"` 通过；`npx eslint --quiet "src/api/group.ts" "src/api/friend.ts"` 通过；`npm run verify:web-api-coverage` 通过；`npm run verify:web-api-contract` 通过；`npm run verify:web-api-behavior` 通过；`npm run verify:web-api-e2e` dry-run 通过；`npm run verify:web-api-ui` 默认 skip 通过；`npx tsc --noEmit --pretty false` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 验证脚本 lint 守护：新增 `npm run verify:web-api-lint`，把 `scripts/verify-web-api-*.mjs` 纳入 ESLint；`tsconfig.eslint.json` 增加 `scripts/**/*.mjs` 和 `allowJs/checkJs` 配置，`.eslintrc.js` 为验证脚本设置 Node override，并关闭动态 Swagger/JSON 检查脚本不适用的 `no-unsafe-argument/no-unsafe-return`。格式化脚本后将契约脚本里的 E2E 入口检查改为格式无关正则，避免 Prettier 换行导致误报。`npm run verify:web-api-lint` 通过；四个验证脚本 `node --check` 通过；`npm run verify:web-api-coverage` 通过；`npm run verify:web-api-contract` 通过；`npm run verify:web-api-behavior` 通过；`npm run verify:web-api-e2e` dry-run 通过；`npm run verify:web-api-ui` 默认 skip 通过；`npx tsc --noEmit --pretty false` 通过；`npm run build -- --config vite.web.config.ts` 通过。
- [x] 2026-06-14 验收准备复核：补全 `npm run verify:web-api-e2e` dry-run 输出中的控制开关、Web UI 验收变量、只读消息标题、文件上传扩展和群审核备注等环境变量提示，方便拿到真实账号/群/文件/消息数据后直接执行远端验收；`npm run verify:web-api-lint` 通过；`npm run verify:web-api-e2e` dry-run 通过；`npm run verify:web-api-contract` 通过；`npm run verify:web-api-local` 全量通过。覆盖检查仍显示 63 个 Web 期望接口无 `missingInSwagger`、无 `missingInSource`、无误接后台/支付/运营排除路径；契约检查 166 条通过。
- [x] 2026-06-14 好友目标搜索验收入口：`npm run verify:web-api-e2e` 新增 `OPENIM_E2E_FRIEND_SEARCH_KEYWORD` 和 `OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID`，远端只读模式下登录后调用 `/friends/page` 按 `keyword` 搜索目标用户，默认输出命中总数；提供期望 userID 时断言结果包含目标用户。契约守护新增对应检查，`npm run verify:web-api-local` 全量通过；覆盖检查 63 个 Web 期望接口无缺失，契约检查 174 条通过。
- [x] 2026-06-14 通讯号查人验收入口：`npm run verify:web-api-e2e` 新增 `OPENIM_E2E_USER_ACCOUNT_QUERY` 和 `OPENIM_E2E_USER_ACCOUNT_EXPECTED_USER_ID`，远端只读模式下登录后调用 `/user/getByAccount` 按通讯号查询用户；提供期望 userID 时断言返回用户一致。契约守护新增 `/user/getByAccount` 必填 `account` 参数和 E2E 入口检查，`npm run verify:web-api-local` 全量通过；契约检查 178 条通过。
- [x] 2026-06-14 产品差异调整：企业号临时写死为 `LOCALTEST001`；登录、注册、发送验证码、校验验证码统一使用固定企业号，不依赖用户输入或 E2E 环境变量。远端 Swagger 当前仍把 `/account/code/send`、`/account/code/verify` 的字段命名为 `invitationCode`，登录/注册请求体按用户要求补充 `enterpriseCode`，同时保留 `invitationCode` 兼容。
- [x] 2026-06-14 UI 添加好友搜索守护：`e2e/web-api-ui.spec.ts` 在 `OPENIM_E2E_FRIEND_SEARCH_KEYWORD` 场景下会断言 `/friends/page` 成功返回；若响应总数为 0，会进一步断言页面展示“未搜索到相关结果/No relevant results found”；若提供 `OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID`，会断言响应包含目标用户、搜索弹窗关闭且目标用户卡片打开。两种分支都持续断言未触发 `/friends/add`。`npx eslint --quiet "e2e/web-api-ui.spec.ts" "scripts/verify-web-api-behavior.mjs"` 通过；`node --check "e2e/web-api-ui.spec.ts"`、`node --check "scripts/verify-web-api-behavior.mjs"` 通过；`npm run verify:web-api-behavior` 通过，当前 28 条检查全绿；`npm run verify:web-api-local` 全量通过，覆盖检查 63 个 Web 期望接口无缺失，契约检查 178 条通过。
- [x] 2026-06-14 多账号 UI 验收入口：`e2e/web-api-ui.spec.ts` 新增 `OPENIM_E2E_ACCOUNT2_PHONE`、`OPENIM_E2E_ACCOUNT2_PASSWORD` 可选用例；提供第二账号后会在同一浏览器上下文依次登录账号 1 和账号 2，确认两者 `chatToken/imToken/userID` 不同，再通过侧边栏头像菜单点击已保存账号切换回账号 1，并断言 `IM_CHAT_TOKEN`、`IM_TOKEN`、`IM_USERID`、`IM_WEB_CURRENT_ACCOUNT` 全部切回账号 1。`LeftNavBar` 新增非视觉 `data-testid`/`data-account-key` 作为稳定测试定位；`npm run verify:web-api-e2e` dry-run 已在 Web UI 验收变量段列出账号 1/2 和多账号切换所需变量；`npm run verify:web-api-behavior` 新增多账号 UI、定位钩子和 dry-run 提示守护，当前 29 条检查通过。
- [x] 2026-06-14 全量基线复核：`npm run verify:web-api-local` 通过；覆盖检查 63 个 Web 期望接口无缺失，契约检查扩展到 193 条且失败 0，行为检查 29 条通过，`verify:web-api-e2e` dry-run 和 `verify:web-api-ui` 默认 skip 通过，`tsc --noEmit --pretty false` 与 `npm run build -- --config vite.web.config.ts` 均通过。构建仍有 AntD `use client` 与 chunk size 既有 warning，不影响退出码。
- [x] 2026-06-14 真实浏览器多账号切换复测：使用账号 `18888888888 / czp0422+` 登录成功进入 `#/chat`，账号菜单显示当前用户 `10000003`；同一浏览器中已保存账号包含 `10000003` 和 `10000021`，点击 `10000021` 后页面重载回 `#/chat`，再次打开账号菜单确认 `10000021` 显示“当前”、`10000003` 显示“切换”，多账号 UI 切换链路可用。
- [x] 2026-06-14 后续验收约束：用户明确要求本项目不走单元测试，后续不再新增/修改测试文件或验证脚本，不再以测试脚本作为功能推进动作；接口接入后的验收只通过真实浏览器打开页面复测实际业务流程。历史验证记录仅作为既有背景保留。
- [x] 2026-06-14 群管理变更防误触：`GroupBusinessEntrances` 中群公告删除、入群审核同意/拒绝、特殊成员角色设置已统一增加二次确认弹窗，避免真实环境误点后直接提交远端变更；当前测试账号无群数据，真实浏览器刷新 `#/chat` 后页面正常渲染空聊天状态，具体弹窗行为待提供真实群数据后复测。
- [x] 2026-06-14 群消息撤回防误触：群消息右键菜单的“撤回”在调用业务 `/room/openim/message/recall` 和 SDK `revokeMessage` 前新增二次确认弹窗；当前测试账号无可见消息数据，真实浏览器刷新 `#/chat` 后页面正常渲染空聊天状态，具体右键菜单待真实消息数据复测。
- [x] 2026-06-14 黑名单移除防误触：单聊设置取消黑名单和个人设置黑名单列表移除用户都会先弹出确认，再调用业务 `/friends/blacklist/delete` 和 SDK `removeBlack`；当前测试账号无可见黑名单数据，真实浏览器刷新 `#/chat` 后页面正常渲染空聊天状态。
- [x] 2026-06-14 群列表筛选修正：`我的群组` 页面按“我创建的/我加入的”筛选时，将 `creatorUserID` 和当前 `userID` 统一转为字符串后比较，避免 SDK/业务数据混用数字和字符串 ID 时把真实群误过滤；真实浏览器打开 `#/contact/myGroups` 页面正常渲染，当前账号仍无可见群数据。
- [x] 2026-06-14 ID 类型兼容修正：新增 `normalizeID/isSameID`，并用于用户卡片、单聊设置、联系人 store、群成员 hook、当前群成员更新、会话跳转、全局事件刷新、顶部搜索、转发选择器、消息点击名片和发送前当前会话判断等路径，避免业务接口返回数字 ID、SDK 返回字符串 ID 时出现好友状态误判、黑名单状态误判、列表合并重复、事件不刷新或更新/删除失败。真实浏览器刷新 `#/chat` 成功；打开账号 `10000003` 的单聊 `si_10000003_10000009` 后，单聊设置正常显示“解除好友”，用户资料卡显示 `10000009`、备注和“发送消息”，未误显示“添加好友”；第二次刷新后账号和会话列表仍正常渲染；未触发黑名单、解除好友等远端变更。
- [x] 2026-06-14 只读资源入口复测：真实浏览器打开账号 `10000003` 的单聊 `si_10000003_10000006`，聊天资源弹窗的“收藏消息”“已保存合并消息”“文件资源”三个 Tab 均可打开并返回空态，页面无新增错误；聊天记录搜索弹窗可搜索 `qq` 并返回空态，但该会话本地 SDK 历史消息中可见 `qq`，说明当前后端审计搜索数据源未命中本地可见历史消息，需要后端确认落库/索引范围。
- [x] 2026-06-14 收藏/保存合并防误触：聊天搜索结果中的“收藏”“保存合并消息”和消息右键菜单“收藏”已增加二次确认；真实浏览器右键 `qq` 消息点击“收藏”只弹出“确认收藏这条消息吗？”确认框，点击“取消”后未触发远端收藏变更。
- [x] Web 登录成功后进入聊天页。
- [x] 多账号切换不串 token 和 userID。
- [x] 代码路径确认：单聊/群聊发送前校验失败时不调用 SDK 发送。
- [ ] 后端拒绝场景实测：单聊/群聊发送前校验失败时不发送 SDK 消息并展示后端提示。
- [ ] 文件上传、下载、预览可用。
- [ ] 群公告、成员备注、特殊成员、群免打扰/置顶/清空消息、邀请审核、已读详情、在线成员可用。

## 2026-06-14 access_token 鉴权复核

- [x] 自定义联调文档 `openim-swagger.html` 明确登录返回 `data.access_token` 是 Java 业务后端 token，`data.openIM.token` 是 OpenIM SDK token，二者不可混用。
- [x] 自定义联调文档在线调试逻辑对非公开接口追加 `access_token` query 参数；原始 Swagger 的 `Authorization` header 只是通用 security 定义，未说明 token 来源和格式。
- [x] 前端业务请求层已按 `access_token` query 追加访问令牌，并跳过 `/account/login`、`/account/register`、`/account/code/send`、`/account/code/verify`、`/enterprise/code/validate` 等公开路径。
- [x] `npm run verify:web-api-local` 全量通过：lint、coverage、contract、behavior、e2e dry-run、UI 默认 skip、`tsc --noEmit --pretty false`、Web build 均通过。
- [x] 远端只读验收通过：账号登录成功，`/friends/list` 不再返回“缺少访问令牌”，`/message/favorites` 和 `/message/merge/saved` 只读接口也通过。
- [x] 真实 Chrome 复测添加好友入口：使用账号 `18888888866` 登录成功并进入 `#/chat`；顶部 `+` -> `添加好友` 可打开弹窗；搜索手机号 `18888888888` 请求 `/friends/page?userId=10000021&keyword=18888888888&pageIndex=0&pageSize=1&access_token=...` 返回 `resultCode: 1` 但 `data.total: 0`、`data.pageData: []`，页面提示“未搜索到相关结果”，未出现发送好友申请入口，未触发 mutation。
- [x] 只读补证：Swagger 中 `/friends/page` 定义为 `keyword` 搜索，`/user/getByAccount` 定义为按“通讯号”查询；当前登录态调用 `/user/getByAccount?account=18888888888` 返回 `resultCode: 100213`、`resultMsg: 通讯号错误`，说明该值也不是可用通讯号。
- [x] 真实浏览器补充复测：账号 `18888888888 / czp0422+` 可登录，用户 ID 为 `10000003`，但聊天页、我的好友、新朋友、群通知、我创建的群、我加入的群均无可见业务数据；切回账号 `10000021` 后在添加好友弹窗搜索 `10000003` 仍显示“未搜索到相关结果”，未触发 `/friends/add`。
- [x] 2026-06-14 接口边界复核：按产品边界明确消息收发继续走 OpenIM API/WS（`10002/10001`），添加好友、查找用户/群、加群等业务动作走 businessApi（`8092`）。代码已将用户卡片发送好友申请从 `IMSDK.addFriend` 切换到 `/friends/add`，群搜索从 `IMSDK.getSpecifiedGroupsInfo` 切换到 `/room/openim/detail`，群卡片加群从 `IMSDK.joinGroup` 切换到 `/room/join`；真实浏览器刷新 `#/chat` 后仍保持登录态，当前页面正常渲染，仅有既有 AntD `findDOMNode` warning，未主动触发好友/加群 mutation。
- [x] 2026-06-14 群操作业务同步补充：按 Swagger 参数清晰的用户端群接口补齐 `/room/member/update`、`/room/member/delete`、`/room/transfer` 与 `/room/delete` 封装；邀请入群、退群、踢人、转让群主、解散群会先同步 businessApi，再同步 OpenIM SDK。群通知/申请卡片点击查看群资料从 `IMSDK.getSpecifiedGroupsInfo` 切换到 `/room/openim/detail`。创建群 `/room/add` 参数仍是旧系统复杂结构且必填项不清晰，因此当前保留 SDK 能力，不强行改造。真实浏览器刷新 `#/chat` 后仍保持登录态并正常渲染，仅有既有 AntD `findDOMNode` warning；未触发邀请、退群、踢人、转让、解散群等 mutation。
- [x] 2026-06-14 API 清单缺口补齐：源码级核对 Trellis Web 期望业务接口时发现 `/user/getByAccount` 尚未封装；已补充 `getBusinessUserByAccount`，并在 `/friends/page` 搜索无结果时作为通讯号/账号兜底查询。复核 66 个 Web 期望接口在 `src/api/**` 均已有封装。真实浏览器尝试添加好友搜索 `18888888888` 时，自动化输入未可靠触发 React `onChange`，未能完成搜索结果复测；页面保持 `#/chat` 正常渲染，弹窗已关闭，未触发 `/friends/add`。
- [x] 2026-06-14 资源类接口缺口补齐：按 Swagger 补充 `/file/resources/references`、`/file/storage/overview`、`/file/storage/room-overview`、`/message/merge/context`、`/message/favorites/context`、`/message/favorites/update`、`/message/favorites/merge`、`/room/openim/shares`、`/room/openim/share/add`、`/room/openim/share/delete` 封装；其中新增/更新收藏、群共享新增/删除属于远端写操作，仅封装或保留二次确认入口，不自动触发。
- [x] 2026-06-14 聊天资源入口补充：聊天资源弹窗新增收藏上下文、合并上下文、文件容量概览按钮；文件资源列表新增“引用关系”只读入口；群聊场景新增“群共享文件”Tab，读取 `/room/openim/shares`，共享文件删除继续走确认弹窗后再调用 `/room/openim/share/delete`。
- [x] 2026-06-14 真实浏览器复测：使用账号 `18888888888` 登录进入 `#/chat`，打开单聊 `si_10000003_10000006` 的聊天资源弹窗；“收藏上下文”调用 `/message/favorites/context` 返回 `resultCode: 1` 并展示收藏/合并元数据；切到“文件资源”后“容量概览”调用 `/file/storage/overview` 返回 `resultCode: 1` 并展示容量、引用和资源接口元数据。控制台仅有既有 AntD `findDOMNode` warning，未触发删除、上传、收藏、加好友、加群等 mutation。
- [x] 2026-06-14 收藏编辑/合并收藏入口补充：收藏消息列表新增“编辑”入口，保存前二次确认后调用 `/message/favorites/update`；聊天记录搜索结果新增“合并收藏”入口，点击后二次确认并调用 `/message/favorites/merge`。当前账号收藏列表和搜索结果为空，真实浏览器只复测弹窗正常打开和无新增运行时错误，未触发收藏更新或合并收藏 mutation。
- [x] 2026-06-14 群共享文件新增流程接入：群聊中用户主动发送普通文件或视频时，现有上传链路仍先走 `/file/upload/context`、`/file/upload` 和发送前校验；发送流程启动后异步调用 `/room/openim/share/add` 将业务文件登记到群共享文件列表。图片消息仍按图片资源处理，不自动登记为群共享文件。同步失败只记录警告，不阻断已发送消息。真实浏览器刷新并打开单聊 `si_10000003_10000006` 后，图片/视频/文件按钮正常渲染，控制台仅有既有 AntD `findDOMNode` warning；本轮未上传文件，未触发远端写操作。
- [x] 2026-06-14 最新 Swagger 同步：远端 `http://47.238.134.161:8092/v2/api-docs` 与本地 `docs/openim-swagger.json` 哈希不一致，已重新保存本地 JSON；更新后路径数仍为 780、operation 数为 1719。复扫 Web 范围后，新增重点落在 `OpenIM-群助手`，其他新增/未接路径多为后台桥接、清理日志、企业容量、旧群接口、关注/粉丝、支付/商品/移动推送等非本次 Web 首期范围。
- [x] 2026-06-14 群助手接口接入：按最新 Swagger 补充 `/room/openim/group-helpers/context`、`/room/openim/group-helpers`、`/room/openim/group-helpers/available`、`/room/openim/group-helpers/add`、`/room/openim/group-helpers/delete`、`/room/openim/group-helpers/keywords/add`、`/room/openim/group-helpers/keywords/update`、`/room/openim/group-helpers/keywords/delete` 封装；群设置抽屉新增“群助手”入口，仅群主/管理员可见，支持已添加助手、可添加助手和自动回复关键字管理。添加/移除助手、关键字新增/修改/删除均先弹二次确认，打开面板只触发只读查询。
- [x] 2026-06-14 业务列表响应兼容：Swagger 对群助手等接口只声明 `additionalProperties`，未给出具体列表字段。`getBusinessListPayload` 在保留 `list/records/rows/items/users/pageData` 优先级不变的前提下，追加兼容 `helpers/availableHelpers/groupHelpers/groupHelperList/members/onlineMembers/specialMembers/notices/joinRequests/shares/resources/favorites/messages/mergeMessages` 等自然列表字段，避免后端使用业务命名字段时页面误显示空态。
- [x] 2026-06-14 真实浏览器增量复测：增强业务列表拆包后刷新 `http://127.0.0.1:7777/index.html#/chat`，页面仍正常渲染，无 Vite 编译错误或新增运行时阻断；可见控制台提示仍为既有 React Router future flag warning 与 AntD `findDOMNode` warning。本轮未触发任何远端写操作。
- [x] 2026-06-14 真实浏览器刷新复测：刷新 `http://127.0.0.1:7777/index.html#/chat` 后页面仍停留在聊天页并正常渲染，无 Vite 编译错误或新增运行时阻断；控制台仅有既有 React Router future flag warning 和 AntD `findDOMNode` warning。本轮未进入真实群设置、未触发群助手添加/移除或关键字增删改 mutation；当前账号缺少可见群数据，群助手入口仍需真实群主/管理员账号复测。
- [x] 2026-06-14 群消息销毁设置数值项补充后真实浏览器刷新 `http://127.0.0.1:7777/index.html#/chat`：消息/通讯录/系统公告入口均正常渲染，控制台仍仅有既有 AntD `findDOMNode` warning 和 SDK 连接对象日志；当前账号缺少可见群，未触发任何群设置 mutation。
- [x] 2026-06-14 剩余 Swagger 候选接口审计：已在 `research.md` 补充系统公告用户端、好友分组、收藏表情、旧登录/注册链路、旧群接口、OpenIM 回调/配置等处理结论；系统公告用户端已在后续补入左侧栏入口，其余仍因不属于当前 Web 首期 IM 核心清单或缺少产品入口/数据契约支撑，暂不强行接入。
- [x] 2026-06-14 用户退出接口复核：Swagger `/user/logout` 要求 `deviceKey/devicekey/telephone/access_token`，当前 Web 登录态没有稳定设备 key 来源，且 `telephone` 是否需沿用加密值未定义；为避免退出流程调用必失败的业务接口，当前只记录为待后端契约明确，代码仍保持 OpenIM SDK logout + 本地账号态清理。
- [x] 2026-06-14 忘记密码接口复核：最新 Swagger 的 `/user/password/reset` 必填 `serial`，但验证码校验接口未定义该字段来源；当时页面从验证码校验响应中兼容读取 `serial/deviceSerial/deviceID/deviceId`，读取不到时保留历史 `/account/password/reset` 兜底。后续 2026-06-20 已移除该兜底，缺少 `serial` 时停留在验证码步骤并提示错误。发送验证码和校验验证码的 `usedFor` 已统一为修改密码场景 `2`。

## 2026-06-14 验收证据审计

| 验收项                                                     | 当前证据                                                                                                                                                                                                                                                                                     | 结论                                                                                                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 后端地址和跨域代理                                         | `.env` 中 `VITE_CHAT_URL=/business-api`、`VITE_BUSINESS_API_TARGET=http://47.238.134.161:8092`、OpenIM API/WS 分别为 `10002/10001`；`vite.proxy.ts` 统一配置 `/business-api` rewrite。                                                                                                       | 已完成。                                                                                                                               |
| 登录保存业务 token、OpenIM token 和 userID 后再进入聊天页  | `LoginForm.tsx` 和 `RegisterForm.tsx` 成功回调中先 `await setIMProfile({ ...normalizeIMProfile(...) })`，再 `navigate("/chat")`；`normalizeIMProfile` 从 `access_token/accessToken/access_Token` 取业务 token，从 `openIM.token` 取 OpenIM token。真实浏览器当前位于 `#/chat` 且无阻断错误。 | 已完成。                                                                                                                               |
| 企业号固定和验证码参数                                     | `DEFAULT_ENTERPRISE_CODE=LOCALTEST001`；登录、注册、验证码发送/校验统一带固定 `enterpriseCode`，不再默认传 `invitationCode`；验证码参数走 query 并补 `telephone`；最新注册页不再调用验证码接口。                                                                                             | 已完成。                                                                                                                               |
| 业务鉴权使用 `access_token` query                          | `createAxiosInstance` 对非公开业务路径从 `getChatToken()` 取业务 token，并追加 `access_token` query；OpenIM token 仅在 `imToken=true` 实例使用。                                                                                                                                             | 已完成。                                                                                                                               |
| 多账号保存和隔离                                           | `storage.ts` 保存 `IM_WEB_SAVED_ACCOUNTS`、`IM_WEB_CURRENT_ACCOUNT`、`IM_TOKEN`、`IM_CHAT_TOKEN`、`IM_USERID`；切换账号重写 token/userID，聊天草稿使用 `IM_ACCOUNT:${accountKey}:...` 作用域。真实浏览器历史复测确认 `10000003` 与 `10000021` 可切换且当前态不串号。                         | 已完成。                                                                                                                               |
| 单聊/群聊发送前业务校验                                    | `src/api/chat.ts` 封装 `/friend/openim/send-before`、`/room/openim/send-before`；发送链路在调用 `IMSDK.sendMessage` 前执行校验，失败路径返回 false 并保留输入。                                                                                                                              | 代码路径已完成；仍缺后端拒绝真实场景实测。                                                                                             |
| 文件上传、下载、预览链路                                   | `src/api/file.ts` 封装 `/file/upload/context`、`/file/upload`、`/file/sign`、`/file/download`、`/file/preview`、`/file/compress`、`/file/convert`、`/file/compress/async`、`/file/convert/async`、`/file/thumbnail`；图片/视频/文件发送和渲染入口已接入业务 `fileId`。                       | 文件资源只读详情、引用状态和引用关系已有真实数据验收；上传并发送已收敛到确认框 `OK` 后执行，真实上传/下载/预览动作仍需用户确认后实测。 |
| 聊天记录搜索、收藏、合并消息、文件资源                     | `src/api/chat.ts`、`src/api/file.ts`、聊天头部资源弹窗和搜索弹窗均已接入；真实浏览器已验证收藏上下文、容量概览、文件资源详情/引用状态/引用关系等只读接口可打开并返回成功/空态。                                                                                                              | 基础入口和文件资源只读链路已完成；仍缺真实 auditId/favoriteId/mergeId 覆盖收藏/合并消息完整详情和写操作。                              |
| 群详情、成员、公告、审核、已读、在线成员、特殊成员、群助手 | `src/api/group.ts` 已封装新版 `/room/openim/**` 相关接口，群设置抽屉已有入口；写操作均加二次确认。                                                                                                                                                                                           | 代码入口已完成；当前账号无可见群数据，仍缺真实群主/管理员账号验收。                                                                    |
| IP 限制和宵禁提示                                          | Web 不直接接 `/console/**/security/**`，只展示 `/account/login` 失败响应文本。                                                                                                                                                                                                               | 按本期边界已处理；仍需后端提供实际错误响应才能实测提示文案。                                                                           |

- [ ] 仍需真实好友、群、文件、消息 auditId/favoriteId/mergeId 等数据做更完整只读验收；mutation 验收仍需单独确认后执行。

## 2026-06-14 群二维码/扫码入群补充

- [x] 按最新 Swagger 补齐并收紧群二维码接口类型：`/room/openim/qr/create` 使用 `roomId` 和可选 `expireHours`，`/room/openim/qr/resolve` 使用 `code`，`/room/openim/qr/join` 使用 `code` 和可选 `applyReason`。
- [x] 群设置业务入口新增“群二维码”面板：生成二维码短码、展示二维码内容、复制二维码内容、解析短码/链接并展示群基础信息。
- [x] 扫码入群属于远端关系变更，页面只在用户点击“申请加入”并通过二次确认后调用 `/room/openim/qr/join`；打开面板和解析短码不触发入群 mutation。
- [x] 真实浏览器刷新 `http://127.0.0.1:7777/index.html#/chat`，页面保持正常渲染；控制台仍只有既有 AntD `findDOMNode` warning。当前账号缺少可见群，暂未进入真实群设置面板执行二维码接口实测。

## 2026-06-14 系统公告用户端补充

- [x] 按 Swagger 新增系统公告封装：`/system/announcements`、`/system/announcements/detail`、`/system/announcements/read`、`/system/announcements/read-all`、`/system/announcements/unread-count`。
- [x] 左侧栏新增系统公告铃铛入口和未读角标；弹窗支持公告列表、详情查看、单条标已读、全部标已读。
- [x] 列表、详情和未读数为只读请求；单条/全部标已读为用户主动点击触发，其中全部标已读带二次确认。
- [x] 真实浏览器刷新 `http://127.0.0.1:7777/index.html#/chat` 后页面仍正常渲染；打开系统公告弹窗成功返回真实公告列表和未读角标，点击首条公告可读取详情内容；未触发单条/全部标已读 mutation。

## 2026-06-14 群通知与群设置业务同步补充

- [x] 通讯录群通知页同意/拒绝群申请时，若 SDK 通知对象或 `ex` 扩展中能读取到 `requestId/joinRequestId/applyId/id`，会先调用 `/room/openim/join-requests/handle`，再同步 OpenIM SDK `acceptGroupApplication/refuseGroupApplication`。
- [x] 若 SDK 群申请通知缺少业务 `requestId`，页面保留原 SDK 处理流程；该路径无法强行调用业务审核接口，需后端在通知扩展字段中稳定透传申请 ID，或以后改为从群设置的 `/room/openim/join-requests` 列表处理。
- [x] 群申请卡片只读查看增加业务 `roomId` 防护：能从申请对象或 `ex` 解析出业务 `roomId` 时才调用 `/room/openim/detail`/`/room/getRoom`，否则仅用 SDK 申请对象中的 `groupID/groupName/groupFaceURL` 打开卡片，避免误把 OpenIM `groupID` 传给业务详情接口。
- [x] 群名称和群权限等涉及 `/room/update` 的写入顺序已调整为先提交 businessApi，成功后再同步 OpenIM SDK `setGroupInfo`，避免业务校验失败时先改动 SDK 状态。
- [x] 当前用户群成员信息增加业务只读合并：进入群会话时仍以 OpenIM SDK 成员信息兜底，再调用 `/room/openim/members` 按当前 userID 检索并合并业务成员字段；角色值兼容 OpenIM `100/60/20` 与旧系统 `1/2/3`，用于群管理入口权限判断。
- [ ] 仍需真实群申请数据验证：通讯录群通知中的 `ex` 是否包含业务 `requestId`，以及 businessApi + SDK 双同步是否与后端状态一致；该验证会触发同意/拒绝 mutation，必须由用户单独确认后执行。

## 2026-06-14 剩余未接接口复扫

- [x] 重新按最新 `docs/openim-swagger.json` 与 `src/**` 源码路径做差异审计；系统公告和群二维码已进入源码封装与页面入口。
- [x] 将剩余未接候选按接口组写入 `research.md`：好友分组、收藏表情、关注/粉丝、旧新朋友接口、Tigase 漫游/旧消息、用户加密密钥、举报/录制/离线操作、文件清理/企业容量、OpenIM 同步桥接运维、开放平台群助手、旧登录/旧群接口等。
- [x] 结论：上述剩余路径不属于当前 Trellis Web 首期登录/聊天/文件/搜索/好友/群管理核心范围，或当前没有产品入口/数据契约支撑；继续强接会改变信息架构或引入后台/旧系统语义，暂不接入。
- [x] 真实浏览器刷新 `http://127.0.0.1:7777/index.html#/chat` 后，消息/通讯录导航和系统公告入口均可见；控制台仍只有既有 AntD `findDOMNode` warning 和 SDK 连接对象日志，无新增页面阻断。

## 2026-06-14 剩余候选边界补充

- [x] 重新用本地 Swagger 与 `src/api/**` 封装做只读差异扫描，剩余未封装候选集中在 `/file/cleanup/**`、`/file/storage/enterprise-overview`、关注/粉丝、收藏表情、旧 H5 新朋友、旧群接口、旧群助手/自动回复/群加密/位置/红包能力、OpenIM 同步运维和用户安全/支付/微信杂项。
- [x] 已补充 `research.md` 边界说明：`/room/openim/batch-status` 纳入 OpenIM 同步桥接运维排除；旧群接口代表列表扩展到 `/room/get*`、`/room/list*`、`/room/*GroupHelper`、`/room/*AutoResponse`、`/room/location/*` 等；用户杂项/安全/支付资料接口统一列为非 Web 首期 IM 范围。
- [x] 本轮未新增或修改测试文件，未运行单元测试/验证脚本；浏览器刷新 `http://127.0.0.1:7777/index.html#/chat` 正常，无 Vite 编译遮罩，未触发任何远端写操作。
- [x] 好友申请同意顺序调整后，真实浏览器打开 `#/chat` 和 `#/contact/newFriends` 均无 Vite 编译遮罩；控制台仍只有既有 AntD `findDOMNode` warning 和 SDK 对象日志。未点击同意/拒绝按钮，未触发 `/friends/add` 或 SDK 好友申请处理 mutation。
- [x] 公共上传入口复核：个人头像、群头像等复用的 `src/utils/imCommon.ts` 上传工具已优先走 `/file/upload/context` + `/file/upload`，业务上传失败时才回退 OpenIM SDK；同时清理了该文件重复的 `uuid` 导入。真实浏览器刷新 `#/chat` 正常，无 Vite 编译遮罩；本轮未触发上传或其他远端写操作。
- [x] 修改密码接口契约修正：`src/api/login.ts` 的 `modifyPassword` 已从 Swagger 不存在的 `/account/password/change` 改为 `/user/password/update`，按文档通过 query 传 `oldPassword/newPassword`；真实浏览器刷新 `#/chat` 正常，无 Vite 编译遮罩。本轮未打开修改密码表单，未提交任何密码变更。
- [x] 忘记密码 reset 兼容补充：发送验证码和校验验证码 `usedFor` 统一为 `2`；验证码校验成功后尝试读取后端 `serial/deviceSerial/deviceID/deviceId`，有值时重置密码走 `/user/password/reset`。后续 2026-06-20 已移除缺失 `serial` 时的历史 `/account/password/reset` 兜底。真实浏览器刷新 `#/chat` 正常，无 Vite 编译遮罩；本轮未打开忘记密码表单，未发送验证码或提交密码变更。
- [x] 找回密码鉴权边界复核：`/user/password/reset` 已加入请求层公开路径，未登录 reset 流程不会自动追加残留 `access_token`；后续 2026-06-20 已移除 `/account/password/reset` 公开路径。真实浏览器刷新 `#/chat` 正常，无 Vite 编译遮罩。本轮未发送验证码或提交密码变更。
- [x] 忘记密码手机号表单复测：真实浏览器打开 `#/login` 并点击“忘记密码”，表单展示手机号和验证码字段，不再展示邮箱字段；未点击发送验证码，未触发远端请求。复测后已返回 `#/chat`。
- [x] 注册直接表单复测：真实浏览器打开 `#/login`，点击“立即注册”，注册表单展示手机号、固定企业号、昵称、密码和确认密码；不再展示验证码、重新获取验证码或下一步流程；未提交注册，未触发远端 mutation。
- [x] 登录验证码入口复测：真实浏览器打开 `#/login`，email 登录模式下不展示“验证码登录”且保留密码输入；切回手机号模式后展示“验证码登录”。未点击发送验证码或提交登录；复测后已返回 `#/chat`。
- [x] 手机号登录入口复测：真实浏览器打开 `#/login`，页面展示手机号、密码、验证码登录切换和企业号字段，不再展示邮箱入口；未发送验证码或提交登录。复测后已返回 `#/chat`。

## 2026-06-14 登录后修改密码入口补齐

- [x] 页面挂载审计发现 `modifyPassword` 已按 Swagger 对齐 `/user/password/update`，但此前没有任何页面引用；本轮在账号设置弹窗补充“修改密码”入口，使该接口进入真实 Web 用户端流程。
- [x] 修改密码表单包含原密码、新密码、确认密码；新密码沿用注册/找回密码的 6-20 位且至少包含数字和字母规则，提交前对原密码和新密码做 MD5 后调用 `/user/password/update`，业务 `access_token` 继续由请求层以 query 追加。
- [x] 修改成功后展示“修改密码成功，请重新登录！”并清理当前登录态返回登录页；表单打开和取消不会触发任何远端请求。
- [x] 本轮未新增或修改测试文件，未运行单元测试/验证脚本；真实浏览器刷新 `http://127.0.0.1:7777/index.html#/chat` 正常，无 Vite 编译遮罩。打开头像菜单 -> 账号设置 -> 修改密码后，表单字段和按钮正常渲染；点击“取消”关闭表单，未提交密码变更。

## 2026-06-14 最新 Swagger 文件接口补充

- [x] 重新保存远端 `http://47.238.134.161:8092/v2/api-docs` 到 `docs/openim-swagger.json`；本轮远端路径数为 786，本地文档已同步。
- [x] 新增路径中 `/file/compress/async`、`/file/convert/async`、`/file/thumbnail` 属于 Web 文件发送/预览链路增强，已补充 API 封装。
- [x] 文件上传成功后，如后端返回业务 `fileId`，会非阻塞请求 `/file/thumbnail` 生成缩略图；图片同步 `/file/compress` 失败时兜底请求 `/file/compress/async`，视频同步 `/file/convert` 失败时兜底请求 `/file/convert/async`，不改变当前消息即时发送行为。
- [x] `/room/openim/send-before` 最新文档新增可选 `fileSize`；群聊发送图片/视频/文件前现在会从业务文件扩展或 OpenIM SDK 消息元素里提取文件大小并透传给发送前校验。
- [x] 新增 `/file/cleanup/config`、`/file/cleanup/config/update`、`/file/cleanup/preview` 属于清理策略/治理能力，其中 update 是管理写操作；当前 Web 用户端不接入，继续归入非首期用户端范围。
- [x] 本轮未新增或修改测试文件，未运行单元测试/验证脚本；真实浏览器刷新 `http://127.0.0.1:7777/index.html#/chat` 正常，无 Vite 编译遮罩。打开已有单聊会话后，聊天页和图片/视频/文件发送工具栏正常渲染；未上传文件、未发送消息、未触发远端 mutation。

## 2026-06-14 聊天资源真实数据只读复测

- [x] 真实浏览器打开单聊 `si_10000003_10000009` 的聊天资源面板，收藏消息和已保存合并消息 Tab 均正常返回空态。
- [x] 文件资源 Tab 返回真实文件 `chuanxi.jpg`，展示大小和类型；仅点击详情、引用状态、引用关系三个只读入口，未点击下载或删除。
- [x] 文件详情返回真实 `fileId=8aaa0c1897904f3992bbe1b695f40043`，包含签名下载/预览 URL、压缩状态、缩略图状态和引用计数。
- [x] 引用状态返回 `referenceInvalid=false`、`canDelete=false`；引用关系返回 `referenced=false`、`referenceCount=0` 和空态说明。
- [x] 关闭资源面板后页面无残留弹窗，控制台仍只有既有 React Router future warning、AntD `findDOMNode` warning 和 SDK 对象日志；本轮未触发任何远端 mutation。

## 2026-06-14 当前实现进度梳理

### 已完成接入

- [x] 后端与跨域：`.env` 已使用 `VITE_CHAT_URL=/business-api`、`VITE_BUSINESS_API_TARGET=http://47.238.134.161:8092`，OpenIM API/WS 已对齐 `http://47.238.134.161:10002`、`ws://47.238.134.161:10001`；`vite.proxy.ts` 统一为 Vite 配置提供 `/business-api` 代理。
- [x] Swagger：最新远端文档已保存为 `docs/openim-swagger.json`，本轮以本地 Swagger 和源码作为当前进度核对依据。
- [x] 登录/注册/账号：`/account/login`、`/account/register`、`/account/code/send`、`/account/code/verify`、`/enterprise/code/validate`、`/user/openim/token`、`/user/password/update`、`/user/password/reset` 已封装并进入页面流程；企业号固定为 `LOCALTEST001`，邀请码按当前需求不作为用户必填项。
- [x] 鉴权：业务接口使用登录返回的 `access_token`，请求层对非公开 businessApi 自动追加 `access_token` query；OpenIM SDK 单独使用 `openIM.token`。
- [x] 多账号：已保存账号列表、当前账号、业务 token、OpenIM token 和 userID；切换账号时重写登录态并隔离聊天草稿等本地缓存。
- [x] 聊天：单聊/群聊消息收发继续使用 OpenIM SDK；发送前分别接入 `/friend/openim/send-before`、`/room/openim/send-before`，后端拒绝时阻断 SDK 发送并保留输入。
- [x] 聊天扩展：单聊/群聊历史搜索、消息收藏、合并消息、合并转发前校验、群消息撤回、聊天资源弹窗已接入。
- [x] 文件：`/file/upload/context`、`/file/upload`、`/file/sign`、`/file/download`、`/file/preview`、`/file/compress`、`/file/convert`、`/file/compress/async`、`/file/convert/async`、`/file/thumbnail`、`/file/resources`、`/file/resources/detail`、`/file/reference/status` 等已封装并接入消息发送/渲染/资源面板。
- [x] 好友与资料：`/user/get`、`/user/getByAccount`、`/user/public/search/list`、`/user/update`、`/friends/list`、`/friends/get`、`/friends/page`、`/friends/remark`、`/friends/add`、`/friends/delete`、`/friends/queryBlacklistWeb`、`/friends/blacklist/add`、`/friends/blacklist/delete`、`/friends/newFriendListWeb` 已接入或作为兜底查询。
- [x] 群管理：新版 `/room/openim/**` 相关群详情、成员、在线成员、公告、入群审核、已读详情、特殊成员、成员备注、免打扰、置顶、清空消息、群二维码、群助手、群共享已封装；群详情搜索保留 `/room/getRoom` 兜底，群权限和消息销毁设置通过 `/room/update` 接入。
- [x] 系统公告：`/system/announcements`、`/system/announcements/detail`、`/system/announcements/read`、`/system/announcements/read-all`、`/system/announcements/unread-count` 已接入左侧栏入口。

### 当前未接入范围

- [x] 后台/运维/管理类接口不纳入本次 Web 用户端：`/console/**`、OpenIM 同步桥接运维、OpenIM 回调配置、文件清理策略、企业容量治理等。
- [x] 支付、转账、消费记录、商品订单、直播、客服、运营活动等非 IM Web 用户端功能不接入。
- [x] 好友分组、收藏表情、关注/粉丝、旧 H5 新朋友、Tigase 旧消息、旧登录/注册/账号绑定、旧群接口等暂不接入；原因已在 `research.md` 按接口组记录，避免重复接入旧链路或改变当前 Web 信息架构。
- [x] 用户隐私设置、扩展资料元信息、邮箱/手机号绑定、支付/安全资料等不属于当前首期登录/聊天/文件/好友/群管理范围，暂不接入。

### 待验收与风险

- [x] 群成员列表只读兜底已补齐：`src/hooks/useGroupMembers.ts` 现在优先调用 `/room/openim/members`，business 接口失败时改走 OpenIM SDK `getGroupMemberList`；只有 business 和 SDK 两边都失败才提示 `toast.getGroupMemberFailed`，避免群卡片或群成员入口因业务接口异常直接阻断。
- [ ] 上传、下载、预览、加好友、删好友、黑名单、群公告修改、入群审核、群设置、清空消息等 mutation/下载类动作尚未执行真实验收；后续必须由用户明确确认后再触发。
- [ ] 收藏/合并消息完整详情和写操作仍缺真实 `auditId/favoriteId/mergeId` 数据覆盖；当前只完成资源入口和部分空态/只读链路验证。
- [ ] 群管理完整验收需要真实群主或管理员账号，以及包含公告、申请、在线成员、特殊成员等数据的真实群。
- [ ] IP 限制和宵禁提示当前按 `/account/login` 失败响应文本透出；仍需后端返回真实限制错误后才能验证最终提示文案。

### 当前验证口径

- [x] 按用户最新要求，后续不新增/修改单元测试，不以单元测试或验证脚本推进本任务。
- [x] 当前可继续使用真实浏览器复测页面流程；已有复测包括登录页/注册页/忘记密码入口、账号设置修改密码入口、聊天资源只读详情、系统公告只读入口、多账号切换和基础聊天页渲染。
- [x] 当前 worktree 包含大量接入改动和未跟踪文件，后续继续在现有变更基础上推进，不回滚用户或既有改动。

### 接口数量统计

- [x] 本地 Swagger `docs/openim-swagger.json` 当前总路径数：844。
- [x] 按 Web 首期相关前缀粗筛候选路径数：130，包含 `/account/**`、`/enterprise/**`、`/friend/openim/**`、`/message/**`、`/file/**`、`/friends/**`、`/room/openim/**`、部分 `/room/**` 和 `/system/**`。该数字是候选池，不等同于必须全接；其中包含旧链路、后台治理或当前无产品入口的路径。
- [x] 当前 `src/api/**` 中实际封装的 businessRequest 唯一路径数：107。
- [x] 按模块统计：登录账号 8 个、聊天消息 19 个、文件资源 18 个、好友资料 16 个、群管理 40 个、系统公告 5 个、既有 RTC 1 个。
- [x] 按文件统计：`src/api/login.ts` 8 个、`src/api/chat.ts` 19 个、`src/api/file.ts` 18 个、`src/api/friend.ts` 16 个、`src/api/group.ts` 40 个、`src/api/announcement.ts` 5 个、`src/api/imApi.ts` 1 个。
- [x] 当前剩余未接接口已按范围归类为“不纳入本期 Web 用户端”或“待后续产品入口/真实数据确认”，详见 `research.md` 的“最新 Swagger 剩余候选审计”。

## 2026-06-19 群成员 SDK 兜底补齐

- [x] 修复群成员只读加载链路：`useGroupMembers` 不再在 `/room/openim/members` 失败时直接 toast，而是使用 OpenIM SDK `getGroupMemberList` 作为只读兜底。
- [x] 保持 businessApi 优先，便于读取业务侧成员扩展字段；SDK 仅作为异常兜底，不改变已有群成员业务接口接入策略。
- [x] 错误提示从裸字符串 `getMemberFailed` 改为现有国际化文案 `toast.getGroupMemberFailed`；只有 businessApi 和 SDK 都失败时才提示。
- [x] 真实浏览器刷新 `http://127.0.0.1:7777/index.html#/chat` 后应用正常加载，无 Vite 编译遮罩；当前登录态已过期并回到 `#/login`，控制台出现既有登录过期提示。
- [x] 用户确认继续后，真实浏览器使用 `18888888888` 登录成功进入 `#/chat`；打开通讯录 -> 我的群组 -> 群 `啊啊i`，群卡片正常显示 `ID：4011035808`、`群成员：3` 和“发送消息”，未再出现 `getMemberFailed` 或“获取群成员失败”提示。
- [x] 本轮群卡片复测仅触发登录和只读群信息/成员加载，未点击发送消息、未触发加好友/入群审核/群设置保存等远端 mutation。

## 2026-06-19 群管理只读入口复测与入群审核修正

- [x] 真实浏览器从群卡片进入群会话 `sg_4011035808`，打开右上角群设置抽屉，群公告、入群审核、特殊成员、群助手、群二维码、在线成员、群消息免打扰、群聊置顶、清空聊天记录、群权限和消息销毁相关入口均可见。
- [x] 在线成员只读入口可打开弹窗，无 `getMemberFailed`、`获取群成员失败` 或 `/room/openim/**` 相关控制台错误。
- [x] 特殊成员只读入口可打开弹窗，无成员相关控制台错误；未点击“设为普通/隐身/监控”等写操作。
- [x] 入群审核首次复测显示“请求参数验证失败，缺少必填参数或参数错误”；源码审计确认当前实现额外默认传 `status: 0`，而接口文档唯一必填为 `roomId`。已将 `GroupBusinessEntrances.tsx` 的入群审核查询收敛为 `roomId + pageIndex + pageSize`，不再默认传状态过滤。
- [x] 修正后真实浏览器重新从通讯录 -> 我的群组 -> 群 `啊啊i` 进入群会话并打开入群审核，弹窗显示空态“未搜索到相关结果”，不再出现参数校验错误；未点击同意/拒绝。
- [x] 群公告只读入口可打开弹窗，当前返回空态“未搜索到相关结果”；未点击编辑、删除或保存。
- [x] 本轮未运行单元测试或验证脚本，未修改测试文件；浏览器验证仅触发登录和只读查询，未触发群公告修改、入群审核处理、特殊成员设置、群免打扰/置顶/清空消息等远端 mutation。

## 2026-06-19 群助手、群二维码和群资源只读复测

- [x] 群助手入口可打开弹窗，显示“已添加助手”和“可添加助手”两个区域，当前均为空态“未搜索到相关结果”；未点击添加、移除、关键字新增/修改/删除等写操作。
- [x] 群二维码入口可打开弹窗，展示生成群二维码、有效小时、解析群二维码、二维码内容输入、申请理由和禁用态“申请加入”按钮；未点击生成、解析或申请加入。
- [x] 群会话头部聊天资源入口可打开“聊天资源”弹窗，收藏消息 Tab 当前为空态，无接口参数错误。
- [x] 群共享文件 Tab 当前为空态“未搜索到相关结果”，无 `/room/openim/shares` 或文件资源相关错误；未点击新增、删除或下载。
- [x] 群文件资源 Tab 当前为空态“未搜索到相关结果”，无文件资源相关错误；未点击容量概览、下载、删除、详情或引用状态。
- [x] 本轮仍未运行单元测试或验证脚本，未修改测试文件；浏览器操作均为只读打开/切换 Tab，未触发远端 mutation 或本地下载。

## 2026-06-19 联系人与黑名单只读复测

- [x] 真实浏览器打开通讯录首页，好友列表正常展示 `橙子皮1`、`橙子皮4`，无 `/friends/list`、`/friends/get` 或用户资料相关错误。
- [x] 打开好友 `橙子皮1` 卡片，能显示“个人信息”、备注、手机号和“发送消息”按钮；未点击发送消息、备注编辑、加入黑名单或解除好友。
- [x] 打开 `#/contact/newFriends`，新朋友列表返回真实数据：包含 `10000002907853` 的等待验证记录，以及 `橙子皮4`、`橙子皮1` 的已同意记录；未点击同意或拒绝。
- [x] 打开 `#/contact/groupNotifications`，群通知页面正常渲染，当前无可见申请数据，无群申请相关错误；未触发同意/拒绝。
- [x] 从头像菜单 -> 账号设置 -> 通讯录黑名单打开黑名单弹窗，当前为空态“暂无数据”，无 `/friends/queryBlacklistWeb` 或黑名单相关错误；未点击移除。
- [x] 本轮仍未运行单元测试或验证脚本，未修改测试文件；浏览器操作均为只读查看，未触发加好友、删好友、拉黑、移出黑名单或群申请处理。

## 2026-06-19 聊天记录搜索只读复测

- [x] 真实浏览器保持在群会话 `sg_3413653759`，打开头部“聊天记录搜索”弹窗，搜索输入框和空态正常渲染。
- [x] 在搜索框输入关键词 `qq` 后，弹窗保持显示关键词和空态“未搜索到相关结果”，未出现“请求参数验证失败”、参数错误或页面崩溃。
- [x] 真实浏览器进入已有单聊会话 `si_10000003_10000009`，打开头部“聊天记录搜索”弹窗并输入关键词 `qq`，同样正常显示空态，未出现参数校验错误或页面崩溃。
- [x] 本轮仅验证搜索查询链路和空态展示，未点击收藏、合并保存、跳转消息、转发或其他写操作。
- [x] 浏览器控制台同时观察到既有 OpenIM token 刷新失败/登录过期日志，但页面未跳转登录页、未出现可见登录过期遮罩；该项归入后续登录态稳定性风险继续观察。
- [x] 本轮仍未运行单元测试或验证脚本，未新增或修改测试文件。

## 2026-06-19 单聊设置和资源只读复测

- [x] 真实浏览器从左侧会话列表进入已有单聊 `si_10000003_10000006`，会话页正常显示历史消息和“你们已经成为好友，可以开始聊天了！”提示。
- [x] 打开单聊设置抽屉，能看到屏蔽该会话、置顶、定期删除消息记录、加入黑名单、解除好友等入口；未切换任何开关，未选择保存时长，未点击加入黑名单或解除好友。
- [x] 打开单聊“聊天资源”弹窗，收藏消息、已保存合并消息、文件资源三个 Tab 均正常显示空态“未搜索到相关结果”，未出现参数校验错误或页面崩溃。
- [x] 本轮仅触发单聊只读加载和资源列表查询，未触发加黑、删好友、置顶、免打扰、定期删除、下载、详情、删除资源等 mutation/下载动作。
- [x] 本轮仍未运行单元测试或验证脚本，未新增或修改测试文件。

## 2026-06-19 添加好友/添加群组只读搜索复测

- [x] 真实浏览器打开顶部 `+` 菜单 -> 添加好友，输入 `18888888866` 和 `18888888888` 后均返回空态“未搜索到相关结果”，未出现参数校验错误；未点击发送好友申请。
- [x] 源码核对确认添加好友搜索当前先走 `/friends/page` 的 `keyword` 查询，空结果后兜底 `/user/getByAccount?account=keyword`；手机号未命中更偏向后端数据或查询口径问题，而不是前端漏参。
- [x] 添加好友搜索补充公开用户搜索兜底：在通讯号 `/user/getByAccount` 未命中后，调用 Swagger 中的 `/user/public/search/list?keyWorld=`，并补齐 `account/telephone/phoneNumber/userID` 命中判断。
- [x] 添加好友搜索补充本地好友兜底：当前账号 `friendList` 中已存在的用户可按 `userID/phoneNumber/telephone/account` 直接打开用户卡片，避免已在通讯录的数据被远端搜索口径影响。
- [x] 为 `/user/getByAccount`、`/user/public/search/list`、`/friends/page` 添加短超时，且当前 userID 读取超时后跳过好友分页，避免搜索弹窗被非核心兜底链路长时间阻塞。
- [x] 搜索弹窗提交方式改为标准 `form onSubmit`，确认按钮设置 `htmlType="submit"` 并保留显式 `onClick`，按钮和表单区域均排除拖拽拦截。
- [x] 真实浏览器强刷后输入 `18888888888` 并点击确认，确认按钮进入 loading 后恢复，未出现参数校验错误；当前仍未命中用户卡片，归为远端用户搜索数据/手机号查询口径待确认。
- [x] 真实浏览器继续在添加好友弹窗搜索当前本地好友 ID `10000006`，可直接打开 `橙子皮1` 用户卡片，显示“个人信息”、ID、备注、手机号字段和“发送消息”按钮；未点击发送消息或发送好友申请。
- [x] 真实浏览器打开顶部 `+` 菜单 -> 添加群组，输入已知群 ID `4011035808` 首次返回“请求参数验证失败，缺少必填参数或参数错误”。
- [x] 对照 Swagger 后，将群详情只读查询从 POST 收敛为 GET，并保留 `/room/openim/detail` 失败后兜底 `/room/getRoom`，两者均按文档传 query `roomId`。
- [x] 修改后真实浏览器刷新并分别搜索 `4011035808`、`3413653759`，参数校验错误不再出现，但弹窗仍停留在确认态，未打开群卡片；该项暂记为后端群 ID 口径或返回结构需继续确认。
- [x] 添加群组搜索补充本地已加入群兜底：当业务群详情查询返回空或报错时，先从当前账号 `groupList` 按 `groupID` 匹配，命中后直接打开群卡片，避免已加入群因后端搜索口径差异无法展示。
- [x] 群详情搜索兜底补强：`/room/openim/detail` 请求失败或返回空数据时都会继续尝试 `/room/getRoom`；搜索弹窗提交入口统一到 `form onSubmit`，移除按钮和 `Input.Search` 的重复触发，避免一次搜索发起多次查询。
- [x] 真实浏览器刷新后重新打开顶部 `+` 菜单 -> 添加群组，搜索 `4011035808` 可打开群卡片，显示 `啊啊i`、`ID：4011035808`、`群成员：3` 和“发送消息”；未点击发送消息或申请加入。
- [x] 本轮未触发加好友申请、入群申请、创建群聊等 mutation；仅执行搜索查询和页面打开动作，未运行单元测试或验证脚本，未新增或修改测试文件。

## 2026-06-19 图片预览只读复测

- [x] 尝试复测群消息已读详情时，当前可见群会话 `sg_3413653759` 只有“创建了群聊”“转让了群主给橙子皮4”等系统通知，右键无消息菜单，暂缺可触发 `/room/openim/message/read-detail` 的普通群消息数据。
- [x] 真实浏览器进入已有单聊 `si_10000003_10000009`，历史消息中存在两条图片消息和“预览”入口。
- [x] 点击第一条图片消息“预览”后，图片预览弹窗正常打开，实际显示山景图片，底部缩放/旋转/翻转工具条可见；未出现新增参数错误或页面崩溃。
- [x] 关闭图片预览弹窗后页面回到单聊会话，无残留遮罩；本轮未点击下载、未上传文件、未发送消息、未触发远端 mutation。
- [x] 本轮仍未运行单元测试或验证脚本，未新增或修改测试文件。

## 2026-06-19 单聊消息保存时长只读复测

- [x] 源码确认单聊设置中“定期删除消息记录”下拉仅在选择新值时调用 `/friends/update` 的 `chatRecordTimeOut` 字段，单纯打开下拉不会提交远端请求。
- [x] 真实浏览器在单聊 `si_10000003_10000009` 打开右上角设置抽屉，能看到“屏蔽该会话”“置顶”“定期删除消息记录”“加入黑名单”“解除好友”等入口。
- [x] 仅展开“定期删除消息记录”下拉，选项显示“关闭、7天、30天、90天”，当前值为“关闭”；未选择任何新值。
- [x] 使用 Esc 关闭下拉和设置抽屉，未触发 `/friends/update`、免打扰、置顶、加入黑名单或解除好友等 mutation。
- [x] 本轮仍未运行单元测试或验证脚本，未新增或修改测试文件。

## 2026-06-20 接口契约继续审计

- [x] 全量比对 `src/api/**` 中业务请求路径与 `docs/openim-swagger.json`：此前源码中不在最新 Swagger 的路径为历史兜底 `/account/password/reset` 和既有 RTC 旧能力 `/user/rtc/get_token`；后续已移除 `/account/password/reset`，当前仅保留不在 Web 首期范围内的 RTC 旧能力 `/user/rtc/get_token`。
- [x] 复核群管理高风险路径：`/room/openim/detail`、`/room/getRoom`、`/room/openim/shares`、`/room/openim/share/add`、`/room/openim/group-helpers/**`、`/room/openim/qr/**` 当前封装的参数位置和必填字段与 Swagger 一致。
- [x] 复核聊天资源路径：收藏、合并消息、文件资源、文件引用状态/关系、文件存储概览等列表和详情接口的参数名、默认分页、`deleted`、`roomId` 均在 Swagger 定义内。
- [x] 复核写操作确认链路：群助手增删改、二维码入群、成员备注、收藏编辑/删除、合并消息删除、文件资源删除、群共享文件删除、文件下载均在确认入口后触发；文件引用失效只在用户已确认发送但被发送前置校验拒绝、或用户确认撤回后作为清理动作触发。
- [x] 复核选择器群管理动作：邀请入群、踢出成员、转让群主均要求同时具备 OpenIM `groupID` 和业务 `roomId`，缺失时不调用远端；合并消息转发前置接口的 `targetId` 文档定义为 OpenIM `userID/groupID`，当前实现符合 Swagger。
- [x] 复核加群卡片：`/room/join` Swagger 只定义 `roomId` 和 `type`，不定义申请理由字段；当前不把旧 UI 输入的申请理由透传为未知参数，保持接口契约收敛。
- [x] 详细记录已写入 `2026-06-20-contract-audit.md`；本轮未运行单元测试、构建或验证脚本，未触发真实 mutation/下载。

## 2026-06-20 剩余候选接口复扫

- [x] 用更宽的源码匹配重新统计业务接口封装，修正上一轮 99 的漏统结果：当前 `src/api/**` 实际封装 `businessRequest` 唯一路径数为 104。
- [x] 按 Web 用户端可能相关前缀从最新 Swagger 粗筛 202 个候选路径，其中 100 个仍未在源码封装；逐组复核后仍归类为“不接入本期 Web 用户端”或“待产品入口/后端契约明确后再接”。
- [x] 核对当前 UI 入口：用户卡片、个人资料编辑、好友备注、黑名单、新朋友列表、系统公告均已有业务接口或 businessApi + SDK 合并链路，未发现新的可直接落地缺口。
- [x] 确认两个带申请说明输入框但不透传说明的入口符合当前 Swagger：`/friends/add` 只定义 `toUserId`，`/room/join` 只定义 `roomId/type`，因此不发送未知参数。
- [x] 详细记录已写入 `2026-06-20-remaining-candidates-rescan.md`；本轮仍未运行单元测试、构建或验证脚本，未触发真实 mutation/下载。

## 2026-06-20 单聊消息保存时长选项补齐

- [x] 继续复核 `/friends/update` 的 `chatRecordTimeOut` 契约，确认 Swagger 明确包含 `1.0=1天`，相关字段说明同时给出 `365.0=保存一年`。
- [x] 单聊设置“定期删除消息记录”下拉在现有关闭、7 天、30 天、90 天基础上补充 1 天和 365 天选项，提交值分别为 `1.0`、`365.0`。
- [x] 旧值兼容逻辑保持不变：`0/-1` 展示为 `-1.0`，整数天数展示为 `*.0`。
- [x] 详细记录已写入 `2026-06-20-single-chat-timeout-options.md`；本轮未运行单元测试、构建或验证脚本，未触发 `/friends/update` 或其他真实 mutation；尝试连接真实 Chrome 复测时桌面控制通道不可用，未完成浏览器复测。

## 2026-06-20 添加好友搜索匹配项选择修正

- [x] 复核添加好友搜索链路：本地好友兜底后依次调用 `/user/getByAccount`、`/user/public/search/list` 和 `/friends/page`。
- [x] 修正搜索结果选择逻辑：业务接口返回多条用户时，不再只取第一条，而是在 `userID/phoneNumber/telephone/account` 中查找与输入关键词精确匹配的用户。
- [x] 修正公开搜索兜底顺序：`/user/public/search/list` 只有存在精确匹配用户时才截断链路；如果只返回模糊结果或非目标用户，继续尝试 `/friends/page`。
- [x] `/friends/page` 兜底查询从 `pageSize: 1` 调整为 Swagger 默认 `pageSize: 10`，并在 API 层优先返回精确匹配用户，降低手机号/通讯号搜索被首条模糊结果漏掉的概率。
- [x] 找不到精确匹配时仍保持空态，避免把模糊搜索结果误展示为目标用户；未改变 `/friends/add` 发送好友申请入口。
- [x] 详细记录已写入 `2026-06-20-friend-search-match-selection.md`；本轮未运行单元测试、构建或验证脚本，未触发真实加好友或其他 mutation；尝试连接真实 Chrome 复测时桌面控制通道仍不可用，未完成浏览器复测。

## 2026-06-20 聊天记录搜索本地只读兜底

- [x] 继续处理 Trellis 待确认差异：业务聊天记录搜索返回空，但当前会话本地历史中可能可见匹配消息。
- [x] 聊天记录搜索仍优先调用业务接口：单聊 `/friend/openim/messages/search`，群聊有业务 `roomId` 时调用 `/room/openim/messages/search`。
- [x] 当业务搜索结果为空时，页面使用 OpenIM SDK `getAdvancedHistoryMessageList` 读取当前会话最近 100 条历史并按关键词本地过滤，作为只读展示兜底。
- [x] 当业务搜索接口报错时，页面也会继续尝试 SDK 本地历史只读兜底；只有本地兜底也没有结果时才提示业务搜索错误。
- [x] 本地兜底结果标记为 `__localSearchResult` 且不提供业务 `auditId`，因此不会显示收藏、合并预览、保存合并消息、合并收藏等写操作入口。
- [x] 详细记录已写入 `2026-06-20-chat-search-local-fallback.md`；本轮未运行单元测试、构建或验证脚本，未触发真实搜索页面复测或任何 mutation；尝试连接真实 Chrome 复测时桌面控制通道仍不可用，未完成浏览器复测。
- [x] 继续扩展 SDK 本地历史只读兜底的文本提取字段：高级文本、首层引用消息、文件/图片/视频/语音链接、名片昵称和 userID、合并消息标题和摘要、位置描述、自定义消息描述/data/extension、通知 detail、typing 提示和原始 `content` 均纳入关键词匹配；本地结果仍不生成 `auditId`，不暴露写操作入口。

## 2026-06-20 最新 Swagger 支持性核对

- [x] 已从 `http://47.238.134.161:8092/v2/api-docs` 重新保存最新 Swagger JSON 到 `docs/openim-swagger.json`；改用原始字节 `-OutFile` 保存，避免 PowerShell `.Content` 造成中文摘要乱码。
- [x] 已确认 Web 用户端核心需求相关接口在最新 Swagger 中存在：登录、用户搜索/加好友、单聊/群聊聊天记录搜索、收藏/合并消息、入群、群成员/公告、文件上传/签名下载。
- [x] 聊天记录搜索接口文档明确数据来自“已落库 OpenIM 消息审计”；因此当前实现保持业务接口优先，SDK 本地历史只读兜底仅用于审计数据为空时展示本地可见消息，不生成 `auditId`，不开放收藏/合并写入口。
- [x] 详细记录已写入 `2026-06-20-swagger-support-audit.md`；本轮未运行单元测试、构建或验证脚本，未触发登录、发送、加好友、上传、下载、收藏、合并、删除或审核等真实 mutation。

## 2026-06-20 最新 Swagger 未支持路径反扫

- [x] 已对当前源码中的业务接口路径做反向扫描，定位“代码调用但最新 Swagger 不存在”的接口。
- [x] 已移除找回密码历史兜底 `/account/password/reset`：`useReset` 现在只调用最新 Swagger 支持的 `/user/password/reset`；忘记密码页面会在验证码校验成功后前置检查 `serial/deviceSerial/deviceID/deviceId`，缺失时停留在验证码步骤并提示错误，不再进入新密码表单或请求旧接口；请求层公开路径白名单同步移除旧路径。
- [x] 复扫后仅剩 `/user/rtc/get_token`。最新 Swagger 只提供 `/user/openMeet`（获取视频会议地址，参数 `toUserId/area`），不能直接替代当前 LiveKit 所需的 `{ serverUrl, token }`；音视频通话不在本次 Web 用户端首期明确功能清单内，暂不强行迁移。
- [x] 浏览器只读打开登录页“忘记密码”入口，页面正常展示手机号、验证码、发送验证码和下一步按钮，控制台 0 error；未点击发送验证码或下一步，未触发真实 reset 流程。
- [x] 详细记录已写入 `2026-06-20-unsupported-path-sweep.md`；本轮未运行单元测试、构建或验证脚本，未触发登录、找回密码、音视频呼叫或其他真实 mutation。

## 2026-06-20 消息列表分页默认值

- [x] 继续按最新 Swagger 复核分页接口，确认 `/message/favorites` 和 `/message/merge/saved` 均支持 `pageIndex/pageSize`。
- [x] `src/api/chat.ts` 的 `getFavoriteMessages`、`getSavedMergeMessages` 已在封装层补默认 `pageIndex: 0`、`pageSize: 20`，调用方传入参数仍可覆盖默认值。
- [x] 详细记录已写入 `2026-06-20-message-list-pagination-defaults.md`；本轮未运行单元测试、构建或验证脚本，未触发消息收藏、合并消息列表查询或任何 mutation。

## 2026-06-20 业务接口代理配置复核

- [x] `.env` 当前配置为 `VITE_CHAT_URL=/business-api`、`VITE_BUSINESS_API_TARGET=http://47.238.134.161:8092`、`VITE_API_URL=http://47.238.134.161:10002`、`VITE_WS_URL=ws://47.238.134.161:10001`。
- [x] `vite.config.ts`、`vite.web.config.ts`、`vite.legacy.config.ts` 均通过 `createBusinessApiProxy(mode)` 注入 `/business-api` 代理，`vite.proxy.ts` 会移除 `/business-api` 前缀并转发到业务后端。
- [x] `src/api/business.ts` 使用 `import.meta.env.VITE_CHAT_URL`，因此业务接口通过 proxy 访问，不直接跨域请求 `http://47.238.134.161:8092`。
- [x] 详细记录已写入 `2026-06-20-proxy-config-audit.md`；本轮未运行单元测试、构建或验证脚本，未触发任何远端业务接口请求或 mutation。

## 2026-06-20 文件下载/预览契约复核

- [x] 复核 `/file/sign`、`/file/download`、`/file/preview`、`/file/resources/detail`、`/file/resources/references`、`/file/reference/status` 调用链，确认签名下载/预览必须先具备业务 `fileId`，且继续调用下载/预览前会校验 `fileId/expiresAt/signature`。
- [x] 图片/视频消息预览仅在消息 `ex` 能解析出业务 `fileId` 时走业务签名预览；否则回退 OpenIM SDK URL。
- [x] 文件气泡下载和消息右键下载均保持二次确认后执行；本轮未触发真实下载。
- [x] `src/api/file.ts` 的 `triggerBusinessFileDownload` 已将 blob URL 释放改为点击下载链接后的异步释放，避免过早 revoke 影响浏览器下载启动。
- [x] 详细记录已写入 `2026-06-20-file-download-preview-contract.md`；本轮未运行单元测试、构建或验证脚本，未触发上传、下载、预览、删除或其他真实 mutation/下载动作。

## 2026-06-20 Web 端接口支持性矩阵与群成员管理补齐

- [x] 按最新 `docs/openim-swagger.json` 重新判断接口是否支持：Swagger 当前 844 个路径；`src/api/**` 当前业务请求唯一路径 106 个；源码仍不在最新 Swagger 的业务路径仅剩既有 RTC `/user/rtc/get_token`，该能力不属于本次 Web 用户端首期清单。
- [x] 将 Web 首期登录、聊天、文件、好友、群管理、群助手、系统公告等需求按“Swagger 支持/部分支持/无用户端契约”写入 `2026-06-20-web-api-support-matrix.md`。
- [x] 补接 Swagger 明确支持且贴近“群成员管理”的三个用户端接口：`/room/openim/member/remark/delete`、`/room/openim/member/mute`、`/room/openim/member/unmute`。
- [x] 群成员备注保存为空时改走清空备注接口；群主/管理员可对低角色成员打开禁言/解禁入口；提交前仍有二次确认，避免误触真实 mutation。
- [x] 补齐业务群成员角色归一化：新增 `src/utils/groupMember.ts`，将旧系统 `1/2/3/4/5` 映射到 OpenIM `100/60/20`，并让成员列表 hook 与会话 store 共用，避免管理员误判群主或普通成员。
- [x] 继续复扫 Swagger 中有文档但当时 Web 首期无产品入口的候选：`/user/notification/settings/**`、`/room/openim/robot/**`、`/room/openim/red-packet/**`、`/friendGroup/**`。其中通知设置已在后续接入个人设置“消息提示”；机器人、红包和好友分组仍不新增产品面，结论已写入支持矩阵。
- [x] 必填参数契约复扫已写入 `2026-06-20-required-param-rescan.md`：确认 `/friends/remark` 的 `describe`、群公告 `noticeContent`、群助手 `keyWordId`、入群审核 `action`、特殊成员 `role`、成员禁言 `durationSeconds`、签名下载/预览字段均按 Swagger 传参。
- [x] 复测方式遵守用户约束：未运行单元测试、构建或验证脚本；仅用 Playwright CLI 做登录页只读快照，页面正常渲染，控制台 0 errors，1 warning（既有 npm warning），未登录真实账号，未触发禁言/解禁/清空备注等 mutation。

## 2026-06-20 群管理员接口支持性与接入

- [x] 复核最新 `docs/openim-swagger.json`：没有新的用户端 `/room/openim/member/set-admin`；存在旧用户端 `/room/set/admin`，summary 为“设置/取消 管理员”，参数为 `roomId/touserId/type`，其中文档字段拼写为 `touserId`。
- [x] 明确不接后台 `/console/enterprise/rooms/member/set-admin`、`/console/platform/rooms/member/set-admin`，因为它们需要 `confirmToken`，属于后台/平台范围，不属于本次 Web 用户端接入。
- [x] `src/api/group.ts` 新增 `setBusinessGroupAdmin` 封装 `/room/set/admin`；Web 端只传 `type=2` 设管理员、`type=3` 取消管理员，不开放 `type=1` 写入创建者。
- [x] `GroupMemberList` 新增群主可见的“设为管理员/取消管理员”入口：仅群主可对普通成员或管理员操作，不能对自己或群主成员操作；提交前保留二次确认。
- [x] 详细记录写入 `2026-06-20-group-admin-support.md`；本轮未触发真实设管理员/取消管理员 mutation。

## 2026-06-20 管理员接入后业务路径反扫

- [x] 反扫 `src/**/*.ts`、`src/**/*.tsx` 中通过 `businessRequest` 调用的静态业务路径：当前唯一路径数为 107。
- [x] 新增 `/room/set/admin` 已确认存在于最新 Swagger；当前源码仍只有既有 RTC `/user/rtc/get_token` 不在最新 Swagger，继续按非本期 Web 用户端首期能力处理。
- [x] `research.md` 的“旧群接口”审计已同步为：默认不重复接旧群链路，但 `/room/set/admin` 是管理员设置例外，因为最新 Swagger 没有新的用户端 `/room/openim/member/set-admin`。
- [x] `GroupMemberList` 的管理员按钮角色判断补充数字归一，避免后端/SDK 返回字符串角色值时误判群主或管理员。
- [x] 浏览器只读快照 `http://127.0.0.1:7777/index.html#/login` 正常渲染，控制台 0 errors、1 warning（既有 npm project config warning）；未登录、未触发真实设管理员/取消管理员 mutation。
- [x] 详细记录写入 `2026-06-20-post-admin-path-audit.md`。

## 2026-06-20 SDK 登录并发去重

- [x] 用测试账号 `18888888888 / czp0422+` 做浏览器登录复测时，页面先进入 `#/chat`，随后因 OpenIM SDK `TokenKickedError` 回到登录页；日志显示同一账号同一 token 在短时间内触发了两次 `IMSDK.login`。
- [x] `src/layout/useGlobalEvents.tsx` 新增模块级 `loginOpenIMSDKOnce(userID, token)`，同一 `userID + token` 已有登录 Promise 进行中时直接复用，避免前端并发重复调用 SDK 登录。
- [x] 继续收敛顺序重复登录：同一 `userID + token` 已登录成功后再次挂载不再调用 SDK login；SDK 返回 `10102 User has logged in repeatedly` 时按幂等成功处理并继续 `initStore()`，不再打印 error 或回退登录页。
- [x] Electron 与 Web 登录参数保持原样；该修复不改变 `/account/login`、业务 `access_token`、OpenIM token 的使用方式。
- [x] 修复后重新登录 `18888888888`：页面稳定停留在 `#/chat`；新增日志区间只出现 1 次 `SDK => run login with args`；继续观察的新日志区间为 `loginCount=0`、`kickedCount=0`、`errorLineCount=0`。
- [x] 补充已登录幂等处理后，从群聊 `#/chat/sg_4011035808` 切到通讯录 `#/contact`，新增日志区间为 `loginCount=0`、`repeatedLogin10102=0`、`kickedCount=0`、`errorLineCount=0`。
- [x] 详细记录写入 `2026-06-20-sdk-login-dedup.md`。

## 2026-06-20 真实联系人和群数据只读验收

- [x] 使用账号 `18888888888 / czp0422+` 登录后打开通讯录，真实好友列表显示 `橙子皮1`、`橙子皮4`，覆盖联系人 SDK + businessApi 合并列表渲染。
- [x] 打开 `我的群组`，在“我创建的”筛选下显示真实群 `啊啊i` 和 `橙子皮、橙子皮1、橙子皮4`，成员数均为 3。
- [x] 打开群 `啊啊i` 卡片，只读详情显示 `ID：4011035808`、创建日期 `2026/6/7`、成员 `aaa`、`橙子皮1`、`橙子皮4`；该卡片触发群成员只读加载，未点击加群或提交类动作。
- [x] 点击群卡片“发送消息”仅进入会话 `#/chat/sg_4011035808`，未发送消息；群聊页显示群名 `啊啊i`、成员数 3、聊天头部搜索/资源入口和输入区。

## 2026-06-20 群共享文件 roomId 防护

- [x] 真实浏览器登录 `18888888888 / czp0422+` 后打开群会话 `#/chat/sg_3413653759`，聊天资源弹窗原先显示“群共享文件”Tab，但因当前群没有明确业务 `roomId`，切换后未发起 `/room/openim/shares`，只显示无请求空态。
- [x] 保持既有 roomId 契约：不把 OpenIM `groupID` 直接当作 businessApi `roomId`；此前已确认 `/room/openim/detail`、`/room/openim/members` 不能无条件使用 SDK `groupID`。
- [x] `ChatBusinessResources` 改为只有 `conversation.groupID` 且 `businessRoomId` 都存在时才展示“群共享文件”Tab；若当前停留在 `groupShares` 但业务 `roomId` 丢失，则自动切回“文件资源”。
- [x] HMR 后同一群会话资源弹窗不再显示“群共享文件”Tab；文件资源 Tab 返回两条真实 `chuanxi.jpg`。
- [x] 只读复测文件资源详情、引用状态和引用关系均通过 `/business-api` 代理返回 200：`/file/resources/detail`、`/file/reference/status`、`/file/resources/references`；未点击下载、删除、上传、发送或其他 mutation。
- [x] 同一群会话搜索“在不在”显示 SDK 本地历史结果；因无明确业务 `roomId`，未调用 `/room/openim/messages/search`，该行为属于 roomId 防护下的只读兜底。
- [x] 详细记录写入 `2026-06-20-group-shares-roomid-guard.md`。

## 2026-06-20 群业务入口保留与 groupID 兜底

- [x] 根据用户最新要求撤回“缺显式业务 `roomId` 时隐藏入口”的方向，改为入口保留：显式业务 `roomId` 优先，缺失时用 OpenIM `groupID` 作为 `roomId` 兜底传给 businessApi，等待后端兼容。
- [x] 已覆盖聊天头部群邀请、群设置添加/移除成员、群成员列表邀请入口、群主转让、群业务入口、群卡片、申请列表群卡片、群详情/当前成员读取、群成员列表读取、群共享文件 Tab、群消息发送前校验、群文件上传上下文、群共享文件同步、消息收藏/撤回/已读详情等调用点。
- [x] 成员列表读取保留 SDK 只读兜底：当仅使用 `groupID` 兜底且业务成员接口报错或首屏空数据时，不打空当前群成员展示。
- [x] 只读接口支持性确认：`/room/openim/detail`、`/room/openim/members`、`/room/openim/shares` 使用 `roomId=3413653759` 当前均返回 HTTP 200 但业务体为 `resultCode=1010101`、`resultMsg=请求参数验证失败，缺少必填参数或参数错误`，说明后端暂未兼容 OpenIM `groupID` 作为业务 `roomId`。
- [x] 本机 Chrome 只读复测 `#/chat/sg_3413653759`：聊天头部群邀请图标存在；聊天资源弹窗包含“群共享文件”Tab；切换后发起 `/business-api/room/openim/shares?...roomId=3413653759`；群设置中“添加”成员入口和群公告/入群审核/在线成员等群业务入口存在。
- [x] 详细记录写入 `2026-06-20-group-roomid-fallback-entry.md`；本轮未运行单元测试、构建或验证脚本，未触发发送、上传、下载、删除、审核、清空、退出、转让、设管理员等真实 mutation 或下载动作。

## 2026-06-20 消息转发 auditId 契约收敛

- [x] 复核 Swagger `/message/merge/forward-before`：必填 `auditIds` 明确为消息审计 ID，不是 OpenIM `clientMsgID/serverMsgID`。
- [x] `ChooseModal` 的 `FORWARD_MESSAGE` 入口改为只有能从消息对象或 `message.ex` 解析到业务审计 ID 时才调用 `/message/merge/forward-before`；没有审计 ID 的本地 SDK 消息直接回退 OpenIM SDK `createForwardMessage` + `sendMessage`。
- [x] 这样保留已落库审计消息的业务转发前置能力，同时避免把本地消息 ID 伪装成审计 ID 导致业务接口拒绝并阻断普通转发。
- [x] 详细记录写入 `2026-06-20-forward-auditid-contract.md`；本轮未运行单元测试、构建或验证脚本，未在浏览器中触发真实转发发送。

## 2026-06-20 保留群业务入口

- [x] 根据用户最新要求，群业务入口继续保留，后续接口实现由用户调整。
- [x] `GroupSettings` 不再把 `businessRoomId` 是否存在作为 `GroupBusinessEntrances` 的渲染门槛；只要当前是已加入群，就展示群公告、入群审核、特殊成员、群助手、群二维码、在线成员等入口。
- [x] 传给业务接口的 `roomId` 仍按“显式业务 `roomId` 优先，OpenIM `groupID` 兜底”处理；本次不新增接口、不修改后端契约。
- [x] 详细记录写入 `2026-06-20-preserve-group-business-entry.md`；本轮未运行单元测试、构建或验证脚本，未触发真实 mutation 或下载动作。

## 2026-06-20 覆盖清单对齐

- [x] 复核 `scripts/verify-web-api-coverage.mjs`，发现 `expectedWebApiPaths` 仍停留在早期 Web 接入清单，未覆盖当前已经接入的系统公告、群助手、群二维码、群共享、文件资源扩展、群成员禁言/解禁、管理员设置等接口。
- [x] 已将当前 `src/api/**` 已封装且属于 Web 用户端范围的 Swagger 路径补入 `expectedWebApiPaths`，避免后续把真实已接接口误判为意外源码接口。
- [x] `room/openim/qr/create|resolve|join` 已存在于最新 Swagger，改为正式期望接口；旧 `/account/password/change`、`/account/password/reset` 不再作为非 Swagger 例外。
- [x] `allowedSourceNotInSwaggerPaths` 仅保留既有 RTC `/user/rtc/get_token`；本轮未运行覆盖脚本、单元测试、构建或任何验证脚本，未触发真实 mutation 或下载动作。

## 2026-06-20 invitationCode 非必填收敛

- [x] 按用户此前要求复核登录/注册/验证码参数，发现当前实现仍把固定企业号同时写入 `invitationCode`。
- [x] `normalizeAccountCodeParams`、`normalizeLoginParams`、`normalizeRegisterParams` 已收敛为固定传 `enterpriseCode: "LOCALTEST001"`，不再默认传 `invitationCode: "LOCALTEST001"`。
- [x] 登录/注册表单字段从 `invitationCode` 改为 `enterpriseCode`，文案从“企业号/邀请码”改为“企业号”；类型层面保留 `invitationCode` 可选字段用于兼容历史调用。
- [x] 接口契约脚本中的过期描述同步为固定 `enterpriseCode`；本轮未运行脚本、单元测试或构建，未触发真实登录、注册、验证码发送或其他远端 mutation。
- [x] 本机 Chrome/Playwright 只读复测登录页：页面正常渲染，显示“企业号”，不再显示“企业号/邀请码”，无 Vite overlay，控制台 0 error。

## 2026-06-20 群权限字段补齐

- [x] 复核 `/room/update` Swagger 字段后，补齐 Web 群权限设置里仍缺少但与当前群管理能力直接相关的权限项。
- [x] `RoomSettingsParams` 新增 `allowEditNickname`、`allowShareQR`、`showOnlineStatus`、`allowMemberPrivateChat`、`allowAddFriend`、`allowAtAll`、`allowCreateNotice`、`allowQuitRoom`。
- [x] 群设置抽屉新增“允许成员修改群昵称 / 分享群二维码 / 查看在线状态 / 成员私聊 / @全体 / 创建公告 / 退出群组”等开关，全部复用既有 `/room/update` 和二次确认保存链路。
- [x] “允许添加群成员为好友”开关按 Swagger 语义修正为优先读写 `allowAddFriend`，同时同步旧字段 `allowSendCard` 保持后端兼容，并继续同步 OpenIM SDK `applyMemberFriend`。
- [x] 群业务入口展示同步权限字段：群主/管理员始终可见；普通成员按 `allowShareQR` 控制群二维码入口，按 `showOnlineStatus` 控制在线成员入口。
- [x] 聊天输入区上传入口同步 `allowUploadFile`：单聊不受群权限影响；群主/管理员始终可见；普通群成员按业务字段控制图片、视频、文件上传入口。
- [x] 群成员用户卡片同步权限字段：查看成员资料优先读 `showMember`，加好友优先读 `allowAddFriend` 并兼容 `allowSendCard/applyMemberFriend`，发送消息按 `allowMemberPrivateChat` 控制；群主/管理员不受普通成员入口限制。
- [x] 群邀请和退群入口同步权限字段：聊天头部邀请、群设置成员行“添加”、群成员列表标题栏邀请均按 `allowInviteFriend` 控制普通成员；普通成员退群按钮按 `allowQuitRoom` 控制；群主/管理员不受普通成员入口限制。
- [x] 复核 `allowAtAll`：当前源码没有 @ 全体发送入口，仅存在 `AtAllTag` 渲染/点击保护，因此本轮只保留设置保存，不新增产品入口。
- [x] 抽出 `src/utils/businessSwitch.ts` 统一业务开关解析规则，复用到群设置、聊天输入区和用户卡片权限判断。
- [x] 新增中英文文案；本轮仅静态复核字段和本地服务 HTTP 200，Playwright/内置浏览器通道被沙箱元数据错误阻断，未运行单元测试、构建或验证脚本，未登录真实账号，未触发群权限保存或其他真实 mutation。
- [x] 详细记录写入 `2026-06-20-group-permission-expansion.md`。

## 2026-06-20 退出登录接口契约复核

- [x] 按最新 Swagger 重新核对 `/user/logout`：GET/POST 仍要求 `deviceKey`、`devicekey`、`telephone`（文档描述为 MD5 手机号）和 `access_token`。
- [x] 当前 `/account/login` Swagger 没有声明 device key 参数，也没有明确响应中的 device key 来源；Web 本地账号结构只稳定保存业务 token、OpenIM token、userID、手机号明文、区号、昵称和头像。
- [x] 为避免退出时向业务后端发送缺失或伪造设备字段的 mutation 请求，本轮不把 `/user/logout` 强接到退出按钮；当前继续 OpenIM SDK logout + 本地账号态清理。
- [x] 静态统计当前 `src/api/**` 中 `businessRequest` 唯一路径数为 107；源码仍不在最新 Swagger 的业务路径仍只有既有 RTC `/user/rtc/get_token`。
- [x] 详细记录写入 `2026-06-20-logout-contract-rescan.md`；本轮未运行单元测试、构建或验证脚本，未触发真实退出登录或其他远端 mutation。

## 2026-06-20 注册企业号校验补齐

- [x] 注册页提交 `/account/register` 前补齐企业号校验，复用登录页已有 `validateEnterpriseCodeInput`，先调用 `/enterprise/code/validate` 校验固定企业号 `LOCALTEST001`。
- [x] 企业号校验失败时前端直接提示并阻断注册请求，避免跳过企业号验证进入业务注册。
- [x] 保持 `invitationCode` 非必填收敛方向不变：登录、注册、验证码参数仍只固定传 `enterpriseCode`，不默认传 `invitationCode`。
- [x] 企业号相关前端文案同步收敛：输入提示改为“请输入企业号”，企业号校验失败提示改为“企业号无效”，不再沿用“邀请码不存在”。
- [x] 详细记录同步到 `2026-06-20-invitation-code-optional-contract.md` 和 `2026-06-20-enterprise-register-validation.md`；本轮未运行单元测试、构建或验证脚本，未触发真实注册、登录、验证码发送或其他 mutation。

## 2026-06-20 业务错误提示优先级收敛

- [x] 为登录限制提示兜底，统一业务错误文案优先级：`errMsg/resultMsg/msg/errDlt` 优先于通用 `message`。
- [x] `errorHandle` 补充 `errDlt` 兜底，`feedbackToast` 同步优先展示后端业务文本，便于 `/account/login` 返回 IP 限制、宵禁等业务原因时直接展示。
- [x] 详细记录写入 `2026-06-20-business-error-message-priority.md`；本轮未运行单元测试、构建或验证脚本，未触发真实登录或其他 mutation。

## 2026-06-20 忘记密码验证码参数前置校验

- [x] “发送验证码”前先校验 `areaCode/phoneNumber`，手机号缺失时只显示前端字段错误，不调用 `/account/code/send`。
- [x] 验证码输入改为内层 `Form.Item noStyle` 绑定实际 `Input`，并新增必填规则，避免 `/account/code/verify` 缺少 `verifyCode`。
- [x] 发送验证码按钮在倒计时或请求中禁用/显示 loading，减少重复验证码请求。
- [x] 缺少 reset `serial` 的提示改为 i18n 文案；详细记录写入 `2026-06-20-forgot-password-validation-contract.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未触发验证码发送、校验或重置密码请求。

## 2026-06-20 登录提交 payload 不原地修改

- [x] 登录表单不再直接改写 `onFinish` 收到的 `params.password`，提交 `/account/login` 时在 payload 中单独写入 MD5 后密码。
- [x] 该调整避免企业号校验失败、登录失败后重试等场景中表单值对象被污染或重复 MD5；详细记录写入 `2026-06-20-login-payload-immutability.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未触发真实登录或其他 mutation。

## 2026-06-20 手机号参数前置校验统一

- [x] 新增 `src/pages/login/rules.ts`，统一 `+86` 手机号规则：必填 + `^1\d{10}$`。
- [x] 登录、注册、忘记密码手机号字段全部接入统一规则，避免向 `/account/login`、`/account/register`、`/account/code/send`、`/account/code/verify` 提交明显非法手机号。
- [x] 注册页移除提交函数中的重复手工手机号校验，保留表单规则作为唯一入口校验；详细记录写入 `2026-06-20-phone-validation-contract.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未触发真实登录、注册、验证码发送或其他 mutation。

## 2026-06-20 重置密码 API 层防御性校验

- [x] `useReset` 补齐手机号、验证码、新密码和 `serial` 的 API 层防御性校验，避免绕过页面层时向 `/user/password/reset` 发送缺少必填参数的请求。
- [x] 移除硬编码英文 `"Missing password reset serial"`，统一使用 i18n 文案；详细记录写入 `2026-06-20-reset-api-defensive-validation.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未触发验证码发送、验证码校验、重置密码或其他 mutation。

## 2026-06-20 登录/注册响应令牌防护

- [x] `normalizeIMProfile` 和 `normalizeOpenIMTokenProfile` 的缺字段异常改为 i18n 文案，避免暴露英文技术错误。
- [x] 登录成功回调捕获 profile 归一化/保存异常并展示错误；注册成功回调改为 profile 保存成功后再提示注册成功并跳转。
- [x] 该防护覆盖 `/account/login`、`/account/register` 返回成功码但缺少业务 `access_token`、OpenIM token 或 OpenIM userID 的异常场景；详细记录写入 `2026-06-20-login-response-guard.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未触发真实登录、注册或其他 mutation。

## 2026-06-20 文件签名/下载错误提示收敛

- [x] 文件签名响应缺少 `fileId/expiresAt/signature` 或业务下载拿不到 URL 时，统一抛出 `toast.downloadFailed`，不再透出英文技术错误。
- [x] 该调整不改变 `/file/sign`、`/file/download`、`/file/preview` 的调用时机和参数；详细记录写入 `2026-06-20-file-error-message-contract.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未触发上传、下载、预览或其他 mutation/下载动作。

## 2026-06-20 通用反馈提示字符串错误兼容

- [x] `feedbackToast` 支持字符串错误直接展示，避免 `feedbackToast({ error: t("...") })` 被降级为通用“操作失败”。
- [x] `feedbackToast()` 无参数成功调用时回退到 `toast.accessSuccess`，避免显示空提示。
- [x] `errorHandle` 同步兼容字符串错误；对象错误仍优先展示 `resultMsg/errMsg/msg/errDlt/message`；详细记录写入 `2026-06-20-feedback-toast-string-error.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未触发真实业务请求或 mutation。

## 2026-06-20 群二维码有效期参数对齐

- [x] `/room/openim/qr/create` 的 `expireHours` 默认值按 Swagger 从 24 小时修正为 168 小时，并保留最大 720 小时限制。
- [x] 群二维码面板抽出 `DEFAULT_EXPIRE_HOURS`、`MAX_EXPIRE_HOURS` 常量，避免参数边界散落；详细记录写入 `2026-06-20-group-qr-expire-contract.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未生成二维码、解析二维码、扫码入群或触发其他 mutation。

## 2026-06-20 群权限 joinMethod/searchable 字段补齐

- [x] 继续复核 `/room/update` Swagger 字段，确认 `joinMethod`（0 自由加入、1 审核加入、2 禁止加入）和 `searchable`（是否可被搜索）属于当前 Web 群权限设置范围。
- [x] `RoomSettingsParams` 补齐 `joinMethod`、`searchable`、`messageDestroyContentTypes`；其中 `messageDestroyContentTypes` 当前没有 Web 产品入口，本轮只补类型契约，不新增 UI。
- [x] 群设置抽屉新增“加群方式”下拉和“允许被搜索”开关，保存仍复用既有 `/room/update`、二次确认和本地 `currentGroupInfo` 更新链路。
- [x] `joinMethod` 缺失时按既有 `isNeedVerify` 推导默认展示，避免旧数据没有该字段时 UI 空白；详细记录写入 `2026-06-20-room-update-join-method-searchable.md`。
- [x] 加群方式下拉和旧“群聊验证”开关互相同步 `joinMethod/isNeedVerify`，避免新旧字段在 `/room/update` 中写出不一致状态。
- [x] 本轮未运行单元测试、构建或验证脚本，未登录真实账号，未保存群设置或触发其他真实 mutation。

## 2026-06-20 群消息撤回时限字段接入

- [x] 继续复核 `/room/update` Swagger 字段，确认 `withdrawTime` 描述为“消息撤回的删除时间，单位秒”，与当前已接的群消息撤回能力直接相关。
- [x] 群设置抽屉新增“群消息撤回时限”数值项，单位按 Swagger 使用秒，保存仍复用已有 `/room/update` 和二次确认链路。
- [x] 补齐中英文文案；详细记录写入 `2026-06-20-room-update-withdraw-time.md`。
- [x] 本轮未运行单元测试、构建或验证脚本，未登录真实账号，未保存群设置或触发其他真实 mutation。

## 2026-06-20 入群审核 requestId 归一化

- [x] `/room/openim/join-requests/handle` 必填 `requestId`，群设置抽屉审核列表和通讯录群通知此前分别维护申请 ID 读取逻辑。
- [x] 新增 `pickBusinessJoinRequestId`，统一兼容 `requestId/requestID/joinRequestId/applyId/applicationId/joinApplyId/roomApplyId/id`，并支持从 `data/result/obj/request/joinRequest/application/payload/detail/ex` 递归读取；读取时使用显式非空判断，避免数字型申请 ID 被误丢。
- [x] 群设置入群审核和通讯录群通知均改用该工具；未识别到业务申请 ID 时，通讯录群通知仍保留 SDK 处理流程。
- [x] 详细记录写入 `2026-06-20-join-request-id-normalization.md`；本轮未运行单元测试、构建或验证脚本，未点击同意/拒绝，未触发真实入群审核 mutation。

## 2026-06-20 群全体禁音字段接入

- [x] 继续复核 `/room/update` 字段，确认源码类型层已有 `limitSendSmg`，且现有文案已有“全体禁音”，但群设置页未开放入口。
- [x] 群权限设置区新增“全体禁音”开关，保存仍复用 `/room/update`、二次确认和本地群信息更新链路。
- [x] 详细记录写入 `2026-06-20-room-update-limit-send.md`；本轮未运行单元测试、构建或验证脚本，未登录真实账号，未保存群设置或触发其他真实 mutation。

## 2026-06-20 群聊天记录保存时长接入

- [x] 继续复核 `/room/update` 字段，确认群设置同样提供 `chatRecordTimeOut`，而此前只有单聊 `/friends/update` 进入页面流程。
- [x] `RoomSettingsParams.chatRecordTimeOut` 放宽为 `string | number`，和单聊已使用的 Swagger 字符串值保持一致。
- [x] 群权限设置区新增“聊天记录保存时长”下拉，选项复用单聊口径：关闭、1 天、7 天、30 天、90 天、365 天；保存仍走 `/room/update` 和二次确认。
- [x] 详细记录写入 `2026-06-20-room-update-chat-record-timeout.md`；本轮未运行单元测试、构建或验证脚本，未登录真实账号，未保存群设置或触发其他真实 mutation。

## 2026-06-20 群消息销毁类型字段接入

- [x] 继续复核 `/room/update` 字段，确认 `messageDestroyContentTypes` 属于现有“消息销毁设置”范围，Swagger 要求用逗号分隔的 `contentType` 列表提交。
- [x] 群设置抽屉新增“消息销毁类型”多选，覆盖 OpenIM 当前常用消息类型：文本、图片、语音、视频、文件、@消息、合并消息、名片、位置、自定义。
- [x] 后端未返回该字段时按“全类型”展示；保存时显式提交数字 contentType 列表；空选择在前端提示并阻断，避免向 `/room/update` 发送空值。
- [x] 详细记录写入 `2026-06-20-room-update-message-destroy-content-types.md`；本轮未运行单元测试、构建或验证脚本；受控 Chrome 使用测试账号登录到 `#/chat`，登录、业务代理和 OpenIM 关键接口返回 200；未保存群设置，未触发 `/room/update` 或其他真实 mutation。

## 2026-06-20 用户头像接口兜底接入

- [x] 复核 Swagger `/user/avatar/get`，确认其为用户端只读接口，用于获取用户头像 URL。
- [x] 新增 `getBusinessUserAvatar(userId, update)` 封装，并接入 `getBusinessUserInfo([userID])`、`getBusinessUserByAccount(account)` 的头像兜底。
- [x] 仅当 `/user/get` 或 `/user/getByAccount` 归一化后缺少 `faceURL` 时才调用头像接口；不在好友列表/搜索列表批量归一化中逐项请求，避免额外请求风暴。
- [x] 覆盖脚本 `expectedWebApiPaths` 补入 `/user/avatar/get`；详细记录写入 `2026-06-20-user-avatar-fallback.md`。
- [x] 受控 Chrome 使用测试账号登录成功，`/business-api/account/login`、`/business-api/user/get` 和关键 OpenIM 接口返回 200；后续只读复测中观察到当前账号头像兜底可能返回业务内部异常，前端已按 `userID` 缓存失败并静默保留原资料，避免重复失败请求和控制台告警；本轮未运行单元测试、构建或验证脚本，未触发真实 mutation。

## 2026-06-20 用户通知设置接入

- [x] 复核 Swagger `/user/notification/settings`、`/user/notification/settings/defaults`、`/user/notification/settings/update`，确认属于用户端消息通知接口。
- [x] 新增 `src/api/notification.ts` 封装读取、默认设置读取和批量更新接口。
- [x] 个人设置弹窗新增“消息提示”分组，打开时读取全局通知设置；设置响应缺少 `supportedTypes/typeMetas` 时用 defaults 只读兜底。
- [x] 本期只展示 Web 当前能力相关的 `room_notice`、`at_me`、`robot_reply`；后端返回的 `red_packet` 不展示，避免引入红包/支付语义。
- [x] 单项开关更新前弹二次确认，确认后才调用 `/user/notification/settings/update`；覆盖脚本 `expectedWebApiPaths` 已补入三个通知设置接口。
- [x] 详细记录写入 `2026-06-20-user-notification-settings.md`；受控 Chrome 登录后打开个人设置，`/business-api/user/notification/settings` 返回 200，页面展示三类通知且不展示红包通知；本轮未点击开关，未触发 update 或其他真实 mutation。

## 2026-06-20 剩余候选继续复核与 Chrome 验证

- [x] 已用 Playwright CLI 连接真实 Google Chrome，登录 `18888888888 / czp0422+` 成功进入 `#/chat`；截图保存到 `output/playwright/chrome-current-verify.png`。
- [x] 浏览器网络确认业务请求继续走 `/business-api/**` 代理，OpenIM SDK 请求继续走 `http://47.238.134.161:10002/**`；未触发发送、上传、下载、删除、审核、群设置保存或通知设置更新等真实 mutation。
- [x] 重新复核 `/room/add`：Swagger 仍要求旧系统完整 `room` 实体、`text` 和 `keys`，不适合直接替换当前 OpenIM SDK 建群；当前创建群入口继续保留 SDK 能力，多人建群前已有二次确认。
- [x] 重新复核 `/room/update` 剩余字段：`maxUserSize`、自动减员、群状态、直播、站点 URL、管理员数量上限等不在本期 Web 用户端需求清单中，暂不新增产品入口。
- [x] 精确引用复核未发现新的“属于本期 Web、页面有入口但源码未接”的明确缺口；详细记录追加到 `2026-06-20-remaining-candidates-rescan.md`。

## 2026-06-21 多账号运行态隔离补充

- [x] 继续复核多账号保存/一键切换/数据隔离，确认 token、保存账号、聊天草稿和 contact/conversation store 已按账号隔离或切换时清理。
- [x] 补齐账号切换时 `useUserStore.selfInfo` 的显式运行态清理：新增 `clearUserRuntimeState()`，切换账号写入目标 token 后先清空当前用户资料和进度，再清空联系人/会话 store 并 reload。
- [x] 该改动不删除已保存账号、不改变 token 持久化和接口契约，只避免 reload 前短暂保留上一账号头像/昵称。
- [x] 真实 Chrome 使用 `18888888888 / czp0422+` 重新登录成功进入 `#/chat`，`/business-api/account/login` 和关键业务/OpenIM 请求返回 200，控制台错误复查为 0；截图保存到 `output/playwright/chrome-account-runtime-clear-verify.png`。
- [x] 详细记录写入 `2026-06-21-account-runtime-state-isolation.md`；本轮未运行单元测试、构建或验证脚本，未触发真实业务 mutation。

## 2026-06-21 单聊聊天记录搜索只读复测

- [x] 使用 Playwright CLI 连接真实 Google Chrome 的 `default` 会话，当前页面为 `#/chat/si_10000003_10000021`，会话名 `www`。
- [x] 打开“聊天记录搜索”弹窗并搜索 `你是谁`，页面展示 1 条业务搜索结果：`橙子皮 / 你是谁`。
- [x] 网络请求确认 `POST /business-api/friend/openim/messages/search?pageIndex=0&pageSize=50&peerUserId=10000021&keyword=...&access_token=...` 返回 200，仍走 `/business-api` 代理。
- [x] 控制台错误复查为 0；截图保存到 `output/playwright/chrome-chat-search-readonly-verify.png`。
- [x] 详细记录写入 `2026-06-21-chat-search-readonly-verify.md`；本轮未运行单元测试、构建或验证脚本，未触发收藏、合并保存、转发、发送、上传、下载、删除、审核、群设置保存或其他真实 mutation。

## 2026-06-21 聊天资源只读复测

- [x] 在同一真实 Chrome 单聊 `#/chat/si_10000003_10000021` 打开“聊天资源”弹窗。
- [x] `收藏消息` Tab 调用 `POST /business-api/message/favorites?pageIndex=0&pageSize=50&deleted=0&access_token=...` 返回 200，页面显示空态。
- [x] `已保存合并消息` Tab 调用 `POST /business-api/message/merge/saved?pageIndex=0&pageSize=50&deleted=0&access_token=...` 返回 200，页面显示空态。
- [x] `文件资源` Tab 调用 `POST /business-api/file/resources?pageIndex=0&pageSize=50&deleted=0&access_token=...` 返回 200，页面展示两条 `chuanxi.jpg` 文件资源。
- [x] 控制台错误复查为 0；截图保存到 `output/playwright/chrome-chat-resources-readonly-verify-20260621.png`。
- [x] 详细记录写入 `2026-06-21-chat-resources-readonly-verify.md`；本轮未运行单元测试、构建或验证脚本，未点击详情、引用状态、引用关系、下载、删除、收藏上下文、合并上下文或容量概览，未触发任何下载或真实 mutation。

## 2026-06-21 系统公告只读复测

- [x] 在真实 Chrome 当前登录态打开左侧栏“系统公告”入口，页面公告角标显示未读数 `7`。
- [x] 列表调用 `POST /business-api/system/announcements?pageIndex=0&pageSize=30&access_token=...` 返回 200，页面展示真实公告数据。
- [x] 未读数调用 `POST /business-api/system/announcements/unread-count?access_token=...` 返回 200。
- [x] 点击第一条公告标题读取详情，调用 `POST /business-api/system/announcements/detail?announcementId=8a0b0fa2156347c6991bfc044666f2ab&access_token=...` 返回 200，详情展示 `script-announcement-high-risk-1781591010 / high risk content`。
- [x] 网络请求未出现 `/system/announcements/read` 或 `/system/announcements/read-all`；控制台错误复查为 0；截图保存到 `output/playwright/chrome-system-announcements-readonly-verify-20260621.png`。
- [x] 详细记录写入 `2026-06-21-system-announcements-readonly-verify.md`；本轮未运行单元测试、构建或验证脚本，未点击标已读确认，未触发任何公告已读或其他真实 mutation。

## 2026-06-21 文件资源详情只读复测

- [x] 在真实 Chrome 单聊 `#/chat/si_10000003_10000021` 的“聊天资源”弹窗进入 `文件资源` Tab，第一条真实文件为 `chuanxi.jpg`，`842.58 KB / jpg`，业务 `fileId=d78c623fa5704797a08a27422385d17f`。
- [x] 点击 `详情`，调用 `POST /business-api/file/resources/detail?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 200，响应包含下载/预览签名、压缩、缩略图和引用字段。
- [x] 点击 `引用状态`，调用 `POST /business-api/file/reference/status?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 200，响应包含 `referenceInvalid=false`、`canDelete=false`。
- [x] 点击 `引用关系`，调用 `POST /business-api/file/resources/references?fileId=d78c623fa5704797a08a27422385d17f&access_token=...` 返回 200，响应包含 `referenced=false`、`referenceCount=0`、`references=[]`。
- [x] 控制台错误复查为 0；网络请求未出现 `/file/download`、`/file/delete` 或 `/file/reference/invalidate`；截图保存到 `output/playwright/chrome-file-resource-detail-readonly-verify-20260621.png`。
- [x] 详细记录写入 `2026-06-21-file-resource-detail-readonly-verify.md`；本轮未运行单元测试、构建或验证脚本，未触发任何文件下载、删除、引用失效或其他真实 mutation。

## 2026-06-21 好友列表与详情只读复测

- [x] 真实 Chrome 从聊天页切到 `#/contact`，通讯录默认 `我的好友` 展示真实好友 `橙子皮1`、`橙子皮4`。
- [x] 好友列表读取链路中 `POST /business-api/friends/list?userId=10000003&access_token=...` 返回 200。
- [x] 点击 `橙子皮1` 后资料卡展示昵称 `橙子皮1`、userID `10000006`、性别 `男`，备注/生日/手机号/邮箱为空值兜底。
- [x] 好友详情读取链路中 `POST /business-api/friends/get?userId=10000003&toUserId=10000006&access_token=...`、`POST /business-api/user/get?userId=10000006&access_token=...`、`POST /business-api/user/avatar/get?userId=10000006&update=0&access_token=...` 均返回 200。
- [x] 控制台错误复查为 0；截图保存到 `output/playwright/chrome-friend-list-detail-readonly-verify-20260621.png`。
- [x] 详细记录写入 `2026-06-21-friend-list-detail-readonly-verify.md`；本轮未运行单元测试、构建或验证脚本，未触发好友备注保存、删除好友、拉黑、发送消息、加好友或其他真实 mutation。

## 2026-06-21 通讯录与群入口只读复测

- [x] 真实 Chrome 已打开用户启动的本地服务 `http://127.0.0.1:7777`，继续使用当前登录账号 `10000003` 做只读验收；本轮未运行单元测试、构建或验证脚本。
- [x] “新的好友”页面 `#/contact/newFriends` 调用 `POST /business-api/friends/newFriendListWeb?userId=10000003&pageIndex=0&pageSize=100&access_token=...` 返回 200，页面展示 4 条真实申请记录；未点击同意、拒绝或添加好友。
- [x] “群通知”页面 `#/contact/groupNotifications` 当前为空态，网络侧仍主要由 OpenIM SDK `group/get_recv_group_applicationList`、`group/get_user_req_group_applicationList` 驱动，本轮未观察到新增 `/business-api/room/openim/join-requests` 列表请求；未点击审核处理。
- [x] “我的群组”页面 `#/contact/myGroups` 展示 2 个真实群；点击群 `啊啊i` 后资料卡展示 `groupID=4011035808` 与 3 个成员。页面触发 `/business-api/room/openim/members?...roomId=4011035808`，HTTP 200 但业务体通过控制台暴露 `resultCode=1010101` 参数校验失败，当前仍由 SDK/本地数据兜底展示成员。
- [x] 账号设置 -> 通讯录黑名单弹窗显示空态“暂无数据”；`/business-api/friends/queryBlacklistWeb?pageIndex=0&pageSize=100&access_token=...` 返回 200；同时账号设置读取 `/business-api/user/notification/settings` 返回 200。未点击移出黑名单、通知开关或设置保存。
- [x] 截图已保存：`output/playwright/chrome-new-friends-readonly-verify-20260621.png`、`output/playwright/chrome-group-notifications-readonly-verify-20260621.png`、`output/playwright/chrome-my-groups-detail-readonly-verify-20260621.png`、`output/playwright/chrome-blacklist-readonly-verify-20260621.png`。
- [x] 详细记录写入 `2026-06-21-new-friends-readonly-verify.md`、`2026-06-21-group-notifications-readonly-verify.md`、`2026-06-21-my-groups-readonly-verify.md`、`2026-06-21-blacklist-readonly-verify.md`；本轮未触发发送、上传、下载、删除、审核、黑名单变更、通知设置更新、群设置保存或其他真实 mutation。
## 2026-06-21 群共享文件只读兜底

- `src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx`
  - 将聊天资源列表加载失败的只读分支从 `feedbackToast({ error })` 调整为 `setItems([])` + `console.debug(...)`。
  - 变更仅覆盖 `loadItems` 的列表读取路径；详情、上下文、下载、删除、收藏编辑等用户主动操作仍保留二次确认或错误提示。
- 真实浏览器复测：
  - 页面：`#/chat/sg_4011035808`。
  - 入口：`聊天资源 -> 群共享文件`。
  - 请求：`GET /business-api/room/openim/shares?pageIndex=0&pageSize=50&userId=0&roomId=4011035808&access_token=...`，HTTP 200。
  - 页面空态：`未搜索到相关结果`。
  - 不再新增 `src/utils/common.ts` 的 `feedbackToast` error。
- 仍未触发上传、下载、删除、发送、收藏、合并、审核、群设置保存等真实 mutation；未运行单元测试、构建或验证脚本。
- 记录文件：`2026-06-21-group-shares-readonly-fallback.md`。
## 2026-06-21 已读详情验收阻塞记录

- 已确认代码侧 `getOpenIMMessageReadDetail` 和群消息右键“已读详情”入口存在。
- 真实浏览器当前没有可右键的群消息节点：
  - `#/chat/sg_4011035808` 消息区加载中。
  - 重新登录后 `#/chat` 会话列表为空，仅显示“创建群聊”。
- 本轮未触发 `/room/openim/message/read-detail`，未触发任何 mutation。
- 记录文件：`2026-06-21-message-read-detail-browser-blocked.md`。

## 2026-06-21 已读详情只读失败兜底

- `src/pages/chat/queryChat/MessageItem/index.tsx`
  - 将 `showReadDetail` 的业务请求失败处理收口到函数内部。
  - `/room/openim/message/read-detail` 成功时继续展示已读详情；失败时展示空态并 `console.debug` 记录，不再通过右键菜单通用 catch 触发 `feedbackToast`。
  - 撤回、删除、收藏、下载等主动操作的确认框和错误提示保持不变。
- 真实浏览器复核：
  - 当前页面 `#/chat` 正常渲染“创建群聊”空状态。
  - Playwright console error 复查为 0。
  - 当前仍缺可右键群消息节点，未触发真实已读详情请求。
- 记录文件：`2026-06-21-message-read-detail-readonly-fallback.md`。

## 2026-06-21 聊天搜索业务失败兜底

- `src/pages/chat/queryChat/ChatHeader/ChatMessageSearch.tsx`
  - 业务搜索失败后继续走 SDK 本地历史搜索兜底。
  - 业务失败且本地无结果时展示空态，不再弹业务错误 toast。
  - 业务搜索失败日志从 `console.warn` 调整为 `console.debug`。
  - 收藏、合并预览、保存合并等用户主动操作错误处理保持不变。
- 真实浏览器复核：
  - 当前 `#/chat` 页面正常渲染“创建群聊”空状态。
  - Playwright console error 复查为 0。
  - 当前无可打开会话，未触发真实搜索请求。
- 记录文件：`2026-06-21-chat-search-business-failure-fallback.md`。

## 2026-06-21 联系人申请列表双通道兜底

- `src/store/contact.ts`
  - `getRecvFriendApplicationListByReq`、`getSendFriendApplicationListByReq`、`getRecvGroupApplicationListByReq`、`getSendGroupApplicationListByReq` 改为 SDK 与 businessApi 独立读取、合并结果。
  - SDK 失败不阻断 businessApi；businessApi 失败不丢弃 SDK 结果。
  - 只读读取失败改为 `console.debug`，不再 `console.error`。
  - 群申请发出列表补充 businessApi join request 合并兜底。
- 真实浏览器复测：
  - `#/contact/newFriends` 展示真实申请记录，`/business-api/friends/newFriendListWeb` 返回 200。
  - `#/contact/groupNotifications` 触发 OpenIM SDK 群申请列表和 `/business-api/room/openim/join-requests` 请求，均返回 200。
  - 群通知页面 console error 复查为 0。
  - 新朋友页面期间出现的 error 是 OpenIM WS 握手失败，非本轮列表读取逻辑。
- 未点击同意/拒绝，未触发任何申请处理 mutation。
- 记录文件：`2026-06-21-contact-application-dual-source-fallback.md`。

## 2026-06-21 群成员只读列表兜底

- `src/hooks/useGroupMembers.ts`
  - businessApi 成员列表失败从 `console.warn` 降为 `console.debug`。
  - SDK 成员列表也失败时不再弹 toast，改为空态/保留已有列表兜底。
  - 该 hook 被群资料卡、群设置成员列表和选择器共用，统一只读失败降级。
- 真实浏览器复测：
  - `#/contact/myGroups` 打开群资料卡后显示群 `橙子皮、橙子皮1、橙子皮4` 的 3 个成员。
  - `/business-api/room/openim/members?pageIndex=0&pageSize=100&roomId=3413653759` 返回 200。
  - Playwright console error 复查为 0。
- 未触发备注、禁言、解禁、设管理员、邀请、踢人、转让等 mutation。
- 记录文件：`2026-06-21-group-member-readonly-fallback.md`。
## 2026-06-22 聊天资源只读详情失败兜底

- [x] `src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx` 新增 `showReadonlyDetailFallback`，将聊天资源弹窗里的上下文、容量概览、文件详情、引用状态、引用关系等只读详情请求失败收敛为 `console.debug` + 空 JSON 详情弹窗。
- [x] 下载、删除、收藏编辑保存等主动操作仍保留原有二次确认和 `feedbackToast({ error })`，不改变写操作/下载动作的风险提示。
- [x] 真实浏览器复测 `#/chat/si_10000003_10000021`：`/message/favorites/context`、`/file/resources`、`/file/storage/overview`、`/file/resources/detail`、`/file/reference/status`、`/file/resources/references` 均通过 `/business-api` 返回 HTTP 200。
- [x] 本轮未触发 `/file/download`、`/file/delete`、`/file/reference/invalidate`、上传、发送、收藏保存、合并保存、审核、群设置保存或其他真实 mutation；未运行单元测试、构建或验证脚本。
## 2026-06-22 群文件容量概览只读复测

- [x] 本地 `127.0.0.1:7777` 未监听后，重新启动 `npm run dev:web`，未运行单元测试、构建或验证脚本。
- [x] 使用账号 `18888888888 / czp0422+` 重新登录，进入群会话 `#/chat/sg_3413653759`。
- [x] 打开“聊天资源”并切换“群共享文件”：`GET /business-api/room/openim/shares?pageIndex=0&pageSize=50&userId=0&roomId=3413653759&access_token=...` 返回 HTTP 200，页面空态。
- [x] 点击“容量概览”：`POST /business-api/file/storage/room-overview?roomId=3413653759&access_token=...` 返回 HTTP 200，但业务体 `resultCode=0`、`resultMsg="群ID不合法。"`。
- [x] 前端按只读详情失败兜底展示 `{}`，无用户级错误 toast；Playwright console error 复查为 0；未触发上传、下载、删除、发送、群共享新增/删除、审核或群设置保存。
## 2026-06-22 群消息已读详情只读复测

- [x] 在群会话 `#/chat/sg_3413653759` 找到可右键群消息节点：发送者 `橙子皮1`，内容显示 `[暂未支持的消息类型]`。
- [x] 右键菜单显示 `转发`、`收藏`、`消息已读列表`、`删除`；本轮仅点击 `消息已读列表`。
- [x] 请求 `POST /business-api/room/openim/message/read-detail?roomId=3413653759&clientMsgID=2ed75e14a3c07c61cd460f750e30597a&serverMsgID=9ae97613640b4702d47b6b00e317ab32&seq=6&access_token=...` 返回 HTTP 200。
- [x] 响应体为 `resultCode=1010101`、`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`；页面弹窗标题 `消息已读列表`，展示空态 `未搜索到相关结果`。
- [x] Playwright console error 复查为 0；未触发转发、收藏、删除、撤回、发送或其他真实 mutation。

## 2026-06-22 群设置只读入口复测

- [x] 真实浏览器继续使用账号 `18888888888 / czp0422+` 打开群会话 `#/chat/sg_3413653759`，群设置抽屉可打开。
- [x] 当前账号仅展示普通成员可见入口：`群公告`、`群二维码`、`在线成员`；未展示 `入群审核`、`特殊成员`、`群助手` 管理入口。
- [x] 仅点击只读入口：`群公告` 触发 `/business-api/room/openim/notices?...roomId=3413653759`，`在线成员` 触发 `/business-api/room/openim/online-members?...roomId=3413653759`，均返回 HTTP 200 但业务体 `resultCode=1010101`。
- [x] `群公告` 页面展示空态 `未搜索到相关结果`；结论仍是后端未兼容 OpenIM `groupID` 作为业务 `roomId`。
- [x] 本轮网络列表出现一次 `/room/openim/member/clear-message?roomId=3413653759`，业务体同样为 `resultCode=1010101`，未成功清空；源码侧 `clearGroupMessages` 仍有二次确认，业务失败后不会继续执行 SDK 本地清空。该风险已记录到 `2026-06-22-group-setting-readonly-reverify.md`，后续清空类 mutation 必须单独确认。

## 2026-06-23 群在线成员只读复测

- [x] 真实浏览器继续使用账号 `18888888888 / czp0422+` 登录，进入 `#/chat/sg_3413653759`，打开群设置抽屉。
- [x] 点击普通成员可见的 `在线成员` 只读入口，触发 `/business-api/room/openim/online-members?pageIndex=0&pageSize=100&roomId=3413653759`。
- [x] 请求 HTTP 200，响应业务体为 `resultCode=1010101`、`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`。
- [x] 页面弹窗标题 `在线成员`，展示空态 `未搜索到相关结果`；Playwright console error 复查为 0。
- [x] 详细记录写入 `2026-06-23-group-online-members-readonly-reverify.md`；本轮未运行单元测试、构建或验证脚本，未触发发送、上传、下载、删除、审核、保存、清空、退出群组等 mutation。

## 2026-06-23 入群审核 status 默认值修正

- [x] 真实浏览器进入管理员群 `#/chat/sg_4011035808`，群设置抽屉可见 `入群审核`、`特殊成员`、`群助手`、群权限开关、消息销毁设置、转让群组、解散群组等入口。
- [x] 点击 `入群审核` 只读入口时发现旧请求 `/business-api/room/openim/join-requests?pageIndex=0&pageSize=50&roomId=4011035808` 返回 HTTP 500，响应体为空。
- [x] Swagger 中 `status` 为可选参数，但后端当前不传会 500；通讯录群通知预加载带 `status=-1` 时返回 HTTP 200。已将 `getOpenIMJoinRequests` 统一默认 `status: -1`，并移除调用点重复默认值。
- [x] 浏览器动态导入当前 Vite 模块后请求已变为 `/business-api/room/openim/join-requests?pageIndex=0&pageSize=50&status=-1&roomId=4011035808`，HTTP 200；由于当前登录态清空，该动态请求业务体为 `resultCode=1030101`、`缺少访问令牌`。
- [x] 本轮未运行单元测试、构建或验证脚本；未触发同意/拒绝、特殊成员设置、群助手写入、群设置保存、清空、转让、解散等 mutation。完整 UI 成功态需要后端登录接口恢复后再复测，记录见 `2026-06-23-join-requests-status-default.md`。

## 2026-06-23 入群审核处理 requestId 必填防护

- [x] 对照 Swagger 复核 `/room/openim/join-requests/handle`，确认 `requestId` 与 `action=approve/reject` 为必填参数。
- [x] `handleOpenIMJoinRequest` 现有封装已能把 `agree` 归一化为 `action`，符合接口定义。
- [x] `GroupBusinessEntrances` 的入群审核列表新增 UI 层防护：业务数据缺少 `requestId` 时禁用同意/拒绝按钮，避免对不可处理数据暴露可点击 mutation 入口。
- [x] 保留调用函数内部 `requestId` 守卫，形成渲染层和执行层双重保护。
- [x] 本轮未运行单元测试、构建或验证脚本；未触发同意/拒绝或任何真实 mutation。记录见 `2026-06-23-join-request-id-required-guard.md`。

## 2026-06-23 特殊成员设置 userId 必填防护

- [x] 对照 Swagger 复核 `/room/openim/member/set-special-role`，确认 `roomId/userId/role` 为必填参数。
- [x] `setOpenIMSpecialRole` 现有封装已强制要求 `roomId/userId/role`，符合接口定义。
- [x] `GroupBusinessEntrances` 的特殊成员列表新增 UI 层防护：业务数据缺少目标 `userId` 时禁用普通成员、隐身人、监控人角色设置按钮，避免暴露不可执行的 mutation 入口。
- [x] 保留执行函数内部 `userId` 守卫，形成渲染层和执行层双重保护。
- [x] 本轮未运行单元测试、构建或验证脚本；未触发特殊成员设置或任何真实 mutation。记录见 `2026-06-23-special-member-userid-required-guard.md`。

## 2026-06-24 聊天资源操作必填 ID 防护

- [x] 对照 Swagger 复核聊天资源操作的必填 ID：收藏详情/更新/删除需要 `favoriteId`，合并消息详情/删除需要 `mergeId`，文件详情/删除需要 `fileId`，群共享删除需要 `shareId`。
- [x] `ChatBusinessResources` 新增按钮层防护：缺少对应 ID 时禁用详情/编辑，或不展示删除按钮，避免对字段不完整的资源暴露不可执行操作。
- [x] 引用状态、引用关系、下载继续以可解析 `fileId` 为显示条件；群共享文件详情仍允许展示原始记录。
- [x] 本轮未运行单元测试、构建或验证脚本；未触发上传、下载、删除、收藏更新、合并消息删除、群共享文件删除或其他真实 mutation。记录见 `2026-06-24-chat-resource-required-id-guard.md`。

## 2026-06-24 群成员管理 targetUserId 必填防护

- [x] 对照 Swagger 复核群成员管理接口：成员备注更新/删除、禁言、解禁均要求 `roomId/targetUserId`，禁言还要求 `durationSeconds`；`/room/set/admin` 虽然把 `touserId/type` 标为可选，但实际管理员变更必须有目标用户和目标角色。
- [x] `GroupMemberList` 的备注、禁言、解禁、设/取消管理员执行函数新增 `member.userID` 守卫，避免缺目标成员 ID 时进入接口调用。
- [x] `canEditRemark`、`canManageMember`、`canManageAdministrator` 新增 `Boolean(member.userID)` 条件，缺目标成员 ID 时不展示对应操作按钮。
- [x] 本轮未运行单元测试、构建或验证脚本；未触发备注保存、禁言、解禁、设管理员、取消管理员或其他真实 mutation。记录见 `2026-06-24-group-member-target-id-guard.md`。

## 2026-06-24 群二维码 roomId/code 必填防护

- [x] 对照 Swagger 复核群二维码接口：`/room/openim/qr/create` 必填 `roomId`，`expireHours` 可选；`/room/openim/qr/resolve` 必填 `code`；`/room/openim/qr/join` 必填 `code`，`applyReason` 可选。
- [x] `GroupQRCodePanel` 现有解析与入群入口已按 `code` 做按钮层和执行层防护：空输入不能解析，未解析出 `resolvedCode` 不能入群。
- [x] 本轮补齐生成二维码入口的 `roomId` 防护：新增 `normalizedRoomId` 和 `canCreate`，缺 `roomId` 时禁用生成按钮，`generateQRCode` 执行层也直接返回。
- [x] 生成二维码请求改为传入 trim 后的 `roomId`，避免空白字符串透传到 `/room/openim/qr/create`。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本；未触发生成二维码、解析二维码、扫码入群或任何真实 mutation。记录见 `2026-06-24-group-qr-required-param-guard.md`。

## 2026-06-24 群助手 roomId/ID 必填防护

- [x] 对照 Swagger 复核群助手写操作：添加需要 `roomId/helperId`，移除需要 `roomId/groupHelperId`，关键词新增/更新/删除需要 `roomId/groupHelperId`，其中更新/删除还需要 `keyWordId`，新增/更新还需要 `keyword/value`。
- [x] `GroupHelperPanel` 原有 `helperId/groupHelperId/keyWordId/keyword/value` 防护保留，本轮补齐统一 `roomId` 防护。
- [x] 新增 `normalizedRoomId` 和 `canManage`；缺 `roomId` 时不加载群助手上下文/列表/可添加列表，直接清空只读数据。
- [x] 添加助手、移除助手、添加关键词、编辑关键词、删除关键词、保存关键词均增加 `canManage` 执行层守卫，并统一使用 trim 后的 `roomId` 发起请求。
- [x] 添加、移除、添加关键词、编辑关键词、删除关键词、保存按钮在缺 `roomId` 时禁用。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本；未触发群助手添加/移除、关键词保存/删除或任何真实 mutation。记录见 `2026-06-24-group-helper-required-param-guard.md`。

## 2026-06-24 群公告 roomId/noticeId/content 必填防护

- [x] 对照 Swagger 复核群公告接口：列表 `/room/openim/notices` 必填 `roomId`；更新 `/room/openim/notice/update` 必填 `roomId/noticeId/noticeContent`；删除 `/room/openim/notice/delete` 必填 `roomId/noticeId`。
- [x] `GroupBusinessEntrances` 原有 `noticeId` 与公告内容守卫保留，本轮补齐统一 `roomId` 前置。
- [x] 新增 `normalizedRoomId` 和 `canUseRoomBusiness`；缺 `roomId` 时群公告、入群审核、在线成员、特殊成员列表面板直接空态，不调用群业务列表接口。
- [x] 公告编辑、保存、删除增加 `canUseRoomBusiness` 执行层守卫；保存按钮在缺 `roomId` 或内容为空时禁用，编辑/删除按钮在缺 `roomId` 或 `noticeId` 时禁用。
- [x] 同文件内特殊成员角色设置统一使用 trim 后的 `roomId`，并在缺 `roomId` 时禁用按钮；群助手和群二维码子面板接收 trim 后的 `roomId`。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本；未触发公告保存/删除、特殊成员设置或任何真实 mutation。记录见 `2026-06-24-group-notice-required-param-guard.md`。

## 2026-06-24 群设置保存 roomId 必填防护

- [x] 对照 Swagger 复核 `/room/update` 必填 `roomId`，其它设置字段按需传递；`/room/delete` 必填 `roomId`；`/room/member/delete` 必填 `roomId/userId`。
- [x] `useGroupSettings` 新增 `normalizeBusinessRoomId`，统一把业务 `roomId` 或 OpenIM `groupID` 兜底值转换为 trim 后字符串。
- [x] `updateRoomSettings` 缺 `roomId` 时直接返回，不再只更新本地群信息，避免 business-only 设置出现假成功。
- [x] `updateGroupPermission` 和 `updateGroupInfo` 在需要同步 `/room/update` 时，缺 `roomId` 直接返回。
- [x] 解散群组必须有 `roomId` 才允许进入确认链路；退出群组必须有 `roomId/userId` 才允许进入确认链路。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本；未触发群设置保存、退出群组、解散群组或任何真实 mutation。记录见 `2026-06-24-group-settings-roomid-guard.md`。

## 2026-06-24 群会话设置 roomId 必填防护

- [x] 对照 Swagger 复核 `/room/openim/member/set-offline-no-push`、`/room/openim/member/set-top`、`/room/openim/member/clear-message`，确认三者均必填 `roomId`。
- [x] `GroupSettings` 的群免打扰、群置顶、清空群消息游标入口缺 `businessRoomId` 时直接提示失败并返回，不再进入确认链路或后续 SDK/本地状态同步。
- [x] 三个操作现在必须先完成对应 businessApi 调用，成功后才继续同步 OpenIM SDK 或本地状态，避免业务未落库但 UI 假成功。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本；未触发群免打扰、群置顶、清空群消息或任何真实 mutation。记录见 `2026-06-24-group-conversation-settings-roomid-guard.md`。

## 2026-06-24 好友操作 toUserId 必填防护

- [x] 对照 Swagger 复核 `/friends/add`、`/friends/delete`、`/friends/remark`、`/friends/update`、`/friends/update/OfflineNoPushMsg`、`/friends/blacklist/add`、`/friends/blacklist/delete`，确认好友变更类入口都依赖目标用户 ID。
- [x] `SingleSetting` 的单聊免打扰、置顶、聊天记录保留时间、拉黑/移出黑名单、删除好友均新增目标用户 ID 守卫，缺 ID 时不进入确认链路或 SDK 同步。
- [x] `UserCardModal` 统一使用 trim 后目标用户 ID 查询资料、跳转单聊和保存好友备注；缺目标用户 ID 时不启动非本人只读查询、不显示无效添加入口。
- [x] `SendRequest` 发送好友申请前必须有目标用户 ID，缺 ID 时不打开确认框且按钮不可用。
- [x] `NewFriends` 同意/拒绝好友申请前必须有申请来源用户 ID，缺 ID 时不调用 `/friends/add` 或 SDK 申请处理接口。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本；未触发好友申请、同意/拒绝、删除好友、拉黑、备注保存或任何真实 mutation。记录见 `2026-06-24-friend-target-userid-guard.md`。

## 2026-06-24 业务 roomId 提取归一化

- [x] 继续围绕群业务 `roomId` 契约做源码层增强：`pickBusinessRoomId`、`pickExplicitBusinessRoomId` 现在对业务 ID 和 fallback 统一 trim，空白字符串不再被当作有效 roomId。
- [x] roomId 专用识别字段补充 `roomid/room_id/businessRoomId/businessRoomID/oldRoomId/oldRoomID/roomJID/room_jid`，groupId 兜底补充 `groupid/group_id`。
- [x] `pickExplicitBusinessRoomId` 现在递归读取 `businessRoom/roomMapping/mapping/openIMMapping/openimMapping` 等嵌套对象，兼容后端把业务 roomId 放在映射对象里的响应形态。
- [x] `pickBusinessId` 对字符串 ID 做 trim，空白 `auditId/requestId/id` 不再透传到业务接口调用链。
- [x] 保持 `/room/openim/mapping`、`/room/openim/status`、`/room/openim/batch-status` 等桥接运维接口不接入 Web 用户端；本轮未运行单元测试、构建、覆盖检查或验证脚本，未触发任何真实接口请求或 mutation。记录见 `2026-06-24-business-roomid-extraction-normalization.md`。

## 2026-06-24 HTTP 错误文案归一化

- [x] `feedbackToast` 新增统一错误文案提取，优先读取 `resultMsg/errMsg/msg/errDlt`，并支持 AxiosError `response.data`、`data/result/obj/error` 等嵌套响应。
- [x] `errorHandle` 现在能从 AxiosError `response.data` 中读取 `errCode` 并继续优先使用 `ErrCodeMap`，未命中时展示后端业务错误文案。
- [x] 该改动覆盖登录、验证码、注册、企业号校验、资料保存等使用 `errorHandle` 或 `feedbackToast` 的入口；如果 IP 限制/宵禁限制由 `/account/login` 以 HTTP 4xx/5xx 返回业务文案，前端不再只显示通用 Axios 错误。
- [x] 本轮不接 `/console/**/security/**` 后台接口；真实 IP 限制/宵禁提示仍需后端提供实际限制响应后浏览器验收。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本，未触发真实登录、验证码、注册、密码、资料保存或其它远端请求。记录见 `2026-06-24-http-error-message-normalization.md`。

## 2026-06-24 固定企业号误判记录

- [x] 该记录曾误判固定企业号应对齐为 `C3PY9DYPU`。
- [x] 2026-06-25 用户明确说明 `DEFAULT_ENTERPRISE_CODE = "LOCALTEST001"` 是其主动修改且正确的当前配置。
- [x] 当前有效契约以 `src/api/login.ts` 的 `DEFAULT_ENTERPRISE_CODE = "LOCALTEST001"` 和根目录最新状态文档为准。
- [x] 该误判记录保留审计痕迹，不作为当前接口接入契约。记录见 `2026-06-24-enterprise-code-c3py9dypu-alignment.md`。

## 2026-06-25 当前状态文档企业号对齐

- [x] 继续清理根目录当前状态文档中的错误企业号描述：`WEB_API_INTEGRATION_STATUS.md`、`WEB_API_INTEGRATION_DELIVERY_STATUS.md`、`WEB_API_INTEGRATION_PROGRESS.md`、`WEB_API_INTEGRATION_REPORT.md` 均已恢复为 `LOCALTEST001`。
- [x] 上述文档日期已更新到 `2026-06-25`，避免当前交付状态继续显示旧企业号。
- [x] 未修改 `e2e/**` 或任何测试文件；早期 Trellis 真实浏览器复测记录继续保留历史事实，不作为当前有效契约。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本，未打开浏览器，未触发任何真实接口请求。记录见 `2026-06-25-enterprise-code-current-docs-alignment.md`。

## 2026-06-25 只读资料补充兜底收敛

- [x] 复扫登录态自资料、用户卡片和群申请卡片的业务资料补充链路，确认这些路径均属于只读增强，不应在业务接口失败时污染登录态或产生用户级错误日志。
- [x] `src/store/user.ts` 的 `getSelfInfoByReq` 现在在 SDK 自资料成功后尝试合并 `/user/get` 业务资料；业务补充失败时只写 `console.debug`，不触发未处理 Promise、不影响登录态、不执行退出。
- [x] `src/pages/common/UserCardModal/index.tsx` 的 `/friends/get`、`/user/get` 失败日志从 `console.error` 收敛为 `console.debug`，继续展示好友列表、SDK 或传入卡片数据。
- [x] `src/components/ApplicationItem/index.tsx` 的 `/room/openim/detail` 群卡片补充失败日志从 `console.warn` 收敛为 `console.debug`，继续打开申请数据兜底卡片。
- [x] 本轮未新增接口，未改变任何 mutation 流程；未运行单元测试、构建、覆盖检查或验证脚本，未触发真实远端请求。记录见 `2026-06-25-readonly-profile-fallback.md`。

## 2026-06-25 用户目标重申

- [x] 用户最新目标：创建新的 Trellis 任务，继续实现当前 Web 端未完成的接口调用。
- [x] 用户明确当前为测试数据，并授权可以真实调用接口、触发写操作、修改测试数据，用浏览器复测 mutation 类接口。
- [x] 后续推进边界：仍限定 Web 用户端，不主动接入后台、支付、运营、运维桥接等非 Web 用户端接口；接口来源以 `docs/openim-swagger.json` 和当前代码实现为准。
- [x] 首批候选方向包括此前暂缓的 `/user/logout`、`/room/add`，以及 Trellis 中其它“待产品入口/后端契约明确后再接”的 Web 用户端接口。
- [x] 详细记录见 `2026-06-25-user-goal-restatement.md`。
