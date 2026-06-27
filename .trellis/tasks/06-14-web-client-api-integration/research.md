# Web 端接口接入映射

## 2026-06-21 聊天资源上下文与容量概览只读结论

- 聊天资源弹窗中“收藏上下文”“合并上下文”“容量概览”均属于用户端只读能力，用于展示后端支持字段、限制、action API、空态文案和容量配额。
- 真实浏览器复测确认：
  - `/business-api/message/favorites/context?access_token=...` 返回 200，包含 `favoriteSupported`、`mergeSupported`、`maxMergeCount`、`fieldMetas`、`actionApis`。
  - `/business-api/message/merge/context?access_token=...` 返回 200，包含 `mergeForwardSupported`、`mergeSaveSupported`、`sdkSendRequired`、`maxMergeCount`、`contentTypeMetas`、`actionApis`。
  - `/business-api/file/storage/overview?access_token=...` 返回 200，包含 `ownerUserId=10000003`、`totalSizeBytes=1724281`、`fileCount=2`、`quota`、`recentUploads`。
- 复测期间未触发下载、删除、引用失效、收藏更新、合并保存或其他写操作；这些动作仍需要用户明确确认后再验证。
- 本轮进一步补足了聊天资源类只读验收，不依赖单元测试或验证脚本。

## 2026-06-21 图片视频预览只读兜底日志结论

- 图片/视频消息渲染时的业务签名预览属于只读增强能力：有业务 `fileId` 时优先读取业务预览 URL，失败时回退 OpenIM SDK 原始媒体地址。
- 该失败不应作为用户级错误或浏览器 warning 暴露；已将图片、视频预览读取失败日志降级为 `console.debug`。
- 文件下载、消息右键下载、收藏、撤回、删除等用户主动操作仍保留确认或错误提示，不纳入静默兜底。
- 当前真实浏览器停留在 `#/contact/myGroups`，无图片/视频消息节点，未触发真实媒体预览读取；页面正常渲染，剩余 console error 来自已知 OpenIM WS 握手失败。

## 2026-06-21 联系人与会话只读兜底日志结论

- 联系人列表、黑名单、群详情和当前群成员信息均存在 OpenIM SDK 基线数据与 businessApi 增强数据合并的模式。
- businessApi 增强读取失败时，前端应保留 SDK 基线结果，不应将只读增强失败升级为浏览器 warning 或用户级 toast。
- 已将以下只读增强失败日志降级为 `console.debug`：
  - `src/store/contact.ts`：`getFriendListByReq` 的 businessApi 好友列表合并。
  - `src/store/contact.ts`：`getBlackListByReq` 的 businessApi 黑名单合并。
  - `src/store/conversation.ts`：`getCurrentGroupInfoByReq` 的 businessApi 群详情合并。
  - `src/store/conversation.ts`：`getCurrentMemberInGroupByReq` 的 businessApi 当前成员合并。
- OpenIM SDK 基线读取失败仍保留用户级错误提示，因为此时页面缺少可展示的基础数据。
- 真实浏览器刷新 `#/contact/myGroups` 后页面正常渲染，业务只读请求仍通过 `/business-api` proxy 返回 200。

## 2026-06-21 系统公告与通知设置只读兜底结论

- 系统公告仍属于 Web 用户端可见只读能力，入口位于左侧栏“系统公告”。
- 真实浏览器复测确认：
  - 列表读取：`/business-api/system/announcements?pageIndex=0&pageSize=30&access_token=...` 返回 200。
  - 未读数读取：`/business-api/system/announcements/unread-count?access_token=...` 返回 200。
  - 详情读取：`/business-api/system/announcements/detail?announcementId=8a0b0fa2156347c6991bfc044666f2ab&access_token=...` 返回 200。
  - 页面展示真实公告 `script-announcement-high-risk-1781591010 / high risk content`。
- 通知设置属于账号设置内的 Web 用户端偏好能力。
  - 真实浏览器复测确认 `/business-api/user/notification/settings?access_token=...` 返回 200。
  - 页面展示 `room_notice`、`at_me`、`robot_reply` 三个 Web 端通知开关。
  - `red_packet` 等非本期 Web IM 能力不展示。
- 只读读取失败的用户级 toast 已调整为静默兜底和 `console.debug`；标已读、全部标已读、通知设置更新仍属于写操作，必须保留确认和错误提示。
- 本轮复测没有触发 `/system/announcements/read`、`/system/announcements/read-all`、`/user/notification/settings/update` 或其他真实 mutation。

## 2026-06-21 群设置只读面板复测结论

- 群设置抽屉中的 Web 群管理只读入口已经能在真实 Chrome 中发出对应 businessApi 请求：
  - 群公告：`/room/openim/notices`
  - 入群审核：`/room/openim/join-requests`
  - 特殊成员：`/room/openim/special-members`
  - 群助手：`/room/openim/group-helpers/context`、`/room/openim/group-helpers`、`/room/openim/group-helpers/available`
  - 在线成员：`/room/openim/online-members`
- 这些请求均通过 `/business-api` proxy，均观察到 HTTP 200；当前测试群 `4011035808` 下页面为空态或无可展示结果。
- 因后端仍未完全兼容 OpenIM `groupID` 作为 business `roomId`，只读面板加载失败时不应打断页面或污染浏览器 error；已改为 `console.debug` + 空态兜底。
- 后续真实数据验收仍需后端明确 `roomId` 契约或返回业务 roomId；涉及公告更新/删除、审核处理、特殊成员角色设置、群助手添加/删除/关键词保存等 mutation 必须单独确认后再验证。

## 2026-06-21 群通知 businessApi 列表兜底结论

- 通讯录「群通知」已从单纯 OpenIM SDK 列表扩展为 SDK 基线 + businessApi `/room/openim/join-requests` 只读合并尝试。
- 真实 Chrome 复测确认前端会对当前可见群发起：
  - `/business-api/room/openim/join-requests?pageIndex=0&pageSize=100&roomId=4011035808&status=-1&access_token=...`
  - `/business-api/room/openim/join-requests?pageIndex=0&pageSize=100&roomId=3413653759&status=-1&access_token=...`
- 两个请求 HTTP 状态均为 200，但业务体返回 `resultCode=1010101`、`请求参数验证失败，缺少必填参数或参数错误`，继续印证当前后端还未兼容 OpenIM `groupID` 作为业务 `roomId`。
- 前端策略保持入口保留、请求尝试、失败不打断、SDK 兜底展示；这符合用户要求“保留入口，后续后端改接口实现”。
- 处理申请的 `/room/openim/join-requests/handle` 仍需要真实业务 `requestId`，本轮未点击同意/拒绝，未触发任何审核 mutation。

## 数据源

- Swagger JSON：`docs/openim-swagger.json`
- Swagger 页面：http://47.238.134.161:8092/openim-swagger.html
- 原始 Swagger：`http://47.238.134.161:8092/v2/api-docs`，最新复核后已重新保存到本地 `docs/openim-swagger.json`，当前路径数为 844。
- 代理基址：`/business-api`
- 后端业务服务：`http://47.238.134.161:8092`
- OpenIM API：`http://47.238.134.161:10002`
- OpenIM WS：`ws://47.238.134.161:10001`
- 代理配置：`vite.proxy.ts` 统一生成 `/business-api` proxy，供 `vite.config.ts`、`vite.legacy.config.ts`、`vite.web.config.ts` 共用。
- 静态覆盖检查：`npm run verify:web-api-coverage`，除 63 个 Web 端期望接口外，仅允许已知兼容保留接口出现在 `sourceOnly/sourceNotInSwagger` 白名单，新增非清单或非 Swagger 路径会失败。
- 静态行为检查：`npm run verify:web-api-behavior`，校验登录成功保存 profile 后再跳转、后端拒绝文本透传、账号作用域草稿、多账号 token 切换、切换账号先退出 SDK 并清空内存 store、侧边栏多账号切换 UI 验收定位钩子、退出登录清空内存数据、`send-before` 阻断 SDK 发送和文件签名下载/预览强校验等关键代码路径不变量。
- 静态契约检查：`npm run verify:web-api-contract`，校验 Swagger 参数位置/必填定义、源码请求形态、验证码查询别名、好友分页/备注/黑名单参数、单聊/群聊设置参数、文件签名/引用失效参数、消息搜索/收藏/合并转发参数、业务 token/OpenIM token 分离以及三个 Vite 配置的 `/business-api` proxy。
- 当前本地验证基线：2026-06-14 重新执行 `npm run verify:web-api-local` 通过；覆盖检查 63 个 Web 期望接口无缺失，契约检查 193 条通过，行为检查 29 条通过，`verify:web-api-e2e` dry-run 和 `verify:web-api-ui` 默认 skip 通过，TypeScript 与 Web build 通过。
- 后续验收约束：按用户最新要求，本项目后续不再新增/修改测试文件或验证脚本，不再以单元测试/自动化测试作为推进动作；所有功能接入完成后仅使用真实浏览器复测实际页面流程。历史验证脚本记录只作为既有背景，不再作为后续工作入口。
- 验证脚本 lint：`npm run verify:web-api-lint`，覆盖 `scripts/verify-web-api-*.mjs`；脚本使用动态 Swagger/JSON/HTTP 数据，ESLint 通过 `scripts/**/*.mjs` Node override 关闭不适合该类脚本的 `no-unsafe-argument/no-unsafe-return`。
- 端到端验收入口：`npm run verify:web-api-e2e` 默认 dry-run，不发远端请求；设置 `OPENIM_E2E_RUN_REMOTE=1` 并提供测试账号、好友、群、消息、文件等环境变量后执行只读远端检查，覆盖好友目标搜索 `/friends/page`、通讯号查人 `/user/getByAccount`、聊天记录搜索、消息收藏列表/详情、已保存合并消息列表/详情、合并消息预览和转发前置校验；再显式设置 `OPENIM_E2E_RUN_MUTATION=1` 和对应变量后，可验证文件上传/签名预览下载以及群免打扰、置顶、成员备注、特殊成员、公告更新、入群审核处理、清空群消息游标等变更接口。
- Web UI 登录验收入口：`npm run verify:web-api-ui` 默认跳过；设置 `OPENIM_E2E_RUN_UI=1`、`OPENIM_E2E_WEB_URL`、`OPENIM_E2E_ACCOUNT1_PHONE`、`OPENIM_E2E_ACCOUNT1_PASSWORD` 后验证登录表单调用 `/account/login` 并跳转 `#/chat`。

