# Implement

## 当前计划

- [x] 创建新 Trellis 任务。
- [x] 重申并记录当前 Web 用户端接口接入目标。
- [x] 接入 `/user/logout` 到正常手动退出链路。
- [x] 复核并尝试接入 `/room/add`。
- [x] 接入 `/user/settings` 与 `/user/settings/update` 的 Web 端好友验证设置子集。
- [x] 接入 `/user/offlineOperation` 到登录/同步补偿刷新链路。
- [x] 接入 `/user/report` 到用户资料卡和群设置举报入口。
- [x] 接入 `/user/profile/metas` 与 `/user/profile/update` 到编辑资料弹窗。
- [x] 接入 `/user/getOnLine` 到用户资料卡在线状态展示。
- [x] 接入 `/friends/newFriend/list` 与 `/friends/newFriend/last` 到好友申请链路。
- [x] 接入 `/friends/blacklist` 到黑名单列表兼容读取。
- [x] 接入 `/user/update/OfflineNoPushMsg` 到账号设置全局消息提示。
- [x] 接入 `/room/member/setOfflineNoPushMsg` 到群免打扰/置顶兼容同步。
- [x] 接入 `/room/member/getMemberListByPage` 到群成员列表兼容读取，并封装 `/room/member/list`。
- [x] 接入旧群公告、旧群共享、旧群成员详情和旧群详情兼容接口。
- [x] 接入旧群助手和自动回复兼容接口。
- [x] 接入旧群发送前校验和旧清空消息起始时间接口。
- [x] 接入旧群列表和按 JID 查群详情兼容接口。
- [x] 接入群成员邀请人信息只读增强接口。
- [x] 接入旧群发言状态读取和切换兼容接口。
- [x] 接入好友手机号备注修改接口。
- [x] 接入旧隐身/监控成员设置兼容接口。
- [x] 接入用户资料只读兜底接口。
- [x] 接入旧用户收藏列表兼容读取接口。
- [x] 接入举报 URL 预检接口。
- [x] 修复 `src/api/report.ts` 旧实现残留导致的语法报错。
- [x] 修复 `src/api/report.ts` 条件 spread 返回对象导致的类型推断报错。
- [x] 接入旧密码 v1 接口兼容。
- [x] 接入用户绑定信息只读兜底接口。
- [x] 接入修改密码旧密码校验预检接口。
- [x] 接入 `/user/outtime` 到登录恢复后的业务登录态检查。
- [x] 通讯录列表、申请列表和黑名单改为按入口懒加载，避免登录初始化全量请求。
- [x] 完成本轮静态核对并记录浏览器复测阻塞原因。
- [x] 记录用户对测试接口真实调用和测试数据修改的进一步授权。
- [x] 尝试启动本地 Web 服务并记录 Node/npm 执行权限阻塞。
- [x] 继续复核旧任务中其它 Web 用户端未完成候选。
- [ ] 等待新的明确 Web 端 UI 需求或后端契约后继续接入剩余暂缓接口。

## 2026-06-25 需求目标重申

- [x] 明确本任务只继续推进 Web 用户端接口接入，不主动接入后台、支付、运营、直播、客服、运维桥接等非 Web 用户端接口。
- [x] 明确业务接口走 `businessApi = http://47.238.134.161:8092`；聊天消息收发、会话、连接等即时通信能力继续走 OpenIM SDK，对应 `openIMApiURL = http://47.238.134.161:10002` 和 `openIMWsURL = ws://47.238.134.161:10001`。
- [x] 明确 `DEFAULT_ENTERPRISE_CODE = "LOCALTEST001"` 必须保留，`invitationCode` 按非必填处理。
- [x] 明确当前为测试数据，允许真实调用接口、触发写操作、修改测试数据。
- [x] 明确不新增或修改单元测试，不跑单元测试；后续验证以浏览器复测和静态核对为主。
- [x] 详细记录见 `2026-06-25-goal-restatement.md`。

## 2026-06-25 `/user/logout` 接入

