# Web 端接口接入状态汇总

更新时间：2026-06-25

## 1. 范围说明

本文档是根目录主汇总文档，只统计 OpenIM Electron Demo 的 Web 用户端接口接入情况，范围来自当前源码、Trellis 记录、本地 Swagger JSON 和既有真实浏览器复测记录。

本次接入范围明确为 Web 用户端，不覆盖后台管理、开放平台、支付、红包、运维补偿、文件清理策略、直播、客服、活动奖励等非 Web IM 主线能力。

当前工作约束：

- 不新增、不修改单元测试。
- 不运行单元测试、构建、覆盖检查或验证脚本作为结论依据。
- 功能验收只使用真实浏览器复测。
- 当前为测试数据，用户已授权真实调用接口、触发写操作、修改测试数据；页面内高风险 mutation 仍保留二次确认，避免误触发。

## 2. 环境与配置基线

| 项目           | 当前值                        | 状态                              |
| -------------- | ----------------------------- | --------------------------------- |
| `businessApi`  | `http://47.238.134.161:8092`  | 已通过 `/business-api` proxy 转发 |
| `openIMApiURL` | `http://47.238.134.161:10002` | OpenIM SDK/API 使用               |
| `openIMWsURL`  | `ws://47.238.134.161:10001`   | OpenIM SDK WebSocket 使用         |
| 本地业务代理   | `/business-api`               | 已接入 Vite 相关配置              |
| 业务 token     | `access_token`                | 登录后随 businessApi 请求携带     |
| OpenIM token   | `openIM.token`                | 仅用于 OpenIM SDK 登录            |
| 固定企业号     | `LOCALTEST001`                | 登录、注册、验证码相关流程使用    |
| Swagger JSON   | `docs/openim-swagger.json`    | 已保存到本地                      |

本地 Swagger path 数量：844。

源码 `src/api/**` 中已经集中封装 162 个唯一业务路径，包含 Web 端目标接口、历史兼容接口和暂缓接口。本文只按 Web 用户端功能口径统计，不把 Swagger 全量后台、支付、红包、运维等接口计入 Web 用户端完成范围。

## 3. 总体状态

| 分类            | 状态                                       | 说明                                                                               |
| --------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| 基础链路        | 已接入，可用                               | `/business-api` 代理、业务 token、OpenIM token 分离、登录跳转已打通                |
| 登录/注册/账号  | 已接入，核心可用                           | 手机号密码登录已通过真实浏览器记录；注册已按 Swagger 调整，`invitationCode` 非必填 |
| 聊天收发基础    | SDK 为主，businessApi 做前置增强           | 实际消息收发仍走 OpenIM SDK；发送前校验、搜索、收藏、合并消息等走 businessApi      |
| 文件链路        | 已接入，部分只读可用                       | 文件资源、签名、预览、容量概览有可用记录；上传/下载/删除未主动触发验收             |
| 好友/通讯录     | SDK + businessApi 增强                     | SDK 提供基础列表，businessApi 补好友资料、搜索、新朋友、黑名单等                   |
| 群管理          | 大量入口已接入，但后端 roomId 契约阻塞明显 | 多个 `/room/openim/**` 请求 HTTP 可达，但业务体常返回 `1010101` 或“群ID不合法”     |
| mutation 写操作 | 已接入，按测试数据授权逐步复测             | 删除、保存、审核、上传、下载、清空、转让、解散等页面内仍保留二次确认               |
| 通讯录加载      | 已改为按入口加载                           | 避免登录初始化全量请求好友、群、申请、黑名单；各页面首次进入时按需拉取             |
| 非本期接口      | 不接或暂缓                                 | 后台、支付、红包、运维、开放平台、好友分组、机器人等不属于本次 Web 用户端接入      |

运行态补充：

- 本地 `127.0.0.1:7777` 当前已监听。
- `index.html`、Vite client、入口源码均返回 HTTP 200。
- `/business-api/openim-swagger.html` 返回 HTTP 200，确认本地业务代理可转发到 `8092`。
- 当前 Codex shell 没有 `npx`，未使用 Playwright CLI 做真实浏览器自动化复测。