## 接口分类与 Web 需求对齐

### 登录

| Web 需求     | 接口                        | 说明                                                            |
| ------------ | --------------------------- | --------------------------------------------------------------- |
| 企业号验证   | `/enterprise/code/validate` | 支持企业 ID、企业名称关键字、企业号 companyCode、有效企业邀请码 |
| 个人账号登录 | `/account/login`            | 当前 Web demo 优先使用，返回业务 token 和 OpenIM token          |
| 注册         | `/account/register`         | 兼容前端 JSON 请求，最新文档明确注册无需短信验证码              |
| 发送验证码   | `/account/code/send`        | 当前阶段固定验证码可能为 666666                                 |
| 校验验证码   | `/account/code/verify`      | 当前保留给找回密码等验证码流程；注册不再依赖验证码              |
| OpenIM token | `/user/openim/token`        | 刷新或获取当前登录用户的 OpenIM token                           |

不优先使用：

- `/user/login/v1`：参数复杂，偏旧业务链路或非当前 demo 主入口。
- `/user/register/v1`：参数复杂，当前 Web demo 优先使用 `/account/register`。

### 登录限制

可见接口：

- `/console/enterprise/security/login/precheck`
- `/console/enterprise/security/curfew/status`
- `/console/enterprise/users/login-ip-bindings`
- `/console/platform/security/login/precheck`
- `/console/platform/security/curfew/status`

判断：

- 这些接口从路径和 tag 看属于后台安全域。
- Web 用户端不应直接接入，除非后端明确授权并定义用户端返回结构。
- 当前接入应优先处理 `/account/login` 失败响应中的错误码和错误消息。

### 聊天发送与搜索

| Web 需求       | 接口                             | 说明                                                             |
| -------------- | -------------------------------- | ---------------------------------------------------------------- |
| 单聊发送前校验 | `/friend/openim/send-before`     | 通过后前端使用 OpenIM SDK 发送                                   |
| 群聊发送前校验 | `/room/openim/send-before`       | 通过后前端使用 OpenIM SDK 发送                                   |
| 单聊记录搜索   | `/friend/openim/messages/search` | 数据来自已落库 OpenIM 消息审计                                   |
| 群聊记录搜索   | `/room/openim/messages/search`   | 数据来自已落库 OpenIM 消息审计                                   |
| 群消息撤回     | `/room/openim/message/recall`    | 普通成员只能撤回自己 2 分钟内消息，群主/管理员可撤回本群任意消息 |

SDK 优先：

- 会话列表
- 单聊/群聊消息收发
- 常规消息复制
- 常规消息本地删除

### 文件与预览

| Web 需求         | 接口                     | 说明               |
| ---------------- | ------------------------ | ------------------ |
| 上传上下文       | `/file/upload/context`   | 获取上传前上下文   |
| 文件上传         | `/file/upload`           | 上传文件           |
| 下载/预览签名    | `/file/sign`             | 生成下载或预览签名 |
| 文件下载         | `/file/download`         | 按签名下载         |
| 文件预览         | `/file/preview`          | 按签名预览         |
| 图片压缩         | `/file/compress`         | 上传前或发送前压缩 |
| 视频转换         | `/file/convert`          | 转换视频为 MP4     |
| 当前用户文件列表 | `/file/resources`        | 文件管理或历史资源 |
| 文件详情         | `/file/resources/detail` | 文件详情           |

### 消息转发、收藏、合并

| Web 需求           | 接口                            | 说明                         |
| ------------------ | ------------------------------- | ---------------------------- |
| 合并消息预览       | `/message/merge/preview`        | 根据 auditIds 预览           |
| 保存合并消息       | `/message/merge/save`           | 保存快照，不发送 OpenIM 消息 |
| 合并转发前 payload | `/message/merge/forward-before` | 真实发送仍由前端 SDK 完成    |
| 已保存合并消息列表 | `/message/merge/saved`          | 查询已保存记录               |
| 已保存合并消息详情 | `/message/merge/detail`         | 查看详情                     |
| 删除已保存合并消息 | `/message/merge/delete`         | 不影响原消息                 |
| 收藏列表           | `/message/favorites`            | 用户端消息收藏列表           |
| 收藏单条消息       | `/message/favorites/add`        | auditId 推荐来自聊天记录搜索 |
| 删除收藏           | `/message/favorites/delete`     | 删除当前用户收藏记录         |
| 收藏详情           | `/message/favorites/detail`     | 查看收藏详情                 |

### 群管理

| Web 需求       | 接口                                      | 说明                                                                       |
| -------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| 群详情         | `/room/openim/detail`                     | 群详情聚合查询                                                             |
| 群成员列表     | `/room/openim/members`                    | 查询群成员列表                                                             |
| 在线成员       | `/room/openim/online-members`             | 查询群在线成员列表                                                         |
| 特殊成员       | `/room/openim/special-members`            | 查询隐身人和监控人                                                         |
| 设置特殊成员   | `/room/openim/member/set-special-role`    | 设置隐身人或监控人                                                         |
| 成员备注       | `/room/openim/member/remark/update`       | 修改群成员备注                                                             |
| 群公告列表     | `/room/openim/notices`                    | 查询群公告                                                                 |
| 修改群公告     | `/room/openim/notice/update`              | 修改并同步 OpenIM                                                          |
| 删除群公告     | `/room/openim/notice/delete`              | 删除并同步 OpenIM                                                          |
| 入群审核列表   | `/room/openim/join-requests`              | 查询入群申请                                                               |
| 处理入群审核   | `/room/openim/join-requests/handle`       | 同意/拒绝                                                                  |
| 已读详情能力   | `/room/openim/message/read-detail`        | 查询群消息已读详情能力状态                                                 |
| 群免打扰       | `/room/openim/member/set-offline-no-push` | 当前用户群免打扰                                                           |
| 群置顶         | `/room/openim/member/set-top`             | 当前用户群置顶                                                             |
| 清空群消息游标 | `/room/openim/member/clear-message`       | 清空当前用户群消息游标                                                     |
| 生成群二维码   | `/room/openim/qr/create`                  | 生成群二维码短码，支持可选有效小时                                         |
| 解析群二维码   | `/room/openim/qr/resolve`                 | 按短码解析群信息                                                           |
| 扫码入群       | `/room/openim/qr/join`                    | 按短码入群或提交入群审核，写操作前需要二次确认                             |
| 群权限设置     | `/room/update`                            | 更新入群验证、成员可见、成员邀请、文件上传、会议/讲课、已读展示等开关      |
| 消息销毁设置   | `/room/update`                            | 更新消息过期销毁、保留天数、销毁提示、阅后即焚、延迟秒数和阅后即焚提示开关 |

### 好友、成员、资料

| Web 需求          | 接口                               | 说明                               |
| ----------------- | ---------------------------------- | ---------------------------------- |
| 好友列表          | `/friends/list`                    | 获取好友列表                       |
| 好友详情          | `/friends/get`                     | 获取好友详情                       |
| 查找好友          | `/friends/page`                    | 搜索好友                           |
| 修改好友备注      | `/friends/remark`                  | 修改备注                           |
| 好友属性          | `/friends/update`                  | 修改好友属性                       |
| 好友置顶/免打扰等 | `/friends/update/OfflineNoPushMsg` | 好友消息免打扰、阅后即焚、聊天置顶 |
| 添加好友          | `/friends/add`                     | 业务侧添加好友关系                 |
| 删除好友          | `/friends/delete`                  | 业务侧删除好友关系                 |
| Web 黑名单分页    | `/friends/queryBlacklistWeb`       | Web 端黑名单分页列表               |
| 加入黑名单        | `/friends/blacklist/add`           | 业务侧拉黑用户，支持逗号分隔       |
| 移出黑名单        | `/friends/blacklist/delete`        | 业务侧取消拉黑                     |
| 新朋友列表        | `/friends/newFriendListWeb`        | Web 端新朋友/申请列表              |
| 群成员列表备用    | `/room/member/list`                | 旧群成员列表接口                   |
| 群成员详情备用    | `/room/member/get`                 | 旧群成员详情接口                   |

