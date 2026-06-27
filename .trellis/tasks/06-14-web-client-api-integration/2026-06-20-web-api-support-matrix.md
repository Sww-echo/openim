# 2026-06-20 Web 端接口支持性矩阵

本轮按最新 `docs/openim-swagger.json` 做准入判断，不再只看当前代码是否已有入口。

## 2026-06-21 聊天资源上下文与容量概览只读补充

- 聊天资源弹窗已在真实浏览器补测上下文/容量只读入口：
  - `/message/favorites/context` 返回 HTTP 200，展示收藏消息字段、限制和 action API。
  - `/message/merge/context` 返回 HTTP 200，展示合并转发/保存字段、限制和 action API。
  - `/file/storage/overview` 返回 HTTP 200，展示当前账号容量、quota、recentUploads 和文件 action API。
- 本轮同时确认 `/message/favorites`、`/message/merge/saved`、`/file/resources` 列表仍返回 HTTP 200，其中文件资源展示两条真实 `chuanxi.jpg`。
- 复测期间未触发 `/file/download`、`/file/delete`、`/file/reference/invalidate`、收藏/合并删除或保存等写操作；这些仍保留确认链路。

## 2026-06-21 图片视频预览只读兜底补充

- 图片/视频消息渲染阶段的业务文件预览继续优先使用 `/file/sign` + `/file/preview` 相关封装获取业务预览 URL。
- 业务预览读取失败时回退 OpenIM SDK 原始媒体 URL，并将日志降级为 `console.debug`，避免只读增强失败污染浏览器 warning。
- 下载、上传、发送、收藏、撤回、删除等用户主动操作不属于该兜底范围，仍保留确认和错误提示。
- 当前真实浏览器页面无图片/视频消息节点，未触发真实媒体预览请求；页面健康复测正常，剩余错误为 OpenIM WS 握手失败。

## 2026-06-21 联系人与会话只读兜底日志补充

- 好友列表、黑名单、群详情和当前群成员读取均采用 SDK 基线 + businessApi 增强合并策略。
- businessApi 增强读取失败时已降级为 `console.debug`，避免只读兜底失败污染浏览器 warning/error；SDK 基线读取失败仍保留用户级错误提示。
- 真实浏览器刷新 `#/contact/myGroups` 后页面正常展示 2 个群；`/friends/list`、`/friends/queryBlacklistWeb`、`/friends/newFriendListWeb`、`/room/openim/join-requests` 等业务只读请求继续通过 `/business-api` proxy 返回 HTTP 200。
- 本轮未触发好友关系变更、黑名单变更、申请处理、群设置保存或其他 mutation。

## 2026-06-21 系统公告与通知设置只读兜底补充

- 系统公告列表、未读数、详情读取已在真实浏览器复测：`/system/announcements`、`/system/announcements/unread-count`、`/system/announcements/detail` 均通过 `/business-api` proxy 返回 HTTP 200。
- 账号设置里的通知设置读取已在真实浏览器复测：`/user/notification/settings` 通过 `/business-api` proxy 返回 HTTP 200，页面展示 `room_notice`、`at_me`、`robot_reply` 三个 Web 端开关。
- 上述只读接口失败时前端按空态或当前项兜底处理，并以 `console.debug` 记录；不会弹用户级错误 toast。
- `/system/announcements/read`、`/system/announcements/read-all`、`/user/notification/settings/update` 仍是写操作，保留确认和错误提示；本轮未触发。

## 2026-06-21 群设置业务入口只读补充

- 群设置抽屉只读入口已在真实 Chrome 中复测：群公告、入群审核、特殊成员、群助手、在线成员。
- 已确认 `/room/openim/notices`、`/room/openim/join-requests`、`/room/openim/special-members`、`/room/openim/group-helpers/context`、`/room/openim/group-helpers`、`/room/openim/group-helpers/available`、`/room/openim/online-members` 通过 `/business-api` proxy 发起并返回 HTTP 200。
- 只读面板加载失败已改为静默空态兜底，不再因为当前 `roomId=OpenIM groupID` 契约不兼容而触发 `feedbackToast` 的 console error。
- 本轮未触发公告更新/删除、审核处理、特殊成员角色设置、群助手添加/移除、关键词增删改、群二维码生成、群设置保存等 mutation。