- [x] 新增 `logoutBusinessUser()`，按 Swagger 传 `deviceKey/devicekey/telephone`，其中 `telephone` 使用 MD5 手机号，`access_token` 由请求拦截器追加。
- [x] 手机号和区号优先从当前保存账号读取，本地登录手机号作为兜底，避免多账号切换后退出接口传错账号。
- [x] 正常手动退出先尝试调用 `/user/logout`，失败只写 `console.debug` 并继续 SDK logout + 本地清理。
- [x] 强制退出继续只做本地清理，不调用业务退出，避免 token 失效场景循环触发接口。
- [x] 本轮未运行单元测试、构建、覆盖检查或验证脚本；未打开浏览器点击退出。记录见 `2026-06-25-business-logout-integration.md`。

## 2026-06-25 `/room/add` 初始后置同步接入

- [x] 复核 Swagger，确认 `/room/add` 顶层必填项为 `room/text/keys`，其它 `room.*`、`member.*`、`notice.*` 属于旧系统展开字段。
- [x] 新增 `createBusinessGroup()`，按接口要求把 `room` 和成员 `text` 序列化为 query JSON 字符串，并传 `keys`。
- [x] 该版本先以 OpenIM SDK `createGroup` 为主链路，SDK 成功后尝试调用 `/room/add` 后置同步业务侧。
- [x] 后续已在 2026-06-26 调整为业务 `/room/add` 优先，失败才兜底 OpenIM SDK；历史记录见 `2026-06-25-business-room-add-sync.md`。

## 2026-06-25 `/user/settings` 与 `/user/settings/update` 接入

- [x] 复核 Swagger：`/user/settings/update` 字段很多，包含生活圈、地图、多点登录、关注、打招呼等非当前 Web IM 主线字段。
- [x] 按 KISS/YAGNI 只接入当前账号设置页已有自然入口的 `friendsVerify`，不全量铺开旧隐私字段。
- [x] 新增 `getUserPrivacySettings()` 和 `updateUserPrivacySettings()`。
- [x] 账号设置页新增“添加好友设置”，读取 `/user/settings`，并通过二次确认后调用 `/user/settings/update` 修改 `friendsVerify`。
- [x] 本轮未新增或修改单元测试，未运行单元测试；真实点击保存待浏览器复测。记录见 `2026-06-25-user-settings-integration.md`。

## 2026-06-25 静态核对

- [x] 检索确认新增接口封装、页面入口、i18n 和 Trellis 记录存在。
- [x] 检索确认未引入冲突标记。
- [x] 更新根目录 `WEB_API_INTEGRATION_INTERFACE_STATUS.md`，修正 `/user/logout`、`/room/add` 过时暂缓状态，并新增 `/user/settings` 子集状态。
- [x] 本轮未运行单元测试，未新增或修改单元测试。
- [x] 尝试启动本地 Vite 服务用于浏览器复测，但工作区外 Node 执行需要提权，审批器返回错误并拒绝；未继续绕过。记录见 `2026-06-25-static-verification.md`。

## 2026-06-25 `/user/offlineOperation` 接入

- [x] 复核 Swagger：接口语义为获取最新好友、群组相关操作记录。
- [x] 新增 `getOfflineOperations()` 和 `syncOfflineOperations()`。
- [x] 按当前账号保存上次查询时间，下次调用作为 `offlineTime`。
- [x] `syncOfflineOperations()` 做并发去重，避免初始化和 SDK 同步完成同时触发重复请求。
- [x] 在 `initStore()` 和 SDK 同步完成后调用业务离线操作同步。
- [x] 有操作记录时刷新好友、群和申请列表；失败只写 `console.debug`，不阻断 OpenIM SDK 同步。
- [x] 本轮未新增或修改单元测试，未运行单元测试；浏览器复测待 dev server 可用。记录见 `2026-06-25-offline-operation-sync.md`。

## 2026-06-25 `/user/report` 接入