## 4. 已接入且已有可用记录

### 4.1 基础链路

| 能力                                | 状态                   |
| ----------------------------------- | ---------------------- |
| `/business-api` 代理                | 可用                   |
| businessApi 自动携带 `access_token` | 可用                   |
| OpenIM token 与业务 token 分离      | 可用                   |
| 登录后进入 `#/chat`                 | 已有真实浏览器可用记录 |
| OpenIM SDK 会话、好友、群基础同步   | 已有真实浏览器可用记录 |

### 4.2 登录与账号

| 接口                        | 用途                    | 当前状态                                         |
| --------------------------- | ----------------------- | ------------------------------------------------ |
| `/enterprise/code/validate` | 企业号验证              | 已接入，曾有 HTTP 200 记录；后端曾偶发 500       |
| `/account/login`            | 手机号密码登录          | 已接入，`18888888888 / czp0422+` 曾登录成功      |
| `/user/openim/token`        | 获取或刷新 OpenIM token | 已接入；后端曾偶发 500                           |
| `/account/register`         | 注册                    | 已按 Swagger 对齐，`invitationCode` 已改为非必填 |
| `/account/code/send`        | 发送验证码              | 已按 query 参数对齐                              |
| `/account/code/verify`      | 校验验证码              | 已按 query 参数对齐                              |
| `/user/password/reset`      | 找回密码                | 已按 Swagger 路径对齐                            |
| `/user/password/reset/v1`   | 找回密码旧契约兼容      | 已并联 `/user/password/reset`，至少一个成功即可   |
| `/user/password/update`     | 修改密码                | 已封装并挂到账户设置入口                         |
| `/user/password/update/v1`  | 修改密码旧契约兼容      | 已并联 `/user/password/update`，至少一个成功即可  |
| `/user/verify/password`     | 修改密码旧密码校验预检  | 已接入修改密码流程，预检失败不阻断主链路          |
| `/user/logout`              | 业务退出                | 已接入正常手动退出链路，失败不阻断 SDK logout 和本地清理 |
| `/user/outtime`             | 登录态/离线状态检查     | 已接入登录恢复后异步检查；本地 proxy 真实调用返回 `resultCode=1` |

实现口径：

- 登录业务鉴权取 `access_token`。
- OpenIM SDK 登录只取 `openIM.token`。
- 企业号固定为 `LOCALTEST001`。
- 注册流程收敛为手机号、固定企业号、昵称、密码、确认密码。

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
| `/friends/newFriend/list`    | 已接入好友申请列表兼容读取，和 `/friends/newFriendListWeb` 合并 |
| `/friends/newFriend/last`    | 已接入发送好友验证页，展示最近申请状态 |
| `/friends/queryBlacklistWeb` | 黑名单列表可读，当前账号多为空态 |
| `/friends/blacklist`         | 已接入黑名单列表兼容读取，和 `/friends/queryBlacklistWeb` 合并 |
| `/user/get`                  | 用户资料可读                     |
| `/user/getUserInfo`          | 已接入自己资料卡业务资料只读增强 |
| `/user/get/v1`               | 已接入他人资料卡只读兜底，有群上下文时传 `roomId` |
| `/user/getBindInfo`          | 已接入自己资料卡绑定信息只读兜底 |
| `/user/avatar/get`           | 头像增强可读                     |
| `/user/getOnLine`            | 已接入用户资料卡在线状态展示，待浏览器确认真实响应结构 |
| `/user/profile/metas`        | 已接入编辑资料弹窗，作为扩展字段元信息读取 |
| `/user/profile/update`       | 已接入编辑资料保存后的扩展资料同步，失败不阻断基础资料保存 |
| `/user/report`               | 已接入用户卡片和群设置举报入口，提交前输入原因并确认 |
| `/user/checkReportUrl`       | 已接入举报提交前 URL 预检，失败不阻断 `/user/report` |
| `/friends/page`              | 好友搜索增强已封装               |
| `/user/public/search/list`   | 公开用户搜索已封装               |
| `/user/getByAccount`         | 通讯号查询已封装                 |
| `/user/offlineOperation`     | 已接入登录/同步补偿刷新链路      |
| `/room/list`                 | 已接入群列表兼容读取，和 SDK 群列表按 `groupID` 合并 |
| `/room/list/his`             | 已封装历史群列表，当前不混入“我的群” |
| `/room/getRoomByJid`         | 已接入群详情兜底读取             |

