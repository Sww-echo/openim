# 2026-06-20 剩余候选接口复扫

## 复扫方式

- 数据源：`docs/openim-swagger.json`。
- 源码范围：`src/api/**` 中 `businessRequest.get/post/put/delete/patch` 调用。
- Web 候选前缀：`/account/**`、`/enterprise/**`、`/friend/openim/**`、`/message/**`、`/file/**`、`/friends/**`、`/room/openim/**`、`/room/**`、`/system/**`、`/user/**` 中与当前 Web 用户端可能相关的路径。
- 排除后台、支付、运营、商品、直播、客服、回调配置等非 Web 用户端范围。

## 结果

- 当前源码业务请求唯一封装数：107。
- Web 粗筛候选路径数：202。
- 候选中未封装路径数：100。
- 未封装路径按 UI 入口复核后仍保持“不接入本期 Web 用户端”或“待产品入口/后端契约明确后再接”。

## 本轮重点核对

- 好友分组、关注/粉丝、收藏表情：
  - 当前通讯录和聊天输入区没有对应产品入口。
  - 接入会改变现有信息架构或新增远端写操作，不属于本期 Web 首期清单。
- 文件清理、企业容量、OpenIM 同步桥接运维：
  - 属于后台治理或企业管理能力。
  - 当前 Web 用户端已接个人/群文件资源、引用状态和容量概览，不接后台清理策略。
- 旧群接口：
  - 当前优先使用新版 `/room/openim/**` 和 `/room/update`。
  - `/room/getRoom` 仅作为群详情只读兜底保留；其他旧群成员、公告、共享、群助手、自动回复、加密、位置、红包等不重复接入。
- 用户隐私设置、扩展资料、邮箱/手机号绑定、安全/支付资料：
  - 当前 Web 首期只覆盖基础资料 `/user/get`、`/user/update`。
  - 隐私、扩展资料元信息、绑定、实名、安全密钥、余额、支付密码等没有产品入口，且涉及安全/支付语义。
- 旧登录/注册/账号绑定链路：
  - 当前登录、注册、验证码、OpenIM token 刷新已按联调文档使用 `/account/**` 和 `/user/openim/token`。
  - 旧 `/user/login/v1`、`/user/register/v1`、微信绑定、自动登录、二维码登录等不迁移。
- 旧 RTC/会议接口：
  - `/user/rtc/get_token` 是既有源码保留路径且不在最新 Swagger。
  - `/user/openMeet` 仅描述获取会议地址，没有替代当前 RTC token 的 Web 契约；暂保留既有 RTC 能力，不纳入本期 Swagger 强接范围。

## 已确认仍对齐的现有入口

- 用户卡片、个人资料编辑、好友备注、黑名单、新朋友列表均已通过业务接口或业务 + SDK 合并链路接入。
- 系统公告列表、详情、未读数、单条已读、全部已读参数与 Swagger 一致；标已读动作均在用户点击确认后触发。
- 添加好友申请输入框中的申请说明暂不传递：Swagger `/friends/add` 只定义 `toUserId`。
- 群卡片入群申请说明暂不传递：Swagger `/room/join` 只定义 `roomId/type`。
- `/user/logout` 本轮重新复核后仍不强接：Swagger 同时要求 `deviceKey/devicekey/telephone(MD5)/access_token`，当前 Web 登录响应和本地账号结构没有稳定 device key 来源，详见 `2026-06-20-logout-contract-rescan.md`。

## 验证状态

- 本轮只做源码和 Swagger 静态复核。
- 未运行单元测试、构建或验证脚本。
- 未触发真实上传、下载、发送、加好友、加群、删除、审核、群设置或清空消息等 mutation。

## 继续复核补充

- 已用 Playwright CLI 连接并控制真实 Google Chrome 打开 `http://127.0.0.1:7777/index.html#/login`，使用 `18888888888 / czp0422+` 登录成功进入 `#/chat`。
- 浏览器网络请求确认：
  - 企业号校验、登录、公告未读、黑名单、新朋友列表、用户信息、头像、好友列表等业务请求走 `/business-api/**` 代理并返回 200。
  - OpenIM SDK 会话、好友、群组和用户资料请求仍走 `http://47.238.134.161:10002/**`。
  - `/group/get_recv_group_applicationList` 出现过一次瞬时 `net::ERR_FAILED`，后续同路径请求返回 200，未阻断页面。
- 截图产物：`output/playwright/chrome-current-verify.png`。
- 复核 `/room/add`：
  - 最新 Swagger 仍要求 `room`、`text`、`keys` 三个必填 query 参数，其中 `room` 是旧系统完整群实体，包含大量旧字段、红包/直播/加密/地理位置等非本期语义。
  - 当前创建群入口继续保留 OpenIM SDK `createGroup`；多人建群提交前已有二次确认，未强行拼接旧系统 `room` 实体调用 `/room/add`。
- 复核 `/room/update` 剩余字段：
  - 当前未做 UI 的字段包括 `maxUserSize`、`isAttritionNotice`、`attritionInactiveEnabled`、`attritionInactiveDays`、`attritionOverflowEnabled`、`talkTime`、`s`、`allowOpenLive`、`roomTitleUrl`、`adminMaxNumber` 等。
  - 这些字段分别属于容量上限、自动减员、群状态禁用、直播、站点 URL、管理员数量上限等配置，未出现在本期 Web 用户端需求清单中；不为了覆盖率强接，后续需要产品入口或后端契约明确后再补。
- 精确引用复核：
  - `getBusinessUserAvatar`、`getBusinessUserByAccount`、`searchPublicBusinessUsers`、签名下载/预览等看似未被页面直接引用的封装，实际作为 API 层内部兜底链路使用。
  - 未发现新的“已有 Swagger、属于本期 Web、且页面有入口但源码未接”的明确缺口。
- 本轮未运行单元测试、构建或验证脚本；未点击任何确认框 OK，未触发发送、上传、下载、加好友、加群、创建群、删除、审核、群设置保存或通知设置更新等真实 mutation。