- [x] 复核 Swagger：`/user/report` 支持举报用户或群组，参数为 `toUserId/roomId/webUrl/reason/reportType/reportInfo`。
- [x] 新增 `reportBusinessTarget()`，统一按 query 传参。
- [x] 用户资料卡新增“举报”按钮，非自己用户可提交用户举报。
- [x] 群设置新增“举报群组”入口，已加入群时可提交群举报。
- [x] 提交前要求输入举报原因并确认；缺目标用户或群时阻断调用。
- [x] 本轮未新增或修改单元测试，未运行单元测试；浏览器复测待 dev server 可用。记录见 `2026-06-25-user-report-integration.md`。

## 2026-06-25 `/user/profile/metas` 与 `/user/profile/update` 接入

- [x] 复核 Swagger：`/user/profile/metas` 为资料编辑元信息，`/user/profile/update` 为扩展资料更新。
- [x] 新增 `getUserProfileMetas()` 和 `updateUserProfile()`。
- [x] 编辑资料弹窗打开时读取扩展资料元信息。
- [x] 编辑资料表单新增“个人简介”，后端若返回扩展字段元信息则动态渲染输入项。
- [x] 保存时保留 `/user/update` 基础资料更新；随后尝试 `/user/profile/update` 同步扩展资料，失败只写 `console.debug`。
- [x] 本轮未新增或修改单元测试，未运行单元测试；浏览器复测待 dev server 可用。记录见 `2026-06-25-user-profile-extension.md`。

## 2026-06-25 `/user/getOnLine` 接入

- [x] 复核 Swagger：`/user/getOnLine` 用于按 `userId` 查询用户在线状态。
- [x] 新增 `getBusinessUserOnlineStatus()`，通过 `businessRequest` 调用 `/user/getOnLine`。
- [x] 用户资料卡打开时补充读取在线状态，自己和非自己用户都覆盖。
- [x] 在线状态读取失败不阻断资料卡展示，仅写 `console.debug`。
- [x] 用户资料卡新增“在线状态”展示，复用现有“在线/离线”文案。
- [x] 本轮未新增或修改单元测试，未运行单元测试；外部接口直连验证因审批器拒绝提权未完成，浏览器复测待本地服务可用。记录见 `2026-06-25-user-online-status.md`。

## 2026-06-25 好友申请兼容接口接入

- [x] 复核 Swagger：`/friends/newFriend/list` 为旧新朋友列表，`/friends/newFriend/last` 为与指定用户的最新好友申请记录。
- [x] 新增 `getLegacyNewFriendList()` 和 `getLatestNewFriendRecord()`。
- [x] 好友申请列表刷新时同时读取 `/friends/newFriendListWeb` 与 `/friends/newFriend/list`，并复用现有归一化和合并逻辑。
- [x] 发送好友验证页打开时读取 `/friends/newFriend/last`，能解析状态时展示最近申请状态。
- [x] 旧接口读取失败不阻断 SDK 申请列表和现有 Web 申请列表兜底。
- [x] 本轮未新增或修改单元测试，未运行单元测试；真实浏览器复测待自动化登录权限确认。记录见 `2026-06-25-new-friend-application-compat.md`。

## 2026-06-25 黑名单兼容接口接入

- [x] 复核 Swagger：`/friends/blacklist` 为旧黑名单分页列表，参数为 `pageIndex/pageSize`。
- [x] 新增 `getLegacyBusinessBlacklist()`。
- [x] 黑名单刷新时同时读取 `/friends/queryBlacklistWeb` 与 `/friends/blacklist`，并复用现有归一化和 `userID` 合并逻辑。
- [x] 旧接口读取失败不阻断 OpenIM SDK 黑名单和现有 Web 黑名单兜底。
- [x] 本轮未新增或修改单元测试，未运行单元测试；真实浏览器复测待自动化登录权限确认。记录见 `2026-06-25-blacklist-compat.md`。

## 2026-06-25 `/user/update/OfflineNoPushMsg` 接入