当前策略：

- OpenIM SDK 是通讯录基础数据源。
- businessApi 是资料增强、搜索、新朋友、黑名单补充数据源。
- `/user/offlineOperation` 用于登录后和 SDK 同步完成后的业务侧补偿刷新，失败不阻断 SDK 同步。
- businessApi 只读失败时保留 SDK 兜底结果，不阻断页面。
- 通讯录列表类接口按入口懒加载：进入“我的好友/我的群组/新的好友/群通知”时才请求对应数据，黑名单弹窗打开时才请求黑名单。
- 同类加载通过 store 的 pending Promise 去重，避免快速切换或重复挂载造成并发重复请求。

### 4.5 通知设置

| 接口                                   | 当前状态                 |
| -------------------------------------- | ------------------------ |
| `/user/notification/settings`          | 读取可用                 |
| `/user/notification/settings/defaults` | 默认设置已接入           |
| `/user/notification/settings/update`   | 已接入，写操作未真实触发 |
| `/user/update/OfflineNoPushMsg`        | 已接入账号设置“全局消息提示”总开关，待浏览器确认 |

### 4.6 用户隐私设置

| 接口                    | 当前状态 |
| ----------------------- | -------- |
| `/user/settings`        | 已接入账号设置页，当前只读取 Web 端已有入口需要的 `friendsVerify` |
| `/user/settings/update` | 已接入账号设置页“添加好友设置”，通过二次确认修改 `friendsVerify` |

当前策略：

- 只接入现有 Web 用户端账号设置中有明确入口的好友验证设置。
- 生活圈屏蔽、地图、多点登录、客服模式、关注、打招呼等字段仍不纳入当前 Web IM 主线。

### 4.7 聊天搜索、收藏、合并消息、文件资源只读

| 接口                             | 当前状态                                      |
| -------------------------------- | --------------------------------------------- |
| `/friend/openim/messages/search` | 单聊搜索已有 HTTP 200 和结果展示记录          |
| `/room/openim/messages/search`   | 群聊搜索已接入，受群 `roomId` 契约影响        |
| `/message/favorites`             | 收藏列表可读                                  |
| `/user/collection/list`          | 已接入收藏消息列表兼容读取，和 `/message/favorites` 合并 |
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

### 4.8 文件基础能力

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

- 图片、视频、普通文件发送入口已接入业务文件链路。
- 实际消息发送仍由 OpenIM SDK 完成。
- 上传、下载、删除、引用失效属于副作用操作，当前未主动触发。

## 5. 已接入但后端业务体暂不可用

这些接口前端入口、代理和请求路径已接通，真实浏览器中可以发出请求。当前主要问题是后端尚未兼容 `roomId=OpenIM groupID`，或需要返回稳定业务 `roomId` 映射。

