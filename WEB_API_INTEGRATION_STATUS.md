# Web 端接口接入状态

更新时间：2026-06-25

## 结论

本次接入范围只覆盖 Web 用户端。当前前端接入层、`/business-api` 代理、业务 token 传递、OpenIM SDK/API 配置已经基本铺完。

- 业务接口统一走 `/business-api` 代理，目标为 `http://47.238.134.161:8092`。
- OpenIM API 走 `http://47.238.134.161:10002`。
- OpenIM WS 走 `ws://47.238.134.161:10001`。
- 登录返回的业务 token 使用 `access_token`。
- OpenIM SDK 登录使用 `openIM.token`。
- 企业号固定为 `LOCALTEST001`。
- 当前不跑单元测试，验收方式为真实浏览器复测。

总体状态：前端已完成主要接口封装和入口接入；登录、通讯录、公告、聊天资源等只读链路已验证可用；群管理相关入口已接入，但多个群业务接口 HTTP 200 后业务体仍返回参数校验失败，主要待后端兼容 `roomId=OpenIM groupID` 或提供业务 `roomId` 映射。

## 已接入且已验证可用

### 基础链路

- `/business-api` 代理已生效。
- 业务请求自动携带 `access_token`。
- OpenIM SDK/API 请求仍走 `10002`，不混用业务 token。
- 真实浏览器已验证登录后进入 `#/chat`。

### 登录与账号

- `/enterprise/code/validate`
- `/account/login`
- `/user/openim/token`
- `/account/register`
- `/account/code/send`
- `/account/code/verify`
- `/user/password/reset`
- `/user/password/update`

已验证：

- `18888888888 / czp0422+` 登录成功。
- `/enterprise/code/validate` 返回 HTTP 200。
- `/account/login` 返回 HTTP 200。
- 登录后 OpenIM SDK 正常同步会话、好友、群信息。

### 系统公告

- `/system/announcements`
- `/system/announcements/detail`
- `/system/announcements/unread-count`
- `/system/announcements/read`
- `/system/announcements/read-all`

已验证：

- 公告未读数返回 HTTP 200。
- 公告列表和详情只读链路返回 HTTP 200。
- 标记已读、全部已读属于写操作，保留确认链路，未触发真实 mutation。

### 通讯录与好友资料

- `/friends/list`
- `/friends/get`
- `/friends/newFriendListWeb`
- `/friends/queryBlacklistWeb`
- `/user/get`
- `/user/avatar/get`

已验证：

- 好友列表可展示真实好友。
- 好友资料卡可展示用户信息。
- 新朋友列表可展示真实申请记录。
- 黑名单列表返回 HTTP 200，当前为空态。

### 用户通知设置

- `/user/notification/settings`
- `/user/notification/settings/defaults`
- `/user/notification/settings/update`

已验证：

- 设置读取返回 HTTP 200。
- 页面展示 Web 端相关开关。
- 更新接口为写操作，保留二次确认，未触发真实 mutation。

### 聊天搜索与资源

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

已验证：

- 单聊搜索返回 HTTP 200，并能展示搜索结果。
- 收藏消息、合并消息、文件资源列表返回 HTTP 200。
- 文件资源中真实文件 `chuanxi.jpg` 的详情、引用状态、引用关系返回 HTTP 200。
- 只读失败时前端已降级为空态或空详情，不再弹业务错误 toast。

### 文件基础能力

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

- 代码已接入上传、签名、下载、预览、压缩、转码、删除、引用失效等封装。
- 只读预览/详情链路已验证。
- 上传、下载、删除、引用失效等真实写入或副作用操作未触发。

## 已接入但后端业务体暂不可用

以下接口在真实浏览器中可通过 `/business-api` 发出，HTTP 状态多为 200，但业务体返回 `resultCode=1010101` 或“群ID不合法”。前端已保留入口并做空态兜底。

### 群详情与成员

- `/room/openim/detail`
- `/room/openim/members`

现象：

- 请求参数使用当前 OpenIM `groupID`，例如 `3413653759`。
- HTTP 200。
- 业务体返回参数校验失败。
- 页面继续使用 SDK/本地数据兜底展示群信息和成员。

### 群公告、审核、在线成员

- `/room/openim/notices`
- `/room/openim/join-requests`
- `/room/openim/online-members`

现象：

- 群设置抽屉入口可打开。
- 普通成员当前可见入口：群公告、群二维码、在线成员。
- 群公告请求返回 HTTP 200，但业务体 `1010101`，页面展示空态。
- 在线成员请求返回 HTTP 200，但业务体 `1010101`。
- 2026-06-23 复测 `#/chat/sg_3413653759`：点击在线成员后请求 `/business-api/room/openim/online-members?pageIndex=0&pageSize=100&roomId=3413653759`，HTTP 200，业务体 `resultCode=1010101`，页面空态 `未搜索到相关结果`，console error 为 0。
- 2026-06-23 复测管理员群 `#/chat/sg_4011035808`：群设置可见入群审核、特殊成员、群助手、群权限和消息销毁入口。入群审核列表未传 `status` 时后端 HTTP 500；已将 `getOpenIMJoinRequests` 统一默认 `status=-1`，浏览器模块请求变为 `/room/openim/join-requests?pageIndex=0&pageSize=50&status=-1&roomId=4011035808`，HTTP 200。
- 入群审核入口需要管理员权限账号继续复测。

### 群共享文件与容量

- `/room/openim/shares`
- `/file/storage/room-overview`

现象：

- 群共享文件请求返回 HTTP 200，但业务体参数校验失败。
- 群容量概览返回 HTTP 200，但业务体提示“群ID不合法”。
- 页面按只读详情失败展示空态或 `{}`。