- [x] 复核 Swagger：`/user/update/OfflineNoPushMsg` 用于设置全局免打扰，参数为 `offlineNoPushMsg`。
- [x] 新增 `updateGlobalOfflineNoPushMsg()`。
- [x] `/user/settings` 读取结果补充解析 `offlineNoPushMsg`。
- [x] 账号设置“消息提示”区块新增“全局消息提示”总开关。
- [x] 开启总开关传 `offlineNoPushMsg=0`，关闭总开关传 `offlineNoPushMsg=1`。
- [x] 保留现有细分通知设置接口 `/user/notification/settings/update`，不互相替代。
- [x] 本轮未新增或修改单元测试，未运行单元测试；真实浏览器复测待自动化登录权限确认。记录见 `2026-06-25-global-offline-no-push.md`。

## 2026-06-25 `/room/member/setOfflineNoPushMsg` 接入

- [x] 复核 Swagger：旧接口同时承载群消息免打扰和群置顶，`type=0` 表示免打扰，`type=1` 表示置顶。
- [x] 新增 `setLegacyGroupMemberOfflineNoPush()`。
- [x] 群免打扰保存时同时调用 `/room/openim/member/set-offline-no-push` 与 `/room/member/setOfflineNoPushMsg(type=0)`。
- [x] 群置顶保存时同时调用 `/room/openim/member/set-top` 与 `/room/member/setOfflineNoPushMsg(type=1)`。
- [x] 两个业务接口至少一个成功即可继续 OpenIM SDK 会话状态更新，避免新旧后端契约差异阻断本地体验。
- [x] 本轮未新增或修改单元测试，未运行单元测试；真实浏览器复测待自动化登录权限确认。记录见 `2026-06-25-room-member-setting-compat.md`。

## 2026-06-25 群成员列表兼容接口接入

- [x] 复核 Swagger：`/room/member/getMemberListByPage` 为旧群成员分页列表，`/room/member/list` 为关键字查询。
- [x] 新增 `getLegacyGroupMembersByPage()` 和 `getLegacyGroupMembersByKeyword()`。
- [x] 群成员列表读取时同时请求 `/room/openim/members` 与 `/room/member/getMemberListByPage`。
- [x] 两个业务来源统一归一化为 `GroupMemberItem` 并按 `userID` 合并。
- [x] 业务来源无有效成员数据时继续保留 OpenIM SDK `getGroupMemberList()` 兜底。
- [x] `/room/member/list` 当前仅封装，等待成员搜索输入后再触发，避免空关键字查询语义不清。
- [x] 本轮未新增或修改单元测试，未运行单元测试；真实浏览器复测待自动化登录权限确认。记录见 `2026-06-25-room-member-list-compat.md`。

## 2026-06-25 旧群公告、群共享和群成员详情兼容接入

- [x] 新增 `/room/get` 旧群详情兜底，作为 `/room/openim/detail` 和 `/room/getRoom` 后的第三层群资料来源。
- [x] 新增 `/room/member/get` 封装，并在用户资料卡有群上下文时作为群成员资料增强读取。
- [x] 新增 `/room/noticesPage`、`/room/notice/list`、`/room/updateNotice`、`/room/notice/delete` 封装。
- [x] 群公告面板读取时合并 `/room/openim/notices` 与 `/room/noticesPage`，更新/删除时新旧接口至少一个成功即可继续刷新。
- [x] 新增 `/room/share/find`、`/room/share/get`、`/room/add/share`、`/room/share/delete` 封装。
- [x] 群共享文件列表合并 `/room/openim/shares` 与 `/room/share/find`，详情读取 `/room/share/get`，删除和发送后登记并联新旧接口。
- [x] 抽出 `mergeBusinessRecordsByKey()` 和 `settleAtLeastOneBusinessRequest()`，避免新旧接口兼容逻辑在页面内重复扩散。
- [x] 本轮未新增、未修改、未运行单元测试；`tsc --noEmit --pretty false` 因工作区外 Node/npm 提权审批器 404 拒绝，未继续绕过。记录见 `2026-06-25-legacy-room-notice-share-member-compat.md`。

## 2026-06-25 旧群助手与自动回复兼容接入