| 接口                               | 当前现象                                      | 前端策略                   |
| ---------------------------------- | --------------------------------------------- | -------------------------- |
| `/room/openim/detail`              | HTTP 可达，业务体参数校验失败                 | SDK/本地数据、`/room/getRoom`、`/room/getRoomByJid`、`/room/get` 兜底 |
| `/room/openim/members`             | HTTP 可达，业务体参数校验失败                 | 已增加旧接口兼容读取，仍保留 SDK 成员列表兜底 |
| `/room/member/getMemberListByPage` | 已接入群成员列表兼容读取，待真实响应确认       | 与 `/room/openim/members` 合并后再兜底 SDK |
| `/room/member/list`                | 已封装群成员关键字查询，当前无搜索入口未主动触发 | 待成员搜索 UI 后接入调用 |
| `/room/member/get`                 | 已封装并接入用户资料卡群成员资料增强，待真实响应确认 | 失败不阻断资料卡展示 |
| `/room/getMemberInviterInfo`       | 已封装并接入用户资料卡邀请人信息增强，待真实响应确认 | 失败不阻断资料卡展示 |
| `/room/openim/notices`             | HTTP 200 后业务体失败                         | 已增加 `/room/noticesPage` 兼容读取 |
| `/room/noticesPage`                | 已接入旧群公告分页读取，待真实响应确认         | 与 `/room/openim/notices` 合并 |
| `/room/notice/list`                | 已封装旧群公告关键字查询，当前无搜索入口未主动触发 | 待公告搜索 UI 后接入调用 |
| `/room/openim/online-members`      | HTTP 200 后返回 `1010101`                     | 展示空态                   |
| `/room/openim/join-requests`       | 不传 `status` 曾 HTTP 500，已默认 `status=-1` | 保留入口，等待后端契约修正 |
| `/room/openim/shares`              | HTTP 可达，业务体可能失败                     | 已增加 `/room/share/find` 兼容读取 |
| `/room/share/find`                 | 已接入旧群共享文件列表读取，待真实响应确认     | 与 `/room/openim/shares` 合并 |
| `/room/share/get`                  | 已接入旧群共享文件详情读取，待真实响应确认     | 群共享详情按钮使用 |
| `/file/storage/room-overview`      | HTTP 200 后“群ID不合法”                       | 展示空详情                 |
| `/room/openim/message/read-detail` | HTTP 200 后返回 `1010101`                     | 展示空态                   |

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
| `/friends/modify/phoneRemark`      | 修改好友手机号备注 | 已接入好友资料卡独立字段，未真实提交     |
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
| `/room/sendMsgBefore`           | 群聊发送前旧校验   | 已接入，和 `/room/openim/send-before` 并联 |
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
| `/room/add`                                  | 创建群聊                | 已作为 Web 建群主链路；真实验证需表单体提交，返回 `resultCode=1` 且 `data.jid` 可用于跳转 |
| `/room/openim/notice/update`                 | 更新群公告              | 已接入，已补 `roomId/noticeId/noticeContent` 防护，未真实保存                |
| `/room/updateNotice`                         | 更新群公告旧接口        | 已接入群公告保存兼容链路，和 `/room/openim/notice/update` 并联，未真实保存    |
| `/room/openim/notice/delete`                 | 删除群公告              | 已接入，已补 `roomId/noticeId` 防护，未真实删除                              |
| `/room/notice/delete`                        | 删除群公告旧接口        | 已接入群公告删除兼容链路，和 `/room/openim/notice/delete` 并联，未真实删除    |
| `/room/openim/join-requests/handle`          | 同意/拒绝入群申请       | 已接入，缺真实 `requestId` 验收                                              |
| `/room/openim/member/set-special-role`       | 设置隐身/监控等特殊成员 | 已接入，未真实执行                                                           |
| `/room/setInvisibleGuardian`                 | 设置/取消旧隐身和监控成员 | 已接入特殊成员面板兼容链路，和新版特殊角色接口并联，未真实执行              |
| `/room/openim/member/remark/update`          | 更新群成员备注          | 已接入，未真实保存                                                           |
| `/room/openim/member/remark/delete`          | 删除群成员备注          | 已接入，未真实删除                                                           |
| `/room/openim/member/mute`                   | 禁言成员                | 已接入，未真实执行                                                           |
| `/room/openim/member/unmute`                 | 解除禁言                | 已接入，未真实执行                                                           |
| `/room/openim/member/set-offline-no-push`    | 群免打扰                | 已接入，已补 `roomId` 防护，未真实保存                                       |
| `/room/openim/member/set-top`                | 群置顶                  | 已接入，已补 `roomId` 防护，未真实保存                                       |
| `/room/member/setOfflineNoPushMsg`           | 群免打扰/置顶旧接口同步 | 已接入群免打扰和群置顶保存链路，`type=0/1` 区分能力，未真实保存             |
| `/room/openim/member/clear-message`          | 清空群消息游标          | 已接入，已补 `roomId` 防护，未真实确认执行                                   |
| `/room/member/setBeginMsgTime`               | 设置群成员消息起始时间旧接口 | 已接入清空群聊天记录兼容链路，未真实确认执行                             |
| `/room/getSendMsgStatus`                     | 查询旧群发言状态        | 已接入群设置“全体禁言”开关读取，待浏览器确认真实响应结构                    |
| `/room/changeSendMsgStatus`                  | 切换旧群发言状态        | 已接入群设置“全体禁言”兼容同步，旧状态已知且发生变化时才调用，未真实执行   |
| `/room/openim/group-helpers/add`             | 添加群助手              | 已接入，已补 `roomId/helperId` 防护，未真实执行                              |
| `/room/openim/group-helpers/delete`          | 删除群助手              | 已接入，已补 `roomId/groupHelperId` 防护，未真实执行                         |
| `/room/openim/group-helpers/keywords/add`    | 添加关键词              | 已接入，已补 `roomId/groupHelperId/keyword/value` 防护，未真实执行           |
| `/room/openim/group-helpers/keywords/update` | 更新关键词              | 已接入，已补 `roomId/groupHelperId/keyWordId/keyword/value` 防护，未真实执行 |
| `/room/openim/group-helpers/keywords/delete` | 删除关键词              | 已接入，已补 `roomId/groupHelperId/keyWordId` 防护，未真实执行               |
| `/room/openim/qr/create`                     | 生成群二维码            | 已接入，已补 `roomId` 防护，未真实生成                                       |
| `/room/openim/qr/resolve`                    | 解析群二维码            | 已接入，已有 `code` 防护，未真实解析                                         |
| `/room/openim/qr/join`                       | 二维码入群              | 已接入，已有 `code` 防护，未真实入群                                         |
| `/room/add/share`                            | 群共享文件新增旧接口    | 已接入文件/视频发送成功后的共享登记兼容链路，未真实上传发送验收              |
| `/room/share/delete`                         | 群共享文件删除旧接口    | 已接入群共享文件删除兼容链路，未真实删除                                     |
| `/room/addGroupHelper`                       | 添加群助手旧接口        | 已接入群助手添加兼容链路，和 `/room/openim/group-helpers/add` 并联，未真实执行 |
| `/room/deleteGroupHelper`                    | 删除群助手旧接口        | 已接入群助手删除兼容链路，和 `/room/openim/group-helpers/delete` 并联，未真实执行 |
| `/room/queryGroupHelper`                     | 查询群助手旧接口        | 已封装，当前群助手列表仍以新版列表为主，待需要详情查询时复用                 |
| `/room/addAutoResponse`                      | 新增自动回复旧接口      | 已接入群助手关键词新增兼容链路，未真实执行                                   |
| `/room/updateAutoResponse`                   | 更新自动回复旧接口      | 已接入群助手关键词更新兼容链路，未真实执行                                   |
| `/room/deleteAutoResponse`                   | 删除自动回复旧接口      | 已接入群助手关键词删除兼容链路，未真实执行                                   |