## 2026-06-21 群通知 businessApi 列表补充

- 通讯录「群通知」列表已补充 `/room/openim/join-requests` 只读业务列表尝试，并与 OpenIM SDK 群申请列表合并。
- 真实 Chrome 在 `#/contact/groupNotifications` 复测确认 `/business-api/room/openim/join-requests` 已对 `roomId=4011035808`、`roomId=3413653759` 发起请求，均为 HTTP 200。
- 当前业务体仍返回 `resultCode=1010101`，说明 OpenIM `groupID` 作为 business `roomId` 的契约仍需后端兼容；前端保留入口并继续使用 SDK 兜底，不打断页面。
- 本轮未点击同意/拒绝，未触发 `/room/openim/join-requests/handle` 或其他 mutation；Playwright console level 复查 0 errors、0 warnings。

## 数据源

- Swagger JSON：`docs/openim-swagger.json`
- Swagger 路径数：844
- 当前 `src/api/**` 业务请求唯一路径数：111
- 源码仍不在最新 Swagger 的路径：`/user/rtc/get_token`
  - 该路径属于既有 RTC/LiveKit 旧能力，最新 Swagger 只有 `/user/openMeet`，语义是获取视频会议地址，不能替代当前 `{ serverUrl, token }` 契约。
  - 音视频通话不在本次 Web 用户端首期清单内，本轮不强迁。

## Web 首期功能支持结论