## 已处理差异点

- `src/api/login.ts` 已接入 `/account/login`、`/account/register`、`/account/code/send`、`/account/code/verify`、`/enterprise/code/validate`。
- 登录页和注册页已新增固定企业号展示；当前企业号按产品要求临时写死为 `LOCALTEST001`，输入框仅展示且不可编辑，登录、注册、发送验证码和校验验证码统一使用该固定企业号。
- `/account/code/send`、`/account/code/verify` 已按 Swagger query 参数定义传参，并补充 `telephone`；按用户最新联调口径，`invitationCode` 非必填，当前实现固定传 `enterpriseCode: "LOCALTEST001"`，不再默认传 `invitationCode`。本地 Swagger 仍把验证码接口的 `invitationCode` 标为 required，该差异已记录为文档与联调口径不一致。
- 登录响应已兼容 `resultCode: 1` 和 `access_token/openIM.token/openIM.userID/openIM.userId`。
- `/user/openim/token` 已进入 SDK token 过期恢复流程：SDK token 过期或 705 连接失败时优先刷新 OpenIM token，更新当前 profile 和已保存账号后重试 SDK 登录。
- 修改密码封装已对齐最新 Swagger：从历史 `/account/password/change` 迁移到 `/user/password/update`，按文档通过 query 传 `oldPassword/newPassword`；业务鉴权继续由请求层追加 `access_token`。
- 忘记密码流程已收敛到最新 Swagger reset 链路：发送验证码和校验验证码均使用修改密码场景 `usedFor: 2`；验证码校验响应必须包含 `serial/deviceSerial/deviceID/deviceId` 之一，随后重置密码调用 `/user/password/reset`，按 query 传 `randcode/telephone/newPassword/serial`。
- 忘记密码表单已收敛为手机号流程；Swagger 对 `/account/code/send`、`/account/code/verify` 明确当前阶段仅支持手机号且必填 `phoneNumber/telephone`，因此不再提供 email 找回密码分支。
- 注册表单已按最新 `/account/register` “注册无需短信验证码”契约收敛为直接注册流程；页面只保留手机号、固定企业号、昵称、密码和确认密码，不再触发 `/account/code/send` 或 `/account/code/verify`。
- 登录页验证码登录已收敛到手机号模式；email 登录模式只保留密码登录，避免验证码登录向 `/account/code/send` 发送缺少 `phoneNumber/telephone` 的请求。
- 登录页账号入口已收敛到手机号模式；Swagger `/account/login` 摘要说明当前阶段使用手机号和密码登录，因此不再展示 email 登录 Tab。
- `/user/password/reset` 已纳入业务请求公开路径；最新 Swagger 不支持历史 `/account/password/reset`，当前已移除该兜底，找回密码未登录流程不会因为浏览器残留业务 token 而自动追加 `access_token`。
- `/user/find/full`、`/user/search/full` 已从当前业务封装中迁移到 Swagger 内的 `/user/get`、`/friends/page` 等接口。
- 用户资料更新已把前端字段映射到 Swagger 字段：`faceURL -> headimgurl`、`gender -> sex`、`birth -> birthday`、`allowAddFriend -> friendsVerify`、`allowBeep -> isTyping`、`allowVibration -> isVibration`、`globalRecvMsgOpt -> chatSyncTimeLen`；资料响应归一化同时兼容 `headimgurl` 和 `phone`。
- 业务 API 默认使用业务 token；OpenIM SDK 单独使用 OpenIM token。
- `send-before`、群撤回、合并消息、收藏、群管理、文件等接口已按 Swagger query/formData 参数位置校准。
- 文本消息发送前校验失败时，`useSendMessage` 返回未进入发送流程，聊天输入框保留原内容；该场景不调用 OpenIM SDK `sendMessage`，并继续展示后端错误提示。
- `/room/update` 已按 Swagger query 参数接入群设置面板，布尔类开关统一转换为 `1/0`，SDK 群字段与业务字段同步更新。
- 图片发送主链路已接入业务文件上传上下文、上传、压缩，并通过消息 `ex` 保存业务文件元数据；图片渲染优先使用业务签名预览，失败回退 SDK URL。
- 普通文件发送主链路已接入业务文件上传上下文和上传；文件消息渲染新增下载入口，优先使用业务 `fileId` 走签名下载，失败回退 SDK URL。
- 视频发送主链路已接入业务文件上传上下文、上传和转换；视频消息渲染优先使用业务签名预览，失败回退 SDK URL。
- `/file/upload/context` 和 `/file/upload` 的 `scene` 参数已从内部消息类型拆开，按 Swagger 定义传 `image`、`common` 或 `room_share`；发送前校验失败后标记文件引用失效时，`reason` 已收紧为文档内的 `message_destroy`。
- 图片、视频、文件消息右键菜单新增下载入口，统一优先使用业务文件 `fileId`。
- 文件签名下载/预览链路已按 Swagger 必填字段保护：`/file/sign` 必须传 `fileId`，`/file/download`、`/file/preview` 只会在签名结果包含 `fileId/expiresAt/signature` 时继续请求。
- 聊天头部已新增聊天记录搜索入口，单聊走 `/friend/openim/messages/search`，群聊走 `/room/openim/messages/search`。
- 聊天记录搜索接口分页已按 Swagger 的 0 起始页码传参，避免跳过第一页审计消息。
- 好友搜索 `/friends/page`、Web 黑名单 `/friends/queryBlacklistWeb`、新朋友列表 `/friends/newFriendListWeb` 的分页已按 Swagger 的 0 起始页码传参，避免漏读第一页联系人或申请数据。
- 群成员列表已从 OpenIM SDK 查询切换为 `/room/openim/members`，由业务接口控制成员可见权限。
- 群成员、群公告、入群审核、在线成员、特殊成员等 OpenIM 群业务列表已按 Swagger 的 0 起始页码传参；群成员页大小收紧到文档上限 100。
- `我的群组` 页面筛选已把 `creatorUserID` 和当前 `userID` 归一为字符串比较，避免真实群数据中 ID 类型不一致导致“我创建的/我加入的”列表被误过滤为空。
- 用户卡片、单聊设置、联系人 store、群成员 hook、当前群成员状态更新、会话跳转、全局事件刷新、顶部搜索、转发选择器、消息点击名片和发送前当前会话判断已统一使用 `normalizeID/isSameID` 比较 `userID/groupID`；业务接口和 OpenIM SDK 混用数字/字符串 ID 时，好友状态、黑名单状态、列表合并、申请列表更新、成员状态更新和消息/会话定位不再依赖严格类型一致。
- 群成员列表已新增成员备注编辑入口，群主/管理员保存时调用 `/room/openim/member/remark/update`，成功后同步当前列表显示。
- 群设置抽屉已新增特殊成员入口，群主/管理员可查询 `/room/openim/special-members` 并通过 `/room/openim/member/set-special-role` 设置普通/隐身/监控角色。
- 群特殊成员设置、群成员备注、入群审核处理、群公告更新等封装已按 Swagger 必填字段收紧类型，避免漏传 `role/targetUserId/action/noticeContent` 等关键参数。
- 群公告删除、入群审核同意/拒绝、特殊成员角色设置属于远端变更动作，页面已加二次确认弹窗；后续真实群数据验收时需先打开确认弹窗核对，再由用户确认是否继续提交。
- 群设置抽屉已新增当前用户群免打扰、群置顶、清空聊天记录入口，分别调用 `/room/openim/member/set-offline-no-push`、`/room/openim/member/set-top`、`/room/openim/member/clear-message`，并同步 OpenIM SDK 会话设置或当前消息列表。
- 群设置抽屉已新增群二维码入口，覆盖 `/room/openim/qr/create`、`/room/openim/qr/resolve` 和 `/room/openim/qr/join`；生成/解析由用户主动触发，扫码入群在提交前弹二次确认。
- 单聊 `/friends/update/OfflineNoPushMsg` 封装已强制 `offlineNoPushMsg`；群免打扰、群置顶封装已分别强制 `offlineNoPushMsg`、`top`，避免调用处漏传状态值。
- 群设置抽屉的“允许添加群成员为好友”开关已在 OpenIM SDK `applyMemberFriend` 外同步业务 `/room/update` 的 `allowAddFriend` 字段，并同步旧兼容字段 `allowSendCard`；展示状态优先读取 `allowAddFriend`，缺失时回退 `allowSendCard`。
- 消息右键菜单已接入复制、本地删除、收藏和群消息撤回；群撤回先调用业务 `/room/openim/message/recall`，成功后同步 OpenIM SDK revoke。
- 群消息右键菜单的远端撤回动作已加二次确认，确认后才调用业务 `/room/openim/message/recall` 和 SDK `revokeMessage`；后续真实消息数据验收时需先核对确认弹窗，再由用户确认是否继续提交。
- 消息收藏和保存合并消息属于远端写操作；聊天搜索结果中的“收藏”“保存合并消息”和消息右键菜单“收藏”已加二次确认，避免真实环境误触后直接创建收藏或合并消息记录。
- 消息收藏和合并转发前置接口已统一优先读取消息对象或 `message.ex` 中的审计 `auditId/messageAuditId/msgAuditId`，缺失时才回退 OpenIM `serverMsgID/clientMsgID` 兼容定位。
- 群设置抽屉新增群公告、入群审核、在线成员入口；群消息右键菜单新增已读详情入口，覆盖群管理剩余高优先级 Web 功能。
- Web 联系人业务接口已补齐封装；好友备注入口已接入 `/friends/remark` 后再同步 OpenIM SDK，其余好友/黑名单页面仍优先使用 OpenIM SDK 能力，避免在未完成真实账号验收前改变现有交互语义。
- 真实 Chrome 已验证当前账号 `10000003` 的通讯录好友只读链路：`/friends/list` 返回后页面展示 `橙子皮1`、`橙子皮4`；点击 `橙子皮1` 后 `/friends/get`、`/user/get`、`/user/avatar/get` 均返回 200，资料卡展示 `userID=10000006`。本轮未触发备注保存、删除好友、拉黑或发送消息。
- 聊天记录搜索结果已新增合并消息预览和保存入口，使用搜索接口返回的审计 `id/auditId` 调用 `/message/merge/preview`、`/message/merge/save`。
- 聊天记录搜索结果已新增直接收藏入口，使用搜索接口返回的审计 `id/auditId` 调用 `/message/favorites/add`，补齐 Swagger 推荐的审计 ID 收藏路径。
- 聊天头部已新增聊天资源弹窗，收藏消息 Tab 调用 `/message/favorites`、`/message/favorites/detail`、`/message/favorites/delete`；已保存合并消息 Tab 调用 `/message/merge/saved`、`/message/merge/detail`、`/message/merge/delete`；文件资源 Tab 调用 `/file/resources`、`/file/resources/detail`、`/file/reference/status`、`/file/delete`，下载复用业务文件签名下载链路。
- 文件资源列表已按 Swagger 的 0 起始页码传参。
- `src/utils/businessPayload.ts` 已统一业务响应拆包和常见字段读取，降低不同接口返回 `data/result/obj/list/records/items` 时的页面重复兼容逻辑。
- `src/utils/businessPayload.ts` 的列表拆包在保留原优先级的基础上追加 `helpers/availableHelpers/groupHelpers/groupHelperList/members/onlineMembers/specialMembers/notices/joinRequests/shares/resources/favorites/messages/mergeMessages` 等字段，兼容 Swagger 仅声明 `additionalProperties`、后端实际使用业务命名数组字段的响应。
- 联系人 store 已在 SDK 基线数据上合并业务 `/friends/list`、`/friends/queryBlacklistWeb`、`/friends/newFriendListWeb`，避免直接替换 SDK 事件模型导致会话/通讯录状态丢失。
- 用户卡片好友详情已合并 `/friends/get`；好友备注已走 `/friends/remark` 后同步 SDK。
- 好友关系变更已按现有交互接入业务接口：接受好友申请先走 `/friends/add`，成功后同步 OpenIM SDK；解除好友先走 `/friends/delete`，黑名单新增/删除分别走 `/friends/blacklist/add`、`/friends/blacklist/delete` 后同步 SDK。Swagger 当前没有好友申请拒绝/处理业务接口，拒绝申请仍由 OpenIM SDK 负责。
- 添加好友、群搜索、加群入口已按接口边界从 OpenIM SDK 切换到 businessApi：用户卡片发送好友申请调用 `/friends/add`，顶部加群搜索调用 `/room/openim/detail`，群卡片加群调用 `/room/join`；消息收发、会话列表等 IM 能力仍保留 OpenIM SDK/API/WS。
- 邀请入群、退群、踢人、转让群主、解散群已按 Swagger 中参数明确的用户端群接口同步 businessApi：邀请入群调用 `/room/member/update`，退群/踢人调用 `/room/member/delete`，转让群主调用 `/room/transfer`，解散群调用 `/room/delete`，随后同步 OpenIM SDK；群通知/申请卡片查看群资料也改为 `/room/openim/detail`。创建群 `/room/add` 仍是旧系统复杂参数结构，当前保留 OpenIM SDK 能力并记录为待后端契约明确后再业务化。
- 资源类接口本轮补齐范围限定为 Web 聊天资源：收藏/合并消息上下文、当前用户文件容量、群文件容量、文件引用关系、群共享文件列表。`/message/favorites/update` 已接入收藏列表编辑流程，`/message/favorites/merge` 已接入聊天记录搜索结果的合并收藏流程，二者提交前均有二次确认；`/room/openim/share/add` 已接入群聊文件/视频发送后的共享登记流程，前提是用户主动上传且发送流程已启动；`/room/openim/share/delete` 只在群共享文件列表中通过二次确认后调用。
- 最新 Swagger 已保存到 `docs/openim-swagger.json`；本次复扫发现 `OpenIM-群助手` 是 Web 群管理侧最明确的新增用户端能力。已接入 `/room/openim/group-helpers/context`、`/room/openim/group-helpers`、`/room/openim/group-helpers/available`、`/room/openim/group-helpers/add`、`/room/openim/group-helpers/delete`、`/room/openim/group-helpers/keywords/add`、`/room/openim/group-helpers/keywords/update`、`/room/openim/group-helpers/keywords/delete`，页面入口位于群设置抽屉，仅群主/管理员可见；写操作均通过二次确认后执行。
- 黑名单移除属于远端关系状态变更，单聊设置和黑名单列表入口均已增加二次确认；确认后才调用 `/friends/blacklist/delete` 与 SDK `removeBlack`。
- 单聊设置已新增好友免打扰和置顶入口，调用 `/friends/update/OfflineNoPushMsg` 后同步 SDK 会话免打扰/置顶状态。
- 聊天输入草稿已通过 `getAccountScopedKey` 落到账号作用域缓存，键格式为 `IM_ACCOUNT:${accountKey}:CHAT_DRAFT:${conversationID}`；切换账号时不会读取另一个账号的同会话草稿。
- 接口覆盖可通过 `npm run verify:web-api-coverage` 复查：校验期望 Web 接口存在于 Swagger、存在于 `src/api/**`，源码未接入本任务排除的后台/支付/运营类前缀，额外源码接口必须处于已知兼容白名单，且三个 Vite 配置均接入业务代理。
- 接口契约可通过 `npm run verify:web-api-contract` 复查：校验关键 Swagger 参数 `in/query/formData/body` 与必填约束、源码 API 封装是否按文档传参、单聊/群聊设置封装是否强制状态参数、消息收藏/合并转发是否序列化 `auditIds/tags` 并保留远端验收入口、`/business-api` proxy/env 是否仍指向业务服务。
- Swagger 当前只提供群公告列表、修改、删除接口，未提供 Web/OpenIM 群公告新增接口；页面入口已改为编辑已有公告，避免无 `noticeId` 调用 `/room/openim/notice/update`。
- 消息转发选择器在 `FORWARD_MESSAGE` 场景开放群组目标；转发前置校验 `/message/merge/forward-before` 已按单聊/群聊分别传 `targetType: single/group` 和目标 ID，并优先使用后端返回的 OpenIM SDK message payload，缺失时才回退 SDK `createForwardMessage`。