## 7. 当前已补的源码防护

| 模块                              | 已补内容                                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 聊天资源                          | `favoriteId/mergeId/fileId/shareId` 缺失时不暴露不可执行操作                                                                                   |
| 群成员管理                        | 成员备注、禁言、解禁、管理员变更等补目标成员 ID 防护                                                                                           |
| 群二维码                          | 生成需 `roomId`，解析/入群需 `code`                                                                                                            |
| 群助手                            | 增删助手、关键词增删改统一补 `roomId` 和相关 ID 防护；群助手和自动回复关键词写操作已并联新旧接口                                                |
| 群公告/入群审核/在线成员/特殊成员 | 列表入口缺 `roomId` 时空态，不发无效请求；公告保存/删除补必填防护；群公告新旧列表按 `noticeId/id` 合并                                          |
| 群设置保存/退出/解散              | 缺 `roomId` 时不更新本地状态、不进入确认链路                                                                                                   |
| 群邀请/踢人/转让                  | 统一 trim `groupID/roomId/userID`，缺上下文时不打开无效选择弹窗                                                                                |
| 群免打扰/置顶/清空消息            | businessApi 成功后才继续同步 SDK 或本地状态；清空消息已并联 `/room/openim/member/clear-message` 与 `/room/member/setBeginMsgTime`               |
| 好友/单聊操作                     | 单聊设置、拉黑、删除好友、发好友申请、新朋友处理统一补目标用户 ID 防护                                                                         |
| 群通知处理                        | 同意/拒绝前校验 `groupID/userID`，缺 ID 时不调用 businessApi 或 OpenIM SDK                                                                     |
| 群共享文件登记                    | `/room/openim/share/add` 与 `/room/add/share` 前校验 `roomId/url/name/size`，缺必填参数时跳过异步登记；列表按 `shareId/id` 合并                |
| 发送/上传/加群入口                | 发送前校验、上传上下文、群资料卡加群统一 trim `recvID/groupID/roomId`                                                                          |
| 业务 roomId 提取                  | `pickBusinessRoomId`、`pickExplicitBusinessRoomId` 增强 roomId/groupId 别名、ID trim 和嵌套 mapping 读取；空白 `auditId/requestId/id` 不再透传 |
| 登录/请求错误文案                 | `errorHandle` 和 `feedbackToast` 支持从 AxiosError `response.data` 提取 `resultMsg/errMsg/message`，用于登录限制、验证码、注册、资料保存等错误提示 |
| 通讯录按需加载                    | `ensureFriendListLoaded/ensureGroupListLoaded/ensureFriendApplicationsLoaded/ensureGroupApplicationsLoaded` 按入口触发，SDK 与业务源独立容错 |