| 功能                         | Swagger 支持性                                                                                                                                                      | 当前接入结论                                                                                                                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 企业号验证                   | 支持：`/enterprise/code/validate`                                                                                                                                   | 已接，企业号固定 `LOCALTEST001`                                                                                                                                                                                                                                                                                                |
| 个人账号登录                 | 支持：`/account/login`                                                                                                                                              | 已接，业务 token 使用 `access_token`，OpenIM SDK 使用 `openIM.token`                                                                                                                                                                                                                                                           |
| 注册                         | 支持：`/account/register`，文档说明无需短信验证码                                                                                                                   | 已接，邀请码非必填，固定企业号透传                                                                                                                                                                                                                                                                                             |
| 验证码/找回密码              | 部分支持：`/account/code/send`、`/account/code/verify`、`/user/password/reset`                                                                                      | 已接；reset 依赖验证码校验响应返回 `serial/deviceSerial/deviceID/deviceId`，缺失时前端阻断                                                                                                                                                                                                                                     |
| 多账号保存/一键切换/数据隔离 | Swagger 无专用接口                                                                                                                                                  | 属于前端本地账号态 + SDK 登录态能力；已保存账号 profile，聊天草稿按账号作用域存储，切换账号时清空 user/contact/conversation 运行态                                                                                                                                                                                             |
| IP 限制/宵禁登录提示         | 用户端无独立接口；后台有 `/console/**/security/**`                                                                                                                  | Web 端只从 `/account/login` 失败响应透出提示，不接后台安全接口                                                                                                                                                                                                                                                                 |
| 退出登录                     | 部分支持：`/user/logout` 存在，但要求 `deviceKey/devicekey/telephone(MD5)/access_token`                                                                             | 当前 Web 无稳定 device key 来源，不强接；继续 SDK logout + 本地账号态清理，详见 `2026-06-20-logout-contract-rescan.md`                                                                                                                                                                                                         |
| 单聊/群聊列表                | 不走 businessApi                                                                                                                                                    | 继续由 OpenIM SDK/API/WS 承担                                                                                                                                                                                                                                                                                                  |
| 单聊/群聊消息收发            | 支持发送前校验：`/friend/openim/send-before`、`/room/openim/send-before`                                                                                            | 业务接口做前置校验，实际消息收发仍走 OpenIM SDK                                                                                                                                                                                                                                                                                |
| 文件上传/下载/预览           | 支持：`/file/upload/context`、`/file/upload`、`/file/sign`、`/file/download`、`/file/preview` 等                                                                    | 已接；下载/预览必须有业务 `fileId` 和签名结果；文件资源详情、引用状态、引用关系只读链路已用真实文件返回 200                                                                                                                                                                                                                    |
| 图片/视频预览                | 支持业务签名预览；无业务 `fileId` 时无法强走业务预览                                                                                                                | 已接业务优先，失败或无 `fileId` 回退 SDK URL                                                                                                                                                                                                                                                                                   |
| 聊天记录搜索                 | 支持：`/friend/openim/messages/search`、`/room/openim/messages/search`                                                                                              | 已接；业务结果为空时用 SDK 本地历史只读兜底，不生成 `auditId`；真实 Chrome 已验证单聊业务搜索结果可展示                                                                                                                                                                                                                        |
| 消息转发/收藏/合并           | 支持：`/message/merge/**`、`/message/favorites/**`、发送前校验                                                                                                      | 已接；收藏和已保存合并消息只读列表已在真实 Chrome 返回 200；写操作前均有二次确认                                                                                                                                                                                                                                               |
| 消息复制/本地删除            | Swagger 无普通复制/本地删除接口                                                                                                                                     | 复制和本地删除继续走前端/SDK 能力                                                                                                                                                                                                                                                                                              |
| 群消息撤回                   | 支持：`/room/openim/message/recall`                                                                                                                                 | 已接，确认后业务撤回再同步 SDK                                                                                                                                                                                                                                                                                                 |
| 群设置查看                   | 支持：`/room/openim/detail`，旧 `/room/getRoom` 可兜底                                                                                                              | 已接，依赖业务 `roomId` 防护                                                                                                                                                                                                                                                                                                   |
| 群成员查看，受权限控制       | 支持：`/room/openim/members`                                                                                                                                        | 已接，SDK 失败兜底，权限由业务字段合并                                                                                                                                                                                                                                                                                         |
| 群公告管理                   | 支持：`/room/openim/notices`、`/room/openim/notice/update`、`/room/openim/notice/delete`                                                                            | 已接；Swagger 未提供新增公告接口，所以仅编辑/删除已有公告                                                                                                                                                                                                                                                                      |
| 群成员管理                   | 支持邀请/退群/踢人/转让：`/room/member/update`、`/room/member/delete`、`/room/transfer`；支持成员备注、禁言/解禁                                                    | 本轮补接 `/room/openim/member/remark/delete`、`/room/openim/member/mute`、`/room/openim/member/unmute`                                                                                                                                                                                                                         |
| 群权限设置                   | 支持：`/room/update`                                                                                                                                                | 已接 `showRead/isNeedVerify/joinMethod/searchable/showMember/allowAddFriend/allowSendCard/allowInviteFriend/allowEditNickname/allowShareQR/showOnlineStatus/allowUploadFile/allowMemberPrivateChat/allowAtAll/allowCreateNotice/allowConference/allowSpeakCourse/allowQuitRoom/withdrawTime/limitSendSmg/chatRecordTimeOut` 等 |
| 消息销毁设置                 | 支持：`/room/update`                                                                                                                                                | 已接 `messageDestroyEnabled/messageDestroyDays/messageDestroyNoticeEnabled/messageDestroyContentTypes/burnAfterRead*`                                                                                                                                                                                                          |
| 邀请审核                     | 支持：`/room/openim/join-requests`、`/room/openim/join-requests/handle`                                                                                             | 已接；群设置审核列表和通讯录群通知已统一归一化 `requestId`，真实处理仍需要带业务申请 ID 的群申请数据                                                                                                                                                                                                                           |
| 查看已读详情                 | 支持：`/room/openim/message/read-detail`                                                                                                                            | 已接；仍需真实普通群消息数据验收                                                                                                                                                                                                                                                                                               |
| 查看在线成员                 | 支持：`/room/openim/online-members`                                                                                                                                 | 已接；仍需真实群数据验收                                                                                                                                                                                                                                                                                                       |
| 群助手                       | 支持：`/room/openim/group-helpers/**`                                                                                                                               | 已接；写操作均需确认                                                                                                                                                                                                                                                                                                           |
| 群主/管理员设置              | 部分支持：用户端新 OpenIM 桥接没有明确 set-admin；旧接口有 `/room/set/admin`，后台有 `/console/**/rooms/member/set-admin`                                           | 已按旧用户端 `/room/set/admin` 接入群主设/取消管理员；不接后台 `/console/**`                                                                                                                                                                                                                                                   |
| 用户头像兜底                 | 支持：`/user/avatar/get`                                                                                                                                            | 已接入精确用户资料查询兜底：`/user/get`、`/user/getByAccount` 未返回头像时再读取头像 URL；不在批量列表逐项请求；好友详情真实只读复测返回 200                                                                                                                                                                                   |
| 好友资料只读                 | 支持：`/friends/list`、`/friends/get`、`/user/get`                                                                                                                  | 已接入通讯录和好友资料卡；真实 Chrome 已验证好友列表展示 `橙子皮1/橙子皮4`，好友 `10000006` 详情返回 200                                                                                                                                                                                                                       |
| 用户通知设置                 | 支持：`/user/notification/settings`、`/user/notification/settings/defaults`、`/user/notification/settings/update`                                                   | 已接入个人设置“消息提示”：展示 `room_notice/at_me/robot_reply`，不展示非本期红包通知；更新前有二次确认                                                                                                                                                                                                                         |
| 系统公告                     | 支持：`/system/announcements`、`/system/announcements/detail`、`/system/announcements/read`、`/system/announcements/read-all`、`/system/announcements/unread-count` | 已接左侧栏入口；未读数、列表、详情只读链路已在真实 Chrome 返回 200；标已读写操作在确认框后触发                                                                                                                                                                                                                                 |