- [x] 新增 `/room/addGroupHelper`、`/room/deleteGroupHelper`、`/room/queryGroupHelper` 封装。
- [x] 新增 `/room/addAutoResponse`、`/room/updateAutoResponse`、`/room/deleteAutoResponse` 封装。
- [x] 添加/删除群助手时，新版 `/room/openim/group-helpers/**` 与旧版 `/room/*GroupHelper` 接口并联调用。
- [x] 新增/更新/删除群助手自动回复关键词时，新版 `/room/openim/group-helpers/keywords/**` 与旧版 `/room/*AutoResponse` 接口并联调用。
- [x] 写操作继续复用 `settleAtLeastOneBusinessRequest()`，至少一个接口成功即可刷新页面数据。
- [x] 本轮未新增、未修改、未运行单元测试；浏览器复测仍受本地 Node/npm 执行提权审批器拒绝和 `7777` 端口未启动影响。记录见 `2026-06-25-legacy-group-helper-auto-response-compat.md`。

## 2026-06-25 旧群发送前校验与清空消息兼容接入

- [x] 新增 `/room/sendMsgBefore` 封装，并入 `groupSendBefore()`。
- [x] 群消息发送前同时调用 `/room/openim/send-before` 与 `/room/sendMsgBefore`，至少一个成功才继续 OpenIM SDK 发送。
- [x] 新增 `/room/member/setBeginMsgTime` 封装。
- [x] 清空群聊天记录时同时调用 `/room/openim/member/clear-message` 与 `/room/member/setBeginMsgTime`，至少一个业务接口成功后再执行 SDK 本地清理。
- [x] 本轮未新增、未修改、未运行单元测试；浏览器复测仍受本地服务未启动影响。记录见 `2026-06-25-legacy-group-send-before-clear-message-compat.md`。

## 2026-06-25 旧群列表与按 JID 查群详情兼容接入

- [x] 新增 `/room/list`、`/room/list/his`、`/room/getRoomByJid` 封装。
- [x] `getBusinessGroupInfo()` 增加 `/room/getRoomByJid` 兜底，顺序为 `/room/openim/detail` -> `/room/getRoom` -> `/room/getRoomByJid` -> `/room/get`。
- [x] 群列表刷新时保留 OpenIM SDK `getJoinedGroupListPage()` 主链路，同时读取 `/room/list` 并按 `groupID` 合并。
- [x] `/room/list/his` 当前仅封装，不混入“我的群”，避免历史或退出群污染当前群列表。
- [x] 本轮未新增、未修改、未运行单元测试；浏览器复测仍受本地服务未启动影响。记录见 `2026-06-25-legacy-room-list-detail-compat.md`。

## 2026-06-25 群成员邀请人信息兼容接入

- [x] 新增 `/room/getMemberInviterInfo` 封装，按 Swagger 传 `jid/userId`。
- [x] 用户资料卡在有群上下文时读取群成员邀请人信息。
- [x] 成功解析邀请人昵称或 ID 后，在资料卡展示“邀请人”字段。
- [x] 读取失败只写 `console.debug`，不阻断资料卡展示。
- [x] 本轮未新增、未修改、未运行单元测试；浏览器复测仍受本地服务未启动影响。记录见 `2026-06-25-legacy-group-member-inviter-info.md`。

## 2026-06-25 运行验证尝试

- [x] 用户再次明确当前都是测试数据，允许真实调用接口和修改测试数据。
- [x] 静态确认 `.env`、`vite.proxy.ts`、`src/api/business.ts`、`src/layout/useGlobalEvents.tsx` 的业务接口和 OpenIM SDK 地址配置正确。
- [x] 确认 `7777` 端口当前未监听。
- [x] 尝试启动 `npm run dev:web`，但当前 Codex shell 无法执行工作区外 Node/npm；提权执行也被审批系统拒绝。
- [x] 后续确认 `7777` 已监听，`index.html`、Vite client、入口源码和 `/business-api/openim-swagger.html` 均返回 HTTP 200。
- [x] 当前 shell 不存在 `npx`，未能使用 Playwright CLI 做真实浏览器自动化复测。
- [x] 未绕过权限限制，未运行单元测试。记录见 `2026-06-25-runtime-startup-attempt.md`。

## 2026-06-25 旧群发言状态兼容接入