## 待确认差异点

- IP 限制和宵禁提示当前只从 `/account/login` 失败响应展示，不直接接入 `/console/**/security/**` 后台接口。
- `/user/logout` 是用户退出登录接口，但 Swagger 要求 `deviceKey`、`devicekey`、`telephone` 和 `access_token`；当前 Web 登录响应/本地账号结构只稳定保存业务 token、OpenIM token、userID、手机号明文等信息，没有可确认的设备 key 来源，也没有文档说明 `telephone` 是否必须沿用登录时的 MD5 值。因此退出登录当前仍只执行 OpenIM SDK logout 和本地账号态清理，待后端明确设备 key/手机号参数契约后再同步业务退出。
- 忘记密码页面已支持 `/user/password/reset`，但该接口必填 `serial`，而 `/account/code/verify` Swagger 仍未定义 `serial` 来源；当前仅在后端实际返回 `serial/deviceSerial/deviceID/deviceId` 时进入新密码步骤并提交新接口，缺失时直接阻断并提示，不再调用最新 Swagger 不支持的历史 `/account/password/reset`。后续仍需后端明确验证码校验成功响应里的设备号字段。
- 群权限和消息销毁字段已接入；消息过期销毁保留天数、销毁后群内提示、阅后即焚延迟秒数和阅后即焚后群内提示已在群设置中开放，保存数值前会二次确认。
- 聊天记录搜索接口与本地 SDK 历史消息数据源仍可能存在差异：历史复测中单聊 `si_10000003_10000006` 可见本地消息 `qq`，但业务搜索按 `qq` 返回空态；最新真实 Chrome 复测已确认单聊 `si_10000003_10000021` 搜索 `你是谁` 时 `/friend/openim/messages/search` 返回 200 且页面展示业务审计结果 `橙子皮 / 你是谁`。因此前端业务搜索主链路可用，个别历史消息是否进入审计索引仍需后端按数据源确认。
- 添加好友按手机号 `18888888888` 的真实 Chrome 复测未拿到目标用户：UI 调用 `/friends/page`，Swagger 仅定义 `keyword/status/pageIndex/pageSize`，未定义独立手机号查询字段；后端返回 `data.total: 0`、`emptyState.text: 暂无匹配好友`。补查 `/user/getByAccount?account=18888888888` 返回“通讯号错误”，因此当前后端数据下该手机号既不是 `/friends/page` 可搜索结果，也不是通讯号。需后端确认该手机号是否注册、是否属于企业 `LOCALTEST001` 可见范围，或提供目标 `userId/通讯号` 再继续好友申请链路。
- 使用账号 `18888888888 / czp0422+` 真实浏览器登录成功，账号菜单显示该账号对应 `10000003`；但该账号当前聊天页、好友页、新朋友、群通知、我创建的群、我加入的群均无可见数据。切回 `10000021` 后在添加好友弹窗搜索 `10000003` 仍显示“未搜索到相关结果”，说明当前后端可见范围下两个测试账号之间也不能通过 `/friends/page` 建立好友搜索结果。
- UI E2E 已把添加好友搜索固化为守护：提供 `OPENIM_E2E_FRIEND_SEARCH_KEYWORD` 时，登录后走顶部 `+` -> 添加好友，监听 `/friends/page`；当响应总数为 0 时断言页面出现“未搜索到相关结果/No relevant results found”；当同时提供 `OPENIM_E2E_FRIEND_SEARCH_EXPECTED_USER_ID` 时，断言响应包含目标用户、搜索弹窗关闭且目标用户卡片打开；两种分支都断言不会发送 `/friends/add` 变更请求。
- UI E2E 已补充多账号切换验收入口：提供 `OPENIM_E2E_ACCOUNT2_PHONE` 和 `OPENIM_E2E_ACCOUNT2_PASSWORD` 时，会在同一浏览器上下文登录两个账号并保存到 `IM_WEB_SAVED_ACCOUNTS`，再通过侧边栏头像菜单的已保存账号列表切换回账号 1，断言当前业务 token、OpenIM token、userID 和 current account key 均切回账号 1。侧边栏头像和保存账号按钮使用非视觉 `data-testid`/`data-account-key`，只用于自动化定位；`npm run verify:web-api-e2e` dry-run 会在 “Optional data for Web UI login and saved-account checks” 段列出账号 1/2 变量，避免真实验收时漏配。
- 真实浏览器已用 `18888888888 / czp0422+` 与原账号 `18888888866 / Aa123467` 复测多账号切换：账号 `18888888888` 登录后为 `10000003`，菜单中 `10000003` 显示“当前”；点击已保存账号 `10000021` 后页面重载回聊天页，再次打开菜单确认 `10000021` 显示“当前”、`10000003` 显示“切换”。两个账号当前均无可见好友、会话或群组数据。
- 好友列表/详情/新增/删除/黑名单/新朋友、文件上传、视频转换、签名下载/预览、收藏/合并消息、群公告、入群审核、特殊成员、群免打扰/置顶/清空消息、已读详情、在线成员等接口仍需带真实账号、群和文件数据实测；文件资源列表/详情/引用状态/引用关系已有真实文件只读验收。
- 群助手入口已按接口文档接入，但当前测试账号没有可见群和助手数据；后续需真实群主/管理员账号验证只读列表，添加/移除助手和关键字增删改属于 mutation，必须由用户再次确认后再提交。
- 通讯录群通知页已补充业务审核兼容桥，但 Swagger 的 `/room/openim/join-requests/handle` 必填 `requestId`，OpenIM SDK `GroupApplicationItem` 类型没有该字段。当前只能从通知对象直出字段或 `ex` JSON 中尝试读取 `requestId/joinRequestId/applyId/id`；读取不到时仍保留 SDK 处理。后续需要真实群申请确认后端是否稳定透传业务申请 ID，否则建议用户从群设置抽屉的“入群审核”列表处理业务审核。
- 群管理入口权限判断已从纯 SDK 当前成员信息改为 SDK 兜底 + `/room/openim/members` 业务成员记录合并。该接口只读，查询参数使用 `roomId`、当前 userID 作为 `keyword`、`pageIndex: 0`、`pageSize: 100`；角色值兼容 OpenIM `roleLevel=100/60/20` 和旧系统 `role=1/2/3`。后续真实群验收时需确认后端 keyword 是否能按 userID 命中当前成员。