## 本轮新增接入

- `src/api/group.ts`
  - 新增 `/room/openim/member/remark/delete`
  - 新增 `/room/openim/member/mute`
  - 新增 `/room/openim/member/unmute`
- `src/pages/chat/queryChat/GroupSetting/GroupMemberList.tsx`
  - 群成员备注保存为空时改走清空备注接口。
  - 群主/管理员可对低角色成员打开禁言/解禁入口。
  - 禁言/解禁仍需要二次确认，不在只读复测中触发真实 mutation。
- `src/utils/groupMember.ts`
  - 新增业务群成员角色归一化工具，将旧系统 `1/2/3/4/5` 统一映射到 OpenIM `100/60/20`。
  - `useGroupMembers` 和 `conversation` store 共用该工具，避免群主/管理员标签和权限判断在业务成员列表、当前成员状态之间出现不一致。
- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - 群消息销毁设置新增 `messageDestroyContentTypes` 多选入口，保存仍走 `/room/update` 和二次确认链路。
  - 未返回该字段时按全消息类型展示，空选择会前端阻断，避免提交空值。
- `src/api/friend.ts`
  - 新增 `/user/avatar/get` 封装，并作为精确用户资料查询的头像兜底。
- `scripts/verify-web-api-coverage.mjs`
  - `expectedWebApiPaths` 补入 `/user/avatar/get`，避免后续覆盖复核误判为意外源码接口。
- `src/api/notification.ts`
  - 新增用户通知设置读取、默认设置读取和批量更新封装。
- `src/layout/LeftNavBar/PersonalSettings.tsx`
  - 个人设置新增“消息提示”分组，接入用户端通知设置；红包通知不展示。
- `scripts/verify-web-api-coverage.mjs`
  - `expectedWebApiPaths` 补入 `/user/notification/settings`、`/user/notification/settings/defaults`、`/user/notification/settings/update`。

## 不接入或暂缓项