- [x] 复核 Swagger：`/room/getSendMsgStatus` 与 `/room/changeSendMsgStatus` 均只要求 `jid`。
- [x] 新增 `getLegacyGroupSendMsgStatus()` 与 `changeLegacyGroupSendMsgStatus()`。
- [x] 群设置页复用已有“全体禁言”开关读取旧状态，读取失败回退现有 `limitSendSmg` 字段。
- [x] `/room/changeSendMsgStatus` 按 toggle 处理，仅在旧状态已知且目标状态变化时调用，避免未知状态下误反转。
- [x] 本轮未新增、未修改、未运行单元测试；浏览器复测仍受本地服务未启动影响。记录见 `2026-06-25-legacy-group-send-message-status.md`。

## 2026-06-25 好友手机号备注接入

- [x] 复核 Swagger：`/friends/modify/phoneRemark` 必填 `toUserId`，`phoneRemark` 可选。
- [x] 新增 `updateFriendPhoneRemark()`。
- [x] 好友资料卡新增“手机号备注”独立可编辑字段。
- [x] 好友昵称备注继续走 `/friends/remark` 和 OpenIM SDK 更新；手机号备注单独走 `/friends/modify/phoneRemark`，避免语义混淆。
- [x] 新增中英文文案 `placeholder.phoneRemark` 和 `placeholder.confirmUpdateFriendPhoneRemark`。
- [x] 本轮未新增、未修改、未运行单元测试；真实浏览器编辑待后续登录后复测。记录见 `2026-06-25-friend-phone-remark.md`。

## 2026-06-25 旧隐身/监控成员接口兼容接入

- [x] 复核 Swagger：`/room/setInvisibleGuardian` 使用 `roomId/touserId/type`，其中 `4/5` 设置隐身/监控，`-1/0` 取消隐身/监控。
- [x] 新增 `setLegacyInvisibleGuardian()`。
- [x] 群设置“特殊成员”面板继续使用已有入口，设置隐身/监控成员时并联新版 `/room/openim/member/set-special-role` 与旧版 `/room/setInvisibleGuardian`。
- [x] 恢复普通成员时根据当前角色选择旧接口取消类型，当前角色不可判断时不调用旧取消接口，避免误操作。
- [x] 本轮未新增、未修改、未运行单元测试；真实浏览器设置特殊成员待管理员/群主账号和稳定 `roomId` 后复测。记录见 `2026-06-25-legacy-invisible-guardian.md`。

## 2026-06-25 用户资料只读兜底接口接入

- [x] 复核 Swagger：`/user/getUserInfo` 无参数，`/user/get/v1` 支持可选 `userId/roomId`。
- [x] 新增 `getCurrentBusinessUserInfo()` 和 `getBusinessUserInfoV1()`。
- [x] 自己资料卡读取 `/user/getUserInfo` 作为业务资料增强。
- [x] 他人资料卡读取 `/user/get/v1` 作为 `/user/get` 后的只读兜底，有群上下文时传 `roomId`。
- [x] 失败只写 `console.debug`，不阻断资料卡展示。
- [x] 本轮未新增、未修改、未运行单元测试；真实浏览器资料卡复测待登录后继续。记录见 `2026-06-25-user-profile-read-fallbacks.md`。

## 2026-06-25 旧用户收藏列表兼容接入

- [x] 复核 Swagger：`/user/collection/list` 必填 `userId`，可选 `pageIndex/pageSize/type`。
- [x] 新增 `getLegacyUserCollections()`。
- [x] 聊天资源面板“收藏消息”tab 并联读取 `/message/favorites` 与 `/user/collection/list`。
- [x] 两个来源按 `favoriteId/id` 合并；旧接口只作为列表兼容来源，不替代新版详情、编辑、删除。
- [x] 本轮未新增、未修改、未运行单元测试；真实收藏资源面板复测待登录后继续。记录见 `2026-06-25-legacy-user-collection-list.md`。

## 2026-06-25 举报 URL 预检接口接入