## 最新 Swagger 剩余候选审计

本轮按最新 `docs/openim-swagger.json` 复扫未接路径后，以下接口虽然名称上带有用户端、好友、群或消息语义，但不属于当前 Trellis Web 首期必接范围，或当前没有产品入口/数据契约支撑，暂不强行接入：

| 接口组                   | 代表接口                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 当前结论                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 系统公告用户端           | `/system/announcements`、`/system/announcements/detail`、`/system/announcements/read`、`/system/announcements/read-all`、`/system/announcements/unread-count`                                                                                                                                                                                                                                                                                                                                                                                                    | 已补入左侧栏系统公告入口：未读数、列表、详情为只读请求；单条/全部标已读只在用户点击后触发。                                                                                                                                                                                                                                                                                                        |
| 好友分组                 | `/friendGroup/list`、`/friendGroup/add`、`/friendGroup/update`、`/friendGroup/delete`、`/friendGroup/updateFriend`、`/friendGroup/updateGroupUserList`                                                                                                                                                                                                                                                                                                                                                                                                           | 当前通讯录 UI 没有好友分组概念；贸然接入会改变信息架构和好友管理语义。暂不接入，后续若产品要求分组通讯录再补。                                                                                                                                                                                                                                                                                     |
| 收藏表情                 | `/user/emoji/list`、`/user/emoji/add`、`/user/emoji/delete`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 当前聊天输入区使用本地/SDK 表情能力，没有“收藏表情”管理入口；且新增/删除属于用户远端写操作。暂不接入。                                                                                                                                                                                                                                                                                             |
| 关注/粉丝/单向关系       | `/friends/attention/*`、`/friends/fans/list`、`/friends/friendsAndAttention`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 属于社交关注关系，不在 Web 首期“好友/聊天/群管理”清单内；当前通讯录也没有关注/粉丝入口。暂不接入。                                                                                                                                                                                                                                                                                                 |
| 好友旧扩展字段           | `/friends/modify/phoneRemark`、`/friends/modify/encryptType`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 当前已接 `/friends/remark`、`/friends/update` 和单聊免打扰/置顶；手机号备注、加密方式没有产品入口和字段展示。暂不接入。                                                                                                                                                                                                                                                                            |
| 旧新朋友接口             | `/friends/newFriend/list`、`/friends/newFriend/last`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 当前 Web 新朋友列表已接 `/friends/newFriendListWeb` 并兼容 SDK 申请事件；旧 H5 接口不重复接入。                                                                                                                                                                                                                                                                                                    |
| Tigase 漫游/旧消息接口   | `/tigase/shiku_msgs`、`/tigase/shiku_muc_msgs`、`/tigase/getMessage`、`/tigase/pullChatMessageBySeqNos`、`/tigase/pullGroupMessageBySeqNos`、`/tigase/deleteMsg`、`/tigase/emptyMyMsg`、`/tigase/changeRead`                                                                                                                                                                                                                                                                                                                                                     | 当前消息收发、历史拉取和本地删除由 OpenIM SDK 承担；业务搜索已接 `/friend/openim/messages/search` 和 `/room/openim/messages/search`。旧 Tigase 漫游接口不纳入本期。                                                                                                                                                                                                                                |
| 用户加密密钥             | `/authkeys/*`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 涉及 RSA/DH/login/pay key 上传、支付私钥和安全聊天能力，当前 Web 首期没有端到端加密/支付密钥产品入口。暂不接入。                                                                                                                                                                                                                                                                                   |
| 用户举报/录制/离线操作   | `/user/report`、`/user/course/add`、`/user/offlineOperation`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 举报、消息录制和离线操作同步均未出现在本期 Web 功能清单；当前页面没有入口。暂不接入。                                                                                                                                                                                                                                                                                                              |
| 用户旧资料/发送消息接口  | `/user/get/v1`、`/user/sendMsg`、`/user/update/OfflineNoPushMsg`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 当前资料查询/更新已接 `/user/get`、`/user/update`，消息发送走 OpenIM SDK，单聊免打扰走 `/friends/update/OfflineNoPushMsg`；旧用户接口不重复接入。                                                                                                                                                                                                                                                  |
| 文件清理/企业容量        | `/file/cleanup/logs`、`/file/cleanup/logs/detail`、`/file/cleanup/run`、`/file/storage/enterprise-overview`                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 文件清理日志、手动清理和企业总容量属于后台/企业管理能力；Web 用户端已接个人/群文件容量和资源列表。暂不接入。                                                                                                                                                                                                                                                                                       |
| OpenIM 同步桥接运维      | `/room/openim/status`、`/room/openim/batch-status`、`/room/openim/mapping`、`/room/openim/failed`、`/room/openim/resync*`、`/room/openim/copy-room`                                                                                                                                                                                                                                                                                                                                                                                                              | 这些接口用于旧系统群到 OpenIM 的同步状态、批量状态查询、补偿和复制，属于运维/桥接治理，不是普通 Web 用户端操作。暂不接入。                                                                                                                                                                                                                                                                         |
| 开放平台群助手           | `/open/getHelperList`、`/open/addHelper`、`/open/updateHelper`、`/open/deleteHelper`、`/open/sendMsgByGroupHelper`                                                                                                                                                                                                                                                                                                                                                                                                                                               | 本期已接用户端 `/room/openim/group-helpers/**`；`/open/**` 属于开放平台管理和助手发消息能力，不在 Web 用户端群设置入口中直接调用。                                                                                                                                                                                                                                                                 |
| 旧登录/注册/账号绑定链路 | `/user/login/v1`、`/user/register/v1`、`/user/smsLogin`、`/user/login/auto/v1`、`/user/login/auto`、`/user/qrCodeLogin`、`/sendMsg`、`/user/bindingTelephone/v1`、`/user/bindingTelephone/v2`、`/user/bindWxAccount`、`/user/getBindInfo`、`/user/getWxOpenId`、`/user/unbind`                                                                                                                                                                                                                                                                                   | 参数包含 `data/salt/deviceId/loginInfo` 等旧加密、微信绑定或移动端字段。当前 Web 已按联调文档使用 `/account/login`、`/account/register`、验证码和 `/user/openim/token`，且没有微信绑定/解绑产品入口，不迁移到旧链路。                                                                                                                                                                              |
| RTC/会议旧接口           | `/user/rtc/get_token`、`/user/openMeet`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 当前聊天音视频能力沿用既有 SDK/RTC 模块；`/user/rtc/get_token` 不在最新 Swagger，`/user/openMeet` 只描述获取视频会议地址，未给出当前 Web RTC token 替代契约。暂保留既有 RTC token 入口，不纳入本期 Swagger 强接范围。                                                                                                                                                                              |
| 旧群接口                 | `/room/get`、`/room/getRoom*`、`/room/list*`、`/room/member/list`、`/room/member/get`、`/room/member/getMemberListByPage`、`/room/member/setOfflineNoPushMsg`、`/room/member/setBeginMsgTime`、`/room/notice/list`、`/room/noticesPage`、`/room/updateNotice`、`/room/notice/delete`、`/room/share/find`、`/room/share/get`、`/room/add/share`、`/room/sendMsg`、`/room/sendMsgBefore`、`/room/setInvisibleGuardian`、`/room/*GroupHelper`、`/room/*AutoResponse`、`/room/*ReceivePacketStatus`、`/room/*EncryptType`、`/room/*GroupChatKey`、`/room/location/*` | 本期已优先接入新版 `/room/openim/**`、`/room/update`、`/room/openim/shares`、`/room/openim/share/add/delete`。旧群资料/成员/公告/共享/群助手/自动回复/加密/位置/红包/旧发送前校验接口仅作为后端兼容背景保留，不在页面重复接入。例外：最新 Swagger 没有新的用户端 `/room/openim/member/set-admin`，管理员设置已按旧用户端 `/room/set/admin` 接入，且不接后台 `/console/**/rooms/member/set-admin`。 |
| 用户杂项/安全/支付资料   | `/user/getOnLine`、`/user/getDescribeVerifyToken`、`/user/getIdentityVerification`、`/user/getPrivateKey`、`/user/getRandomStr`、`/user/getUserMoeny`、`/user/update/payPassword`、`/user/getWx*`、`/user/getBindInfo`                                                                                                                                                                                                                                                                                                                                           | 在线状态、实人认证、私钥、随机码、余额、支付密码、微信资料/绑定信息均没有出现在本期 Web 登录/聊天/文件/群管理清单中；涉及安全或支付的接口不在 Web 首期 IM 接入范围。暂不接入。                                                                                                                                                                                                                     |
| 用户隐私设置/扩展资料    | `/user/settings`、`/user/settings/update`、`/user/profile/metas`、`/user/profile/update`、`/user/profile/email/bind`、`/user/profile/phone/bind`                                                                                                                                                                                                                                                                                                                                                                                                                 | 当前 Web 首期清单不包含隐私设置页、扩展资料元信息、邮箱/手机号绑定流程；基础资料查询/编辑已由 `/user/get`、`/user/update` 覆盖。`/user/settings/update` 还包含生活圈、地图、多点登录、关注/打招呼等非本期能力，暂不接入。                                                                                                                                                                          |
| OpenIM 回调/配置         | `/config/openim/callback/**`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 属于后端回调配置或服务端写入，不是 Web 用户端调用接口。                                                                                                                                                                                                                                                                                                                                            |