- `/console/**` 后台、平台、企业安全治理接口：不属于本次 Web 用户端。
- `/file/cleanup/**`、`/file/storage/enterprise-overview`：清理治理/企业容量后台能力，不属于普通 Web 用户端。
- `/room/openim/status`、`/room/openim/mapping`、`/room/openim/resync*`、`/room/openim/copy-room`、`/room/openim/failed`：旧系统到 OpenIM 的桥接运维接口，不属于用户操作。
- `/friends/attention/**`、`/friends/fans/list`、`/friends/friendsAndAttention`：关注/粉丝社交关系不在本期需求清单。
- 旧登录/注册/微信绑定链路：`/user/login/v1`、`/user/register/v1`、`/user/smsLogin`、`/user/bindWxAccount` 等不迁移，本期以 `/account/**` 为准。
- `/config/openim/status`：服务状态检查，不对应当前 Web 用户端功能入口。
- `/room/openim/robot/**`：机器人配置、关键字、Webhook 管理不在本期 Web 用户端清单；当前已接的是群助手 `/room/openim/group-helpers/**`。
- `/room/openim/red-packet/**`：红包涉及支付/金额变更，不属于本期 IM Web 接入范围。
- `/friendGroup/**`：好友分组有 Swagger，但当前联系人 UI 没有分组模型，本轮不引入新的通讯录信息结构。
- `/room/add`：创建群接口仍是旧系统完整 `room` 实体 + `text` + `keys` 契约，包含大量非本期字段；当前创建群继续使用 OpenIM SDK，待后端提供明确 Web 建群契约后再业务化。
- `/room/update` 中的 `maxUserSize`、自动减员、群状态、直播、站点 URL、管理员数量上限等字段：属于容量/治理/直播/后台配置，当前 Web 首期需求未提供产品入口，暂不强接。

## 复测

- 未运行单元测试、构建或验证脚本。
- 使用 Playwright CLI 做只读浏览器快照：
  - URL：`http://127.0.0.1:7777/index.html#/login`
  - 页面标题：`OpenCorp-Base`
  - 控制台：0 errors，1 warning（既有 npm warning）
- 角色归一化补充后再次做只读快照，结果仍为登录页正常渲染、控制台 0 errors、1 warning（既有 npm warning）。
- 群消息销毁类型接入后，受控 Chrome 使用测试账号登录成功，`/business-api/account/login` 返回 200，关键业务代理和 OpenIM 接口返回 200，页面正常停留在 `#/chat`；控制台只有既有 React Router/AntD 警告。
- 用户头像兜底接入后，受控 Chrome 使用测试账号登录成功，`/business-api/account/login`、`/business-api/user/get` 和关键 OpenIM 接口返回 200；当前账号头像兜底可能返回业务内部异常，前端已按 `userID` 缓存失败并静默保留原资料，避免重复失败请求和控制台告警。
- 用户通知设置接入后，受控 Chrome 使用测试账号登录并打开个人设置，`/business-api/user/notification/settings` 返回 200，页面展示群公告通知、@我通知、机器人回复通知，不展示红包通知；未点击开关，未触发 `/user/notification/settings/update`。
- 继续候选复核后，Playwright CLI 已连接真实 Google Chrome，使用 `18888888888 / czp0422+` 登录成功进入 `#/chat`；业务请求走 `/business-api/**` 代理，OpenIM SDK 请求走 `http://47.238.134.161:10002/**`；截图保存到 `output/playwright/chrome-current-verify.png`。
- 多账号运行态隔离补充后，真实 Chrome 重新登录 `18888888888 / czp0422+` 成功进入 `#/chat`，关键业务/OpenIM 请求返回 200，控制台错误复查为 0；截图保存到 `output/playwright/chrome-account-runtime-clear-verify.png`。
- 单聊聊天记录搜索只读复测：真实 Chrome 位于 `#/chat/si_10000003_10000021`，搜索 `你是谁` 后调用 `/business-api/friend/openim/messages/search?pageIndex=0&pageSize=50&peerUserId=10000021&keyword=...` 返回 200，页面展示 `橙子皮 / 你是谁`，控制台错误复查为 0；截图保存到 `output/playwright/chrome-chat-search-readonly-verify.png`。
- 聊天资源只读复测：同一单聊打开“聊天资源”，`/business-api/message/favorites`、`/business-api/message/merge/saved`、`/business-api/file/resources` 均返回 200；收藏和合并消息为空态，文件资源展示两条 `chuanxi.jpg`，控制台错误复查为 0；截图保存到 `output/playwright/chrome-chat-resources-readonly-verify-20260621.png`。
- 系统公告只读复测：左侧栏“系统公告”打开后 `/business-api/system/announcements`、`/business-api/system/announcements/unread-count`、`/business-api/system/announcements/detail` 均返回 200，页面展示真实公告 `script-announcement-high-risk-1781591010`；未触发 `/system/announcements/read` 或 `/system/announcements/read-all`；截图保存到 `output/playwright/chrome-system-announcements-readonly-verify-20260621.png`。
- 文件资源详情只读复测：真实文件 `chuanxi.jpg` 的 `/business-api/file/resources/detail`、`/business-api/file/reference/status`、`/business-api/file/resources/references` 均返回 200；未触发 `/file/download`、`/file/delete` 或 `/file/reference/invalidate`；截图保存到 `output/playwright/chrome-file-resource-detail-readonly-verify-20260621.png`。
- 好友列表与详情只读复测：通讯录 `我的好友` 展示 `橙子皮1`、`橙子皮4`；`/business-api/friends/list`、`/business-api/friends/get`、`/business-api/user/get`、`/business-api/user/avatar/get` 均返回 200；未触发好友关系变更；截图保存到 `output/playwright/chrome-friend-list-detail-readonly-verify-20260621.png`。
- 未触发 `/room/update`，未触发禁言、解禁、清空备注、上传、下载、发送、删除、审核等真实 mutation。