- [x] 复核 Swagger：`/user/checkReportUrl` 仅有可选 `webUrl` 参数。
- [x] 新增 `checkReportUrl()`。
- [x] `reportBusinessTarget()` 在提交 `/user/report` 前尝试调用 `/user/checkReportUrl`。
- [x] 预检失败只写 `console.debug`，不阻断用户举报和群举报主链路。
- [x] 修复 `src/api/report.ts` 中旧实现残留的重复 `params` 代码块，避免语法报错。
- [x] 本轮未新增、未修改、未运行单元测试；真实举报流程待登录后复测。记录见 `2026-06-25-report-url-check.md`。

## 2026-06-25 旧密码 v1 接口兼容接入

- [x] 复核 Swagger：`/user/password/reset/v1` 与 `/user/password/update/v1` 分别对应找回密码和修改密码旧契约。
- [x] 新增 `settleAtLeastOneAuthRequest()`。
- [x] 找回密码流程并联 `/user/password/reset` 与 `/user/password/reset/v1`。
- [x] 修改密码流程并联 `/user/password/update` 与 `/user/password/update/v1`。
- [x] 新旧接口至少一个成功即认为业务请求成功；未伪造前端没有的 RSA/DH 安全字段。
- [x] 本轮未新增、未修改、未运行单元测试；真实密码流程待浏览器复测。记录见 `2026-06-25-legacy-password-v1-compat.md`。

## 2026-06-25 用户绑定信息只读兜底接入

- [x] 复核 Swagger：`/user/getBindInfo` 无参数。
- [x] 新增 `getBusinessUserBindInfo()` 并从 `src/api/login.ts` 聚合导出。
- [x] 自己资料卡打开时读取 `/user/getBindInfo`，作为手机号、邮箱等绑定资料补充。
- [x] 读取失败只写 `console.debug`，不阻断资料卡展示。
- [x] 未接入绑定邮箱/手机号写接口，因为当前没有完整验证码/绑定 UI。
- [x] 本轮未新增、未修改、未运行单元测试；真实资料卡复测待登录后继续。记录见 `2026-06-25-user-bind-info-fallback.md`。

## 2026-06-25 修改密码旧密码校验预检接入

- [x] 复核 Swagger：`/user/verify/password` 必填 `password`。
- [x] 新增 `verifyBusinessPassword()`。
- [x] 修改密码流程在提交 `/user/password/update` 和 `/user/password/update/v1` 前尝试调用 `/user/verify/password`。
- [x] 复用页面传入的 MD5 旧密码，不重复 hash。
- [x] 预检失败只写 `console.debug`，不阻断后续修改密码主链路。
- [x] 本轮未新增、未修改、未运行单元测试；真实修改密码流程待浏览器复测。记录见 `2026-06-25-password-verify-precheck.md`。

## 2026-06-25 `/user/outtime` 登录态检查接入

- [x] 复核 Swagger：`/user/outtime` 要求 `access_token`，可选 `userId`。
- [x] 新增 `checkBusinessAccountOuttime()`，`access_token` 由 `businessRequest` 拦截器自动追加。
- [x] 在 OpenIM SDK 登录成功并执行 `initStore()` 后异步触发业务登录态检查。
- [x] 在 SDK `10102` 已登录分支同样触发业务登录态检查。
- [x] 检查失败只写 `console.debug`，不阻断 SDK 登录恢复和本地数据初始化。
- [x] 本轮未新增、未修改、未运行单元测试；本地页面入口 HTTP 200。记录见 `2026-06-25-account-outtime-check.md`。

## 2026-06-25 剩余接口候选复核

- [x] 基于 Swagger 与 `src/api/**` 做路径差异扫描，当前业务路径封装数为 `162`。
- [x] 复核剩余 `/user`、`/friends`、`/room` 候选，大部分属于后台/支付/红包/机器人/位置/推送/加密/绑定写入/旧登录注册/清理类。
- [x] 确认 `/room/update` 已覆盖群消息销毁设置字段，无需额外自动触发 `/user/destroyMsgRecord`。
- [x] 确认 `/room/openim/status/mapping/resync/failed` 属于旧系统同步状态/补偿接口，不作为 Web 用户端普通入口接入。
- [x] 详细记录见 `2026-06-25-remaining-api-candidate-audit.md`。

