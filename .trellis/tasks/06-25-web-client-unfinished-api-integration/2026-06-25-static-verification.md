# 2026-06-25 静态核对记录

## 已核对

- `src/api/userSettings.ts` 已新增 `/user/settings`、`/user/settings/update` 封装。
- `src/layout/LeftNavBar/PersonalSettings.tsx` 已在账号设置页新增“添加好友设置”区块。
- 中英文 i18n 已新增 `confirmUpdateUserPrivacySetting`。
- `src/api/offlineOperation.ts` 已新增 `/user/offlineOperation` 封装。
- `src/layout/useGlobalEvents.tsx` 已在 SDK 同步完成后调用 `syncOfflineOperations()`。
- `src/utils/imCommon.ts` 已在初始化链路调用 `syncOfflineOperations()`。
- `src/api/report.ts` 已新增 `/user/report` 封装。
- `src/pages/common/UserCardModal/index.tsx` 已新增用户举报入口。
- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx` 已新增群举报入口。
- `src/api/profile.ts` 已新增 `/user/profile/metas`、`/user/profile/update` 封装。
- `src/pages/common/UserCardModal/EditSelfInfo.tsx` 已在编辑资料弹窗接入扩展资料元信息读取和保存后扩展资料同步。
- `src/api/friend.ts` 已新增 `/user/getOnLine` 封装。
- `src/pages/common/UserCardModal/index.tsx` 已在用户资料卡接入在线状态读取和展示。
- 中英文 i18n 已新增 `onlineStatus`，并复用已有 `online/offLine`。
- `src/api/friend.ts` 已新增 `/friends/newFriend/list`、`/friends/newFriend/last` 封装。
- `src/store/contact.ts` 已在好友申请列表刷新时合并读取 `/friends/newFriendListWeb` 和 `/friends/newFriend/list`。
- `src/pages/common/UserCardModal/SendRequest.tsx` 已在发送好友验证页接入 `/friends/newFriend/last`。
- 中英文 i18n 已新增 `application.latestStatus`。
- `src/api/friend.ts` 已新增 `/friends/blacklist` 封装。
- `src/store/contact.ts` 已在黑名单刷新时合并读取 `/friends/queryBlacklistWeb` 和 `/friends/blacklist`。
- `src/api/userSettings.ts` 已新增 `/user/update/OfflineNoPushMsg` 封装。
- `src/layout/LeftNavBar/PersonalSettings.tsx` 已在“消息提示”区块新增“全局消息提示”总开关。
- 中英文 i18n 已新增 `placeholder.globalMessageAlert`。
- `src/api/group.ts` 已新增 `/room/member/setOfflineNoPushMsg` 封装。
- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx` 已在群免打扰和群置顶保存链路中同步调用旧接口。
- `src/api/group.ts` 已新增 `/room/member/getMemberListByPage`、`/room/member/list` 封装。
- `src/hooks/useGroupMembers.ts` 已在群成员列表读取时合并 `/room/openim/members` 与 `/room/member/getMemberListByPage`。
- `run/start-vite-web.mjs` 已新增为本地 Web 启动入口，用于绕过当前环境下 Vite TS 配置加载受限的问题。
- `run/vite.web.local.config.mjs` 已新增为等价 Web Vite 配置，保留 `/business-api` 代理。
- 根目录 `WEB_API_INTEGRATION_INTERFACE_STATUS.md` 已更新：
  - `/user/logout` 从暂缓改为已接入。
  - `/room/add` 从暂缓改为已接入 SDK 建群后的业务侧同步。
  - `/user/settings`、`/user/settings/update` 记录为已接入 Web 端好友验证设置子集。
  - `/user/offlineOperation` 记录为已接入登录/同步补偿刷新链路。
  - `/user/report` 记录为已接入用户卡片和群设置举报入口。
  - `/user/profile/metas`、`/user/profile/update` 记录为已接入编辑资料弹窗。
  - `/user/getOnLine` 记录为已接入用户资料卡在线状态展示，待浏览器确认真实响应结构。
  - `/friends/newFriend/list`、`/friends/newFriend/last` 记录为已接入好友申请链路。
  - `/friends/blacklist` 记录为已接入黑名单兼容读取。
  - `/user/update/OfflineNoPushMsg` 记录为已接入账号设置全局消息提示。
  - `/room/member/setOfflineNoPushMsg` 记录为已接入群免打扰/置顶兼容同步。
  - `/room/member/getMemberListByPage` 记录为已接入群成员列表兼容读取。
  - `/room/member/list` 记录为已封装群成员关键字查询，待成员搜索入口后触发。
- 未发现冲突标记。

## 未完成验证

- 未运行单元测试。
- 未新增或修改单元测试。
- 未完成浏览器复测。
- 自动化浏览器登录和真实接口复测需要在脚本中输入测试账号密码并调用测试业务接口，当前审批器拒绝该类命令；待用户明确确认后继续。

## 浏览器复测阻塞原因

当前 7777 端口没有监听服务。尝试启动本地 Vite 服务时，PowerShell 环境存在 `Path/PATH` 重复导致 `Start-Process` 和环境变量枚举失败；改用工作区外 Node 启动时，沙箱限制需要提权，但审批器返回错误并拒绝提权请求。

按权限规则，本轮未继续绕过该限制启动服务。后续需要用户侧已有服务运行，或重新允许执行本机 Node 后，再打开浏览器复测账号设置页：

- 登录测试账号。
- 观察登录或 SDK 同步完成后是否发起 `/business-api/user/offlineOperation`。
- 打开账号设置。
- 确认“添加好友设置”区块显示。
- 点击“禁止添加我为好友”开关。
- 确认二次弹窗。
- 观察 `/business-api/user/settings/update` 是否按预期发送 `friendsVerify`。
- 打开用户资料卡，输入举报原因后提交，观察 `/business-api/user/report` 是否传 `toUserId/reportType=1/reason/webUrl`。
- 打开群设置，输入举报原因后提交，观察 `/business-api/user/report` 是否传 `roomId/reportType=2/reason/webUrl`。
- 打开编辑资料，观察 `/business-api/user/profile/metas` 是否发起。
- 保存编辑资料，观察 `/business-api/user/profile/update` 是否在基础资料保存后发起。
- 打开自己或好友用户资料卡，观察 `/business-api/user/getOnLine` 是否发起，并确认在线状态字段展示是否符合后端返回。
- 打开添加好友验证页，观察 `/business-api/friends/newFriend/last` 是否发起，并确认最近申请状态展示是否符合后端返回。
- 打开新朋友列表，观察 `/business-api/friends/newFriend/list` 是否与现有 `/business-api/friends/newFriendListWeb` 一同发起。
- 打开账号设置中的黑名单页面，观察 `/business-api/friends/blacklist` 是否与现有 `/business-api/friends/queryBlacklistWeb` 一同发起。
- 打开账号设置中的消息提示区块，切换“全局消息提示”，观察 `/business-api/user/update/OfflineNoPushMsg` 是否按开关状态发送 `offlineNoPushMsg=0/1`。
- 打开群设置，切换群免打扰或群置顶，观察 `/business-api/room/member/setOfflineNoPushMsg` 是否分别按 `type=0/1` 发起。
- 打开群成员列表，观察 `/business-api/room/member/getMemberListByPage` 是否与 `/business-api/room/openim/members` 一同发起，并确认成员列表是否合并展示或兜底 SDK。