## 排除接口

本任务不接入：

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

## 2026-06-14 access_token 鉴权补充结论

- 原始 Swagger JSON 的 `securityDefinitions.Authorization` 只声明 `Authorization` header，且 1825 个 operation 都带 `security: [{ Authorization: ["global"] }]`，包括 `/account/login`，不能作为真实业务鉴权格式的充分依据。
- 自定义联调文档 `openim-swagger.html` 体现得更具体：`/account/login` 返回 `data.access_token / data.access_Token / data.accessToken`，说明为“业务后端 access_token，调用 Java 后端接口使用”；`data.openIM.token` 明确是 OpenIM SDK token，不是业务 token。
- 自定义联调文档的在线调试脚本对非公开接口追加 `access_token` query 参数，而不是 `Authorization` header；公开路径包括 `/account/login`、`/account/register`、验证码、找回密码 reset、配置和企业号校验等。
- 因此当前 Web 端业务接口统一取登录响应的 `access_token` 作为业务访问令牌，并随非公开业务接口以 `access_token` query 传递；OpenIM SDK 仍单独使用 `openIM.token`。
- 远端只读复核已验证该结论：登录成功后 `/friends/list`、`/message/favorites`、`/message/merge/saved` 通过；之前 `/friends/list` 的“缺少访问令牌”由未按联调文档追加 `access_token` query 导致。
- 后续仍需真实好友 ID、群 ID、文件 ID、消息 auditId/favoriteId/mergeId 等数据覆盖更多只读接口；任何上传、群设置、备注、审核、清空消息等 mutation 验收必须再次确认。

## 2026-06-14 登录后修改密码补充结论

- Swagger 当前提供 `/user/password/update`，必需参数为 `oldPassword/newPassword`；源码封装 `modifyPassword` 已按 query 传参并由请求层追加业务 `access_token`。
- 本轮审计发现该封装此前只存在于 API 层，没有挂到页面；已在“账号设置”中补充“修改密码”入口，避免 `/user/password/update` 停留在未接入状态。
- 提交前仍沿用现有登录/注册/找回密码链路的 MD5 口径，向后端传递 `oldPassword=md5(原密码)`、`newPassword=md5(新密码)`；成功后要求重新登录。
- 浏览器复测只验证入口和表单渲染，未点击确认按钮，未触发真实密码变更；完整 mutation 验收需要用户明确确认后再执行。

## 2026-06-14 最新 Swagger 文件接口补充结论

- 最新远端 Swagger 新增 6 个路径：`/file/cleanup/config`、`/file/cleanup/config/update`、`/file/cleanup/preview`、`/file/compress/async`、`/file/convert/async`、`/file/thumbnail`。
- `/file/compress/async`、`/file/convert/async`、`/file/thumbnail` 属于文件上传后的后台处理能力，已纳入 Web 文件消息链路：上传拿到业务 `fileId` 后请求缩略图；同步压缩/转码失败时再请求异步压缩/异步转码兜底。
- `/room/openim/send-before` 新增可选 `fileSize` 参数，已在群消息发送前校验中透传业务文件大小或 SDK 文件大小，便于后端做群文件大小权限校验。
- `/file/cleanup/config`、`/file/cleanup/config/update`、`/file/cleanup/preview` 属于清理策略配置与清理治理能力，`config/update` 是管理写操作；当前 Web 用户端没有清理策略产品入口，不纳入本期用户端接入。
- 本轮浏览器仅做页面编译和会话打开复测，没有上传文件或发送消息；异步压缩/转码/缩略图完整链路仍需要用户确认后用真实文件走上传 mutation 验收。

## 2026-06-14 聊天资源真实数据只读验收