## 2026-06-21 只读浏览器复测补充

- 新朋友列表：`/friends/newFriendListWeb` 已在真实 Chrome 返回 200 并展示真实申请记录；处理申请未触发。
- 黑名单列表：`/friends/queryBlacklistWeb` 已在账号设置 -> 通讯录黑名单入口返回 200，当前账号为空态；移出黑名单未触发。
- 群通知：通讯录入口仍主要走 OpenIM SDK 群申请列表，未观察到业务 `/room/openim/join-requests` 列表请求；审核处理仍等待真实业务 `requestId` 数据复测。
- 我的群组与群成员：列表仍走 SDK；群资料卡触发 `/room/openim/members`，HTTP 200 但业务体 `resultCode=1010101`，说明 OpenIM `groupID` 兜底为 `roomId` 的后端契约仍未打通。入口保留，成员展示继续依赖 SDK/本地兜底。
- 本轮未触发发送、上传、下载、删除、审核、黑名单变更、群设置保存或其他真实 mutation；未运行单元测试、构建或验证脚本。
## 2026-06-21 群共享文件只读兜底补充

- `群共享文件`：Swagger 支持 `/room/openim/shares`、`/room/openim/share/add`、`/room/openim/share/delete`。
- 当前代码已保留聊天资源中的“群共享文件”入口，并通过 `/business-api/room/openim/shares` 发起只读列表请求。
- 真实 Chrome 在 `#/chat/sg_4011035808` 复测确认列表请求 HTTP 200，但业务体仍受 `roomId=OpenIM groupID` 契约影响，可能返回参数校验失败。
- 前端已将该只读列表失败调整为空态兜底，不再触发 `feedbackToast` error；写操作仍保留确认和错误提示。
- 本轮未触发上传、下载、删除、分享新增/删除等 mutation。

## 2026-06-21 已读详情只读兜底补充

- `查看已读详情`：Swagger 支持 `/room/openim/message/read-detail`。
- 当前代码已在群消息右键菜单接入“已读详情”入口，请求失败时展示空态并 `console.debug` 记录，不再触发用户级错误 toast。
- 当前真实浏览器没有可右键群消息节点，因此接口调用仍待真实群消息数据补验。
- 本轮未触发发送、撤回、删除、收藏、下载或其他 mutation。

## 2026-06-21 聊天搜索业务失败兜底补充

- `聊天记录搜索`：Swagger 支持 `/friend/openim/messages/search` 和 `/room/openim/messages/search`。
- 当前代码继续业务接口优先；业务失败或无结果时使用 OpenIM SDK 本地历史消息兜底。
- 业务失败且本地无结果时展示空态，不触发用户级错误 toast；搜索结果收藏/合并等写操作仍保留确认和错误提示。
- 当前真实浏览器无可打开会话，本轮未触发真实搜索请求或任何 mutation。

## 2026-06-21 联系人申请列表补充