仍需注意：

- `src/pages/contact/groupNotifications/index.tsx` 中群通知同意/拒绝保留了 SDK 兼容路径。业务审核缺 `requestId` 时跳过 businessApi，但仍走 OpenIM SDK 兼容处理；本轮已补 `groupID/userID` 基础防护，完整业务审核仍需真实 `requestId` 数据验收。

## 8. SDK 与 businessApi 分工

### 8.1 OpenIM SDK/API 负责

- 会话列表。
- 好友和群基础同步。
- 单聊、群聊消息实际收发。
- 历史消息基础拉取。
- WebSocket 长连接。
- 本地会话、消息、草稿等 SDK 状态。
- 创建群聊优先走 businessApi `/room/add`，失败才兜底 OpenIM SDK `createGroup()`。

### 8.2 businessApi 负责

- 企业号校验、登录、注册、验证码、找回密码、修改密码。
- 系统公告、公告已读。
- 好友资料增强、新朋友、黑名单、好友关系变更。
- 发送前业务校验。
- 聊天记录搜索、收藏、合并消息、撤回增强。
- 文件上传、签名、预览、下载、资源列表、引用关系、容量概览。
- 群公告、群成员、入群审核、在线成员、已读详情、群助手、群权限、群设置等业务管理能力。
- 创建群聊主链路。

## 9. 已接入但还没确认的功能点

| 功能点                              | 当前原因                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------ |
| 管理员或群主账号下的完整群管理流程  | 需要稳定管理员账号和后端 `roomId` 契约修正                               |
| 入群审核同意/拒绝                   | 需要真实业务 `requestId`，且属于 mutation                                |
| 特殊成员设置、管理员设置、禁言/解禁 | 需要真实目标成员与用户确认后触发                                         |
| 群助手添加、删除、关键词增删改      | 已有防护，未触发真实请求                                                 |
| 群二维码生成、解析、扫码入群        | 已有防护，未触发真实请求                                                 |
| 群公告编辑和删除                    | 已有防护，未触发真实请求                                                 |
| 群设置保存、消息销毁设置保存        | 已有 `roomId` 防护，未触发真实请求                                       |
| 文件真实上传、下载、删除、引用失效  | 属于副作用操作，未主动触发                                               |
| 图片/视频业务预览完整链路           | 需要带真实业务 `fileId` 的消息数据                                       |
| 群消息发送、撤回、收藏、转发、删除  | 发送走 SDK，业务增强未做真实 mutation 验收                               |
| 群共享文件新增登记                  | 已补 `roomId/url/name/size` 防护，真实文件/视频发送属于 mutation，未触发 |
| 发送、上传、加群真实链路            | 已补 ID 归一化，真实发送/上传/申请仍需用户确认后浏览器验收               |