- 真实浏览器在单聊 `si_10000003_10000009` 打开聊天资源面板，收藏消息和已保存合并消息 Tab 均正常返回空态。
- 文件资源 Tab 返回真实文件 `chuanxi.jpg`，展示大小 `841.29 KB` 和 `jpg` 类型，并提供详情、引用状态、引用关系、下载、删除入口；本轮未点击下载或删除。
- 点击“详情”返回真实文件详情：历史文件 `fileId=8aaa0c1897904f3992bbe1b695f40043` 和最新文件 `fileId=d78c623fa5704797a08a27422385d17f` 均可返回签名下载/预览 URL、`compressed=true`、`hasThumbnail=true`、缩略图路径和引用计数等字段。
- 点击“引用状态”返回 `referenceInvalid=false`、`canDelete=false`；点击“引用关系”返回 `referenced=false`、`referenceCount=0`、空态说明“暂无引用”。上述均为只读请求，未触发 `/file/download`、`/file/delete` 或 `/file/reference/invalidate`。
- 关闭弹窗后页面停留在 `#/chat/si_10000003_10000009`，无残留 modal；控制台仅有既有 React Router future warning、AntD `findDOMNode` warning 和 SDK 对象日志。

## 2026-06-21 通讯录与群入口只读复测结论

- 新朋友列表：真实 Chrome 验证 `POST /business-api/friends/newFriendListWeb?userId=10000003&pageIndex=0&pageSize=100&access_token=...` 返回 200，页面能展示真实申请记录。处理申请仍需单独确认后验收。
- 黑名单：账号设置 -> 通讯录黑名单能打开空态，`/business-api/friends/queryBlacklistWeb` 返回 200；当前账号无黑名单数据。移出黑名单属于 mutation，本轮未触发。
- 群通知：通讯录入口当前仍主要依赖 OpenIM SDK 申请列表接口，未观察到业务侧 `/room/openim/join-requests` 列表请求。业务审核兼容逻辑仍需带真实 `requestId` 的群申请数据验证。
- 我的群组：列表来自 OpenIM SDK 增量群数据；群资料卡会尝试 `/room/openim/members`，但使用 OpenIM `groupID=4011035808` 作为 `roomId` 时业务体返回 `resultCode=1010101`。前端兜底展示成员是必要的，后续待后端兼容 OpenIM groupID 或返回显式业务 roomId 后再复测。
- 本轮复测继续确认业务接口通过 `/business-api` 代理访问，OpenIM SDK 请求继续走 `http://47.238.134.161:10002`；未运行单元测试、构建或验证脚本。
## 2026-06-21 群共享文件只读兜底复测结论

- 群共享文件接口已按文档路径接入：`/room/openim/shares`，前端通过 `/business-api/room/openim/shares` 访问。
- 当前真实群 `4011035808` 的请求 HTTP 200，但业务体仍可能返回参数校验失败，说明后端暂未兼容 OpenIM `groupID` 作为业务 `roomId`。
- 根据用户要求，入口不能移除；前端策略为保留入口、发起请求、失败空态兜底，等待后端后续修正契约。
- 只读列表失败不应触发用户级错误 toast；用户主动操作如下载、删除、详情、上下文仍应保留错误提示和确认链路。
- 本轮真实浏览器复测未触发任何 mutation，剩余 console error 来源是 OpenIM SDK `/group/get_incremental_group_members_batch` 的既有同步错误。
## 2026-06-21 已读详情验收阻塞

- 代码已接入 `/room/openim/message/read-detail`，入口位于群消息右键菜单“已读详情”。
- 当前真实浏览器中，`#/chat/sg_4011035808` 消息区停留在加载状态，未出现可右键消息；重新登录后 `#/chat` 会话列表为空，仅显示“创建群聊”。
- 本轮无法在不发送新消息、不触发 mutation 的前提下复测已读详情。
- 阻塞项已记录为 `2026-06-21-message-read-detail-browser-blocked.md`。

## 2026-06-21 已读详情失败兜底策略

- 已读详情属于只读接口，和群公告、群共享文件等只读入口保持同一策略：入口保留，请求失败时空态兜底，等待后端兼容 `roomId` 契约。
- `showReadDetail` 已在本地捕获业务请求失败，避免 `/room/openim/message/read-detail` 参数校验失败时落入菜单通用 `feedbackToast`。
- 该调整不影响撤回、删除、收藏、下载等写操作或下载动作的确认保护。

## 2026-06-21 聊天搜索失败兜底策略

- 聊天搜索仍保持业务接口优先：单聊 `/friend/openim/messages/search`，群聊 `/room/openim/messages/search`。
- 业务搜索失败后继续走 OpenIM SDK 本地历史搜索；若本地无结果，页面显示空态，不把业务失败作为用户级 toast。
- 该策略覆盖业务搜索索引延迟、群 `roomId` 契约未兼容等只读失败场景；搜索结果收藏、合并等写操作仍走确认和错误提示。

## 2026-06-21 联系人申请列表双通道策略

- 新朋友和群通知列表应同时容纳 OpenIM SDK 数据和 businessApi 数据；任一来源失败都不能阻断另一路只读结果。
- 当前实现已将 SDK 与 businessApi 读取拆成独立 try/catch，合并后写入 store。
- 真实浏览器确认新朋友列表可展示业务/SDK合并后的申请记录；群通知会发起 `/room/openim/join-requests` 兜底请求。
- 处理申请仍属于 mutation，必须继续依赖用户明确点击和确认后再触发。

## 2026-06-21 群成员只读兜底策略

- 群成员查看继续使用 businessApi `/room/openim/members` 优先，OpenIM SDK 成员列表兜底。
- 两侧读取失败均按只读空态处理，不触发用户级错误 toast；后端 `roomId` 契约未兼容时不会污染页面。
- 真实 Chrome 已确认群资料卡可通过 `/business-api/room/openim/members` 读取并展示 3 个真实成员。
- 成员备注、禁言/解禁、设管理员等仍属于 mutation，保持确认框和错误提示。
## 2026-06-22 聊天资源只读详情失败兜底结论

- 聊天资源弹窗里的上下文、容量概览、文件详情、引用状态、引用关系均属于用户主动查看的只读能力；这类请求失败时应保持入口可用、展示空详情并用 `console.debug` 留痕，而不是按写操作弹用户级错误 toast。
- 本轮代码已按该策略收敛 `ChatBusinessResources.tsx` 的只读详情 catch 分支；下载、删除、收藏编辑保存仍保留确认与错误提示。
- 真实浏览器复测确认 `/business-api/message/favorites/context`、`/business-api/file/storage/overview`、`/business-api/file/resources/detail`、`/business-api/file/reference/status`、`/business-api/file/resources/references` 均返回 HTTP 200。
- 复测期间未触发下载、删除、引用失效、上传、发送、收藏保存、合并保存等 mutation；后续若后端返回业务失败，前端只读入口会按空详情兜底。
## 2026-06-22 群文件容量概览只读复测结论

- 群聊资源里的 `/room/openim/shares` 和 `/file/storage/room-overview` 入口均已由前端保留并通过 `/business-api` 发起请求。
- 真实浏览器复测群 `sg_3413653759` 时，`/room/openim/shares` HTTP 200 并展示空态；`/file/storage/room-overview` HTTP 200 但业务体返回 `resultCode=0`、`群ID不合法。`。
- 这继续证明当前后端尚未兼容 OpenIM `groupID` 作为业务 `roomId`；前端策略保持入口、发起请求、只读失败时空详情兜底，等待后端实现调整后复测。
- 本轮未触发上传、下载、删除、发送、群共享新增/删除、审核或群设置保存等 mutation。
## 2026-06-22 群消息已读详情只读复测结论

- 已读详情之前的阻塞条件“无可右键群消息节点”已解除：真实浏览器中群 `sg_3413653759` 存在可右键消息。
- 点击右键菜单 `消息已读列表` 后，前端按预期调用 `/business-api/room/openim/message/read-detail`，传参包含 `roomId=3413653759`、`clientMsgID`、`serverMsgID` 和 `seq`。
- 请求 HTTP 200，但业务体返回 `resultCode=1010101`、`请求参数验证失败，缺少必填参数或参数错误`；页面展示空态且控制台 error 为 0。
- 结论仍指向后端未兼容 OpenIM `groupID` 作为业务 `roomId`。前端入口、调用和只读兜底已验证；待后端契约兼容后再复测业务成功数据。

## 2026-06-22 群设置只读入口复测结论

- 当前账号在群 `sg_3413653759` 的群设置抽屉中仅可见普通成员入口：群公告、群二维码、在线成员；管理员入口入群审核、特殊成员、群助手不可见。
- 群公告和在线成员均已通过 `/business-api` 发起只读请求，HTTP 200 但业务体返回 `resultCode=1010101`。
- 这进一步证明 `/room/openim/notices`、`/room/openim/online-members` 也受同一 `roomId=OpenIM groupID` 契约影响。
- 群二维码可能触发二维码生成，未在本轮只读复测中点击。
- 网络列表出现一次 `/room/openim/member/clear-message` 请求，业务体参数校验失败未成功；该类清空操作属于高风险 mutation，后续必须单独确认后再验收。

## 2026-06-23 群在线成员只读复测结论