- `新朋友`：Swagger 支持 `/friends/newFriendListWeb`，当前与 OpenIM SDK 好友申请列表双通道合并。
- `群通知`：Swagger 支持 `/room/openim/join-requests`，当前与 OpenIM SDK 群申请列表双通道合并。
- SDK 或 businessApi 任一来源失败时不阻断另一路只读结果，失败仅 debug 记录。
- 真实 Chrome 已确认新朋友列表展示真实申请记录，群通知触发 `/room/openim/join-requests` 请求；未点击同意/拒绝，未触发处理申请 mutation。

## 2026-06-21 群成员只读列表补充

- `群成员查看`：Swagger 支持 `/room/openim/members`。
- 当前代码在群资料卡、群设置成员列表和选择器中统一通过 `useGroupMembers` 使用 businessApi 优先、SDK 兜底。
- 真实 Chrome 已确认 `/business-api/room/openim/members?roomId=3413653759` 返回 200 并展示 3 个成员。
- 两侧读取失败时只做空态/debug 兜底；成员管理写操作仍保留确认和错误提示。
## 2026-06-22 聊天资源只读详情失败兜底补充

- `聊天资源` 弹窗的只读详情类入口已统一兜底：收藏/合并上下文、文件容量概览、文件详情、引用状态、引用关系请求失败时展示空详情并 `console.debug`，不触发用户级错误 toast。
- 下载、删除、收藏编辑保存等主动操作未纳入该兜底，继续保留确认和错误提示。
- 真实浏览器复测 `#/chat/si_10000003_10000021` 确认以下请求均通过 `/business-api` 返回 HTTP 200：`/message/favorites/context`、`/file/resources`、`/file/storage/overview`、`/file/resources/detail`、`/file/reference/status`、`/file/resources/references`。
- 本轮未触发 `/file/download`、`/file/delete`、`/file/reference/invalidate` 或其他真实 mutation。
## 2026-06-22 群文件容量概览只读复测补充

- 群聊 `#/chat/sg_3413653759` 的聊天资源弹窗仍展示“群共享文件”入口。
- `/business-api/room/openim/shares?pageIndex=0&pageSize=50&userId=0&roomId=3413653759` 返回 HTTP 200，页面空态。
- `/business-api/file/storage/room-overview?roomId=3413653759` 返回 HTTP 200，但业务体为 `resultCode=0`、`resultMsg="群ID不合法。"`；前端按只读详情兜底展示 `{}`。
- 结论：前端已接入口并保留入口，未完成点在后端 `roomId` 契约兼容；本轮未触发任何 mutation。
## 2026-06-22 群消息已读详情只读复测补充

- 群消息右键菜单中的 `消息已读列表` 已在真实浏览器触发验证。
- 请求 `/business-api/room/openim/message/read-detail?roomId=3413653759&clientMsgID=...&serverMsgID=...&seq=6` 返回 HTTP 200，但业务体为 `resultCode=1010101`、`请求参数验证失败，缺少必填参数或参数错误`。
- 前端展示空态 `未搜索到相关结果`，控制台 error 为 0；未触发转发、收藏、删除、撤回、发送或其他 mutation。
- 该接口前端接入完成，剩余问题为后端 `roomId=OpenIM groupID` 契约兼容。

## 2026-06-22 群设置只读入口复测补充

- 群设置抽屉在 `#/chat/sg_3413653759` 可打开；当前账号只展示普通成员入口：群公告、群二维码、在线成员。
- `群公告` 调用 `/business-api/room/openim/notices?pageIndex=0&pageSize=20&roomId=3413653759`，HTTP 200，业务体 `resultCode=1010101`，页面空态。
- `在线成员` 调用 `/business-api/room/openim/online-members?pageIndex=0&pageSize=100&roomId=3413653759`，HTTP 200，业务体 `resultCode=1010101`。
- 管理员入口 `入群审核`、`特殊成员`、`群助手` 当前账号不可见，仍需群主/管理员账号复测。
- 网络侧观察到一次 `/room/openim/member/clear-message` 请求，业务体参数校验失败未成功；该写操作风险已单独记录，后续 mutation 验收必须再次确认。