## 10. 未实现或本期不接

### 10.1 不属于本次 Web 用户端范围

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
| `/room/location/**`                                                                             | 实时位置共享域，当前 UI 未覆盖      |
| `/user/*Push/*`、`/user/apns/*`、`/user/fcmPush/*`、`/user/hwpush/*`、`/user/jPush/*`           | 厂商推送 token，不属于 Web 端主线   |
| `/user/login*`、`/user/register*`、`/user/registerSDK*`                                         | 旧登录/注册/SDK 登录，新链路已使用 `/account/**` |
| `/user/bindingEmail`、`/user/bindingTelephone*`、`/user/profile/email/bind`、`/user/profile/phone/bind` | 绑定写接口需要验证码/绑定确认 UI，本期只做只读兜底 |

### 10.2 暂缓接入

| 接口                  | 暂缓原因                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `/user/rtc/get_token` | 源码仍有旧 RTC 封装，但音视频不属于本期 Web 用户端主线                                                   |
| `/friends/modify/encryptType`、`/room/updateEncryptType`、`/room/*RsaPublicKey`、`/room/*GroupChatKey` | 加密/RSA/群密钥能力需要完整安全契约和 UI |
| `/room/copyRoom`、`/room/openim/copy-room` | 当前没有 Web 群复制入口，不为了接口新增无需求入口 |
| `/user/destroyMsgRecord` | 销毁过期聊天记录属于删除数据清理动作，不在登录或页面打开时自动触发 |
| `/user/changeMsgNum` | 语义不清，当前 Web 端没有对应自然入口 |

## 11. 当前主要风险

1. 群业务 `roomId` 契约未打通。
   多个 `/room/openim/**` 接口 HTTP 层可达，但业务体失败。前端当前传 OpenIM `groupID`，后端需要兼容或提供业务 `roomId` 映射。

2. 写操作仍需分模块真实验收。
   当前测试数据已允许真实调用和改数据，但发送、上传、下载、删除、审核、群设置保存、转让、解散、清空等动作仍应逐项复测，页面内高风险入口继续保留二次确认。

3. 入群审核接口和 Swagger 存在运行时差异。
   Swagger 中 `status` 可选，但后端不传时曾返回 HTTP 500。前端已统一默认 `status=-1`。

4. 部分接口依赖真实业务 ID。
   入群审核需要 `requestId`，特殊成员需要 `userId`，聊天资源操作需要 `favoriteId/mergeId/fileId/shareId`，群二维码需要 `roomId/code`。

5. 外部服务偶发不稳定。
   业务后端曾出现 HTTP 500，OpenIM WS `ws://47.238.134.161:10001` 曾偶发握手失败。

## 12. 下一步建议

1. 后端优先兼容 `roomId=OpenIM groupID`，或在群详情、成员接口返回稳定业务 `roomId` 映射。
2. 后端确认 `/room/openim/join-requests` 的 `status` 是否应改为必填，或修复不传 `status` 的 HTTP 500。
3. 后端提供稳定群主/管理员账号、待处理入群申请、真实业务 `requestId`、真实文件消息数据。
4. mutation 按模块单独确认后再测，每次只验证一个操作范围，避免误触发删除、审核、清空、转让、解散等高风险动作。
5. 对 `src/pages/contact/groupNotifications/index.tsx` 的 SDK 兼容处理补 `groupID/userID` 基础防护，业务 `requestId` 缺失时继续保留 SDK 兼容路径，直到后端提供稳定业务申请数据。