- 真实浏览器使用 `18888888888 / czp0422+` 登录后进入 `#/chat/sg_3413653759`，群设置抽屉和在线成员入口均可打开。
- 点击在线成员后，请求 `/business-api/room/openim/online-members?pageIndex=0&pageSize=100&roomId=3413653759`，HTTP 200。
- 响应业务体为 `resultCode=1010101`、`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`；页面展示空态 `未搜索到相关结果`，console error 为 0。
- 前端在线成员入口、代理和失败空态兜底已验证；成功数据仍等待后端兼容 OpenIM `groupID` 作为业务 `roomId` 或提供业务 `roomId` 映射。

## 2026-06-23 入群审核 status 默认值结论

- 管理员群 `sg_4011035808` 可见完整群管理入口，说明当前账号具备该群的管理权限，后续可用于管理员入口只读复测。
- 群设置 `入群审核` 面板按 Swagger 只传 `roomId/pageIndex/pageSize` 时，后端当前返回 HTTP 500；同接口带 `status=-1` 时进入 HTTP 200 路径。
- 前端已把 `status=-1` 下沉为 `getOpenIMJoinRequests` 默认参数，避免群设置入口和通讯录群通知入口行为不一致。
- 浏览器模块级复测确认请求已带 `status=-1`，但因 HMR 后页面回到登录页且业务登录接口一度返回 HTTP 500，本轮只能验证参数层和 HTTP 200 路径，不能验证带有效 `access_token` 的完整 UI 成功业务体。

## 2026-06-23 入群审核处理 requestId 必填结论

- `/room/openim/join-requests/handle` 的 Swagger 契约明确要求 `requestId` 和 `action`，其中 `action` 取值为 `approve/reject`。
- 前端封装层已将布尔 `agree` 归一化为 `action`，调用形态与 Swagger 一致。
- 入群审核列表现在会在业务数据缺少 `requestId` 时禁用同意/拒绝按钮，避免 SDK 兜底数据或后端异常数据暴露不可执行的审核操作。
- 真正执行同意/拒绝仍是远端 mutation，仍需后续有真实业务 `requestId` 且用户明确确认后再用浏览器验收。

## 2026-06-23 特殊成员设置 userId 必填结论

- `/room/openim/member/set-special-role` 的 Swagger 契约明确要求 `roomId/userId/role`。
- 前端封装层已强制要求这三个字段，调用形态与 Swagger 一致。
- 特殊成员列表现在会在业务数据缺少目标 `userId` 时禁用角色设置按钮，避免后端异常数据或字段不完整数据暴露不可执行的特殊成员 mutation 操作。
- 真正设置普通成员、隐身人或监控人仍是远端 mutation，仍需用户明确确认后再用浏览器验收。

## 2026-06-24 聊天资源操作必填 ID 结论

- 收藏详情/更新/删除、合并消息详情/删除、文件资源详情/删除、群共享文件删除分别依赖 `favoriteId/mergeId/fileId/shareId`。
- 前端封装层此前已在缺 ID 时直接返回，本轮进一步把防护前移到列表按钮层。
- 资源字段不完整时，详情/编辑按钮会禁用或删除按钮不展示；引用状态、引用关系和下载继续只在可解析 `fileId` 时展示。
- 群共享文件详情不依赖远端详情接口，仍允许展示原始记录，避免因缺 `fileId` 或 `shareId` 丢失只读查看能力。
- 真实下载、删除、收藏更新、合并消息删除仍属于副作用或 mutation，需要用户明确确认后再用浏览器验收。

## 2026-06-24 群成员管理 targetUserId 必填结论

- 群成员备注更新/删除、禁言、解禁都需要 `targetUserId`；管理员设置接口文档将 `touserId/type` 标为可选，但从接口语义看缺目标用户或目标角色时无法执行有效变更。
- 前端封装层已经强制传 `targetUserId/touserId`，本轮进一步在 UI 展示层补充 `member.userID` 条件。
- 业务成员数据缺少目标成员 ID 时，备注、禁言、解禁、设/取消管理员按钮不展示；执行函数也保留 `member.userID` 守卫。
- 真实成员备注、禁言、解禁、管理员设置仍是远端 mutation，需要用户明确确认后再用浏览器验收。

## 2026-06-24 群二维码 roomId/code 必填结论

- `/room/openim/qr/create` 的 Swagger 契约要求 `roomId` 必填，`expireHours` 可选；`/room/openim/qr/resolve` 和 `/room/openim/qr/join` 都要求 `code` 必填。
- 解析和扫码入群入口此前已经以 `parseCodeInput(inputCode)` 与 `resolvedCode` 控制可点击状态，缺 `code` 时不会进入接口调用。
- 本轮补齐生成二维码入口：缺 `roomId` 时生成按钮禁用，执行函数也会直接返回；传参使用 trim 后的 `roomId`，避免空白字符串造成无效请求。
- 群二维码生成、解析、扫码入群仍属于远端业务动作，本轮只做契约防护，未在浏览器中点击触发真实请求。

## 2026-06-24 群助手 roomId/ID 必填结论

- 群助手写操作的 Swagger 契约都依赖 `roomId`，并按动作依赖 `helperId/groupHelperId/keyWordId/keyword/value`。
- 前端此前已经对助手 ID、群助手记录 ID、关键词 ID、关键词和回复内容做了基础守卫，但缺少统一 `roomId` 前置。
- 本轮新增 `normalizedRoomId/canManage` 后，缺群上下文时不会加载群助手只读接口，也不会暴露添加、移除、关键词编辑、保存或删除按钮的可执行状态。
- 群助手添加/移除和关键词增删改仍是远端 mutation，本轮只做契约防护，未在浏览器中点击触发真实请求。

## 2026-06-24 群公告 roomId/noticeId/content 必填结论

- 群公告列表、更新和删除接口分别依赖 `roomId`、`roomId/noticeId/noticeContent`、`roomId/noticeId`。
- 前端此前已经对 `noticeId` 和编辑内容做了基础守卫，但列表读取和写操作仍直接使用原始 `roomId`。
- 本轮在 `GroupBusinessEntrances` 中新增 `normalizedRoomId/canUseRoomBusiness` 后，缺群上下文时群公告、入群审核、在线成员、特殊成员面板不会发出无效列表请求。
- 公告保存、编辑、删除按钮和执行函数都已补齐 `roomId` 守卫；特殊成员设置同文件内同步使用 trim 后 `roomId`。
- 公告保存/删除和特殊成员设置仍是远端 mutation，本轮只做契约防护，未在浏览器中点击触发真实请求。

## 2026-06-24 群设置保存 roomId 必填结论

- `/room/update` 的 Swagger 契约明确要求 `roomId`，其它设置字段如 `searchable`、`limitSendSmg`、`messageDestroyEnabled`、`messageDestroyDays`、`burnAfterReadSeconds` 等按需传递。
- `/room/delete` 要求 `roomId`，`/room/member/delete` 要求 `roomId/userId`。
- `useGroupSettings` 现在统一将业务 `roomId` 或 OpenIM `groupID` 兜底值 trim 后使用，避免空白字符串透传。
- business-only 设置在缺 `roomId` 时不再只更新本地 store；需要同步 `/room/update` 的群权限、群名称等入口也会在缺 `roomId` 时返回。
- 解散和退出群组属于高风险 mutation，本轮只补必填参数防护，未在浏览器中点击触发真实请求。

## 2026-06-24 群会话设置 roomId 必填结论

- `/room/openim/member/set-offline-no-push`、`/room/openim/member/set-top`、`/room/openim/member/clear-message` 的 Swagger 契约均要求 `roomId`。
- 群免打扰、群置顶、清空群消息游标不是纯 SDK 本地能力，当前 Web 接入应先走 businessApi 落业务状态，再同步 OpenIM SDK 或本地状态。
- `GroupSettings` 已改为缺 `businessRoomId` 时直接失败返回，不再跳过 businessApi 后继续调用 SDK 或更新本地状态。
- 清空群消息属于高风险 mutation，本轮只补必填参数防护，未在浏览器中点击触发真实请求。

## 2026-06-24 好友操作 toUserId 必填结论

- `/friends/add`、`/friends/delete`、`/friends/remark`、`/friends/update`、`/friends/blacklist/add`、`/friends/blacklist/delete` 的 Swagger 契约都要求 `toUserId`。
- `/friends/update/OfflineNoPushMsg` 文档只把 `offlineNoPushMsg` 标为必填，但 Web 单聊免打扰/置顶入口语义上必须有目标好友，否则无法确定更新对象。
- `SingleSetting` 现在会在缺目标用户 ID 时阻断单聊设置、拉黑和删除好友，不再跳过 businessApi 或继续同步 SDK。
- `UserCardModal`、`SendRequest`、`NewFriends` 现在统一在资料查询、好友申请发送、同意/拒绝申请、好友备注保存前归一化并校验目标用户 ID。
- 这些操作都属于远端 mutation 或会触发 SDK 状态变更，本轮只补契约防护，未在浏览器中点击触发真实请求。