### 群消息已读详情

- `/room/openim/message/read-detail`

现象：

- 入口已接入群消息右键菜单。
- 请求返回 HTTP 200，但业务体 `1010101`。
- 页面展示“未搜索到相关结果”，控制台无未处理错误。

## 已接入但未做真实 mutation 验收

这些接口已经在代码中接入，但会产生远端状态变化、发送、上传、下载、删除、审核或设置变更。当前仅确认代码路径和确认链路，没有点击确认执行真实操作。

补充审计：2026-06-23 已完成一轮写操作确认链路源码审计，申请处理、好友/黑名单、个人资料、公告、通知设置、聊天文件、消息右键菜单、聊天资源、群设置、群成员、群助手、群二维码、邀请/踢人/转让/转发等主要入口均存在 `modal.confirm` 或等价确认链路。审计记录见 `.trellis/tasks/06-14-web-client-api-integration/2026-06-23-mutation-confirmation-audit.md`。

### 好友操作

- `/friends/add`
- `/friends/delete`
- `/friends/remark`
- `/friends/update`
- `/friends/update/OfflineNoPushMsg`
- `/friends/blacklist/add`
- `/friends/blacklist/delete`

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

- 发送前校验通过后，实际消息收发仍由 OpenIM SDK 执行。
- 撤回、收藏、删除、转发等写操作保留确认或错误提示。

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

- 群设置、消息销毁、群权限、成员管理、禁言、管理员、群助手等入口已接入。
- 群二维码生成已按必填 `roomId` 做按钮和执行层防护；二维码解析、扫码入群已按必填 `code` 做按钮和执行层防护。
- 群助手添加/移除、关键词增删改已按 `roomId/helperId/groupHelperId/keyWordId/keyword/value` 做按钮和执行层防护。
- 群公告列表、更新、删除已按 `roomId/noticeId/noticeContent` 做按钮和执行层防护。
- 群设置保存、解散群组、退出群组已按 `roomId/userId` 做执行层防护，缺业务 ID 时不再只更新本地状态或进入确认链路。
- 当前普通成员账号无法完整复测管理员入口。
- 真实写操作需要后续单独确认后再验收。

## 还没确认的功能点

- 管理员或群主账号下的群管理完整流程。
- 入群审核同意/拒绝，需要真实业务 `requestId` 数据。
- 特殊成员设置、管理员设置、禁言/解禁。
- 群助手添加、删除、关键词增删改已完成必填参数防护，但未触发真实请求验收。
- 群二维码生成、解析、扫码入群已完成必填参数防护，但未触发真实请求验收。
- 群公告编辑和删除已完成必填参数防护，但未触发真实请求验收。
- 群设置保存、消息销毁设置保存已完成 `roomId` 防护，但未触发真实请求验收。
- 文件真实上传、下载、删除、引用失效。
- 图片/视频业务预览在有真实业务 `fileId` 的消息上的完整验证。
- 群消息发送、撤回、收藏、转发、删除的真实链路。

## 未实现或本期不接

### 不属于本次 Web 用户端范围

- `/console/**`
- `/file/cleanup/**`
- `/file/storage/enterprise-overview`
- `/room/openim/status`
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
  - 当前继续使用 SDK logout + 本地账号态清理。

- `/room/add`
  - 当前契约仍是旧系统复杂 `room + text + keys`。
  - 现有建群继续使用 OpenIM SDK。
  - 等后端提供明确 Web 建群契约后再业务化。

- `/user/rtc/get_token`
  - 当前源码中仍有旧 RTC 能力。
  - 最新 Swagger 对应能力不一致，音视频不属于本期 Web 用户端主线。

## SDK 与业务接口分工

### OpenIM SDK/API 负责

- 会话列表。
- 好友和群基础同步。
- 单聊、群聊消息实际收发。
- 历史消息基础拉取。
- WebSocket 长连接。
- 本地会话、消息、草稿等 SDK 状态。

### businessApi 负责

- 企业号校验、登录、注册、找回密码。
- 系统公告。
- 好友资料增强、好友申请增强、黑名单。
- 发送前业务校验。
- 聊天搜索增强。
- 文件资源、收藏、合并消息、引用关系。
- 群公告、群成员、入群审核、在线成员、群助手、群权限、群设置等业务管理能力。

## 当前风险

1. 群业务后端契约未打通。
   - 多个 `/room/openim/**` 接口能返回 HTTP 200，但业务体失败。
   - 主要原因是后端尚未兼容 OpenIM `groupID` 作为业务 `roomId`。

2. 写操作没有做真实验收。
   - 当前遵守“不触发 mutation”的限制。
   - 源码审计已确认主要写入口有二次确认，但尚未证明远端 mutation 成功。
   - 后续需要用户明确确认后，逐项用真实浏览器验收。

3. 管理员入口还缺账号角色覆盖。
   - 当前账号在部分群中仅普通成员，无法看到完整管理入口。

4. 部分接口需要业务侧 ID。
   - 例如 `/room/openim/join-requests/handle` 需要业务 `requestId`。
   - OpenIM SDK 的申请数据不一定稳定携带该 ID。

## 下一步建议

1. 后端优先处理 `roomId=OpenIM groupID` 的兼容或返回映射。
2. 提供一个群主或管理员账号，用于复测群管理入口。
3. 提供可操作的测试数据，例如待处理入群申请、真实群公告、真实业务文件消息。
4. 写操作按模块逐项验收，每次只确认一个操作范围，避免误触发送、删除、审核、清空等高风险动作。