## 2026-06-26 创建群聊接口顺序修正

- [x] “创建群聊”多人建群主链路调整为优先调用业务 `/room/add`。
- [x] `/room/add` 失败时才兜底调用 OpenIM SDK `createGroup()`。
- [x] 业务响应成功后仅解析明确群标识字段：`groupID/groupId/openIMGroupID/openIMGroupId/openimGroupID/openimGroupId/roomJid/jid`。
- [x] 业务响应成功但没有明确群 ID 时，只刷新群列表并写 `console.debug`，不额外创建 SDK 群。
- [x] 记录见 `2026-06-26-create-group-business-first.md`。

## 2026-06-26 `/room/add` 表单契约修正

- [x] 真实验证发现 `/room/add` 使用 query 传 `access_token/room/text/keys` 会返回 `1030101 缺少访问令牌`。
- [x] 真实验证确认 `application/x-www-form-urlencoded` 表单体传 `access_token/room/text/keys` 返回 `resultCode=1`。
- [x] `createBusinessGroup()` 已改为表单体提交，并从当前业务 token 中写入 `access_token`。
- [x] 成功响应 `data` 内包含 `jid`，当前群 ID 解析逻辑可识别并跳转。
- [x] 本轮真实创建了 `codex-api-verify-*` 测试群，未运行单元测试。
- [x] 记录见 `2026-06-26-room-add-form-contract.md`。

## 2026-06-26 创建群聊误跳好友会话修复

- [x] 会话跳转本地查找增加 `conversationType === sessionType` 校验。
- [x] 群会话只按 `groupID` 匹配，单聊只按 `userID` 匹配，避免同 ID 误命中错误会话类型。
- [x] 移除业务建群成功后按同名群兜底跳转，避免重复群名导致误跳。
- [x] 记录见 `2026-06-26-create-group-chat-wrong-conversation-fix.md`。

## 2026-06-26 静态与运行态复核

- [x] 重新启动 Web dev server，`127.0.0.1:7777` 当前监听中。
- [x] `http://127.0.0.1:7777/index.html#/login` 返回 HTTP 200。
- [x] `http://127.0.0.1:7777/business-api/openim-swagger.html` 返回 HTTP 200。
- [x] 当前 `src/api/**` 唯一业务路径数为 `162`。
- [x] 未发现冲突标记。
- [x] 未新增、未修改、未运行单元测试。
- [x] 记录见 `2026-06-26-static-and-runtime-recheck.md`。

## 2026-06-26 `/user/outtime` 运行态验证

- [x] 通过本地 proxy 调用 `/business-api/account/login`，测试账号 `18888888888` 登录返回 `resultCode=1`。
- [x] 登录响应存在 `access_token`，用户编号为 `10000004`。
- [x] 使用该 token 调用 `/business-api/user/outtime?userId=10000004` 返回 `resultCode=1`。
- [x] 未打印完整 token，未运行单元测试。
- [x] 记录见 `2026-06-26-account-outtime-runtime-verify.md`。

## 2026-06-25 通讯录按需加载改造

- [x] 登录初始化不再全量预拉好友、群、好友申请、群申请、黑名单。
- [x] 我的好友页挂载时调用 `ensureFriendListLoaded()`。
- [x] 我的群组页挂载时调用 `ensureGroupListLoaded()`。
- [x] 新的好友页挂载时调用 `ensureFriendApplicationsLoaded()`。
- [x] 群通知页挂载时调用 `ensureGroupApplicationsLoaded()`。
- [x] 黑名单弹窗打开后再调用 `getBlackListByReq()`。
- [x] `src/store/contact.ts` 增加 loaded/loading 与 pending Promise 去重，避免重复点击造成并发重复请求。
- [x] `/friends/list` 解析补充 `friends` 列表键，并避免空业务字段覆盖 SDK 昵称或头像。
- [x] 记录见 `2026-06-25-contact-menu-lazy-loading.md`。
