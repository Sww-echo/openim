# 接口映射

## Swagger 来源

- 页面：http://47.238.134.161:8092/openim-swagger.html
- JSON：http://47.238.134.161:8092/v2/api-docs
- 本地文件：`docs/openim-swagger.json`
- 文档规模：780 个唯一 path，50 个 tag

## 1. 登录与账号

### 企业号验证

- `/enterprise/code/validate`：企业号/邀请码校验。支持企业 ID、企业名称关键字、企业号 companyCode 和有效企业邀请码。

### 个人账号登录与注册

- `/account/login`：账号登录。兼容前端 JSON 请求，当前阶段使用手机号和密码登录。
- `/account/register`：账号注册。兼容前端 JSON 请求，注册无需短信验证码。
- `/account/code/send`：发送账号验证码。当前阶段仅支持手机号，未接短信服务时固定验证码为 666666。
- `/account/code/verify`：校验账号验证码。当前阶段仅支持手机号，未接短信服务时固定验证码为 666666。
- `/user/login/v1`：用户密码登陆新接口，参数复杂，当前 Web demo 更适合继续使用 `/account/login`。
- `/user/openim/token`：刷新或获取当前登录用户的 OpenIM token。

### 登录限制提示

文档中相关接口主要位于后台安全分类：

- `/console/enterprise/security/login/precheck`：企业后台登录安全预检。
- `/console/enterprise/security/curfew/status`：企业后台宵禁状态。
- `/console/enterprise/users/login-ip-bindings`：企业后台本企业成员登录 IP 绑定列表。
- `/console/platform/security/login/precheck`：平台总后台登录安全预检。
- `/console/platform/security/curfew/status`：平台总后台宵禁状态。

风险：这些接口不是明显的 Web 用户端接口。建议 Web 用户端由 `/account/login` 返回 IP 限制/宵禁错误码和提示，或后端补充用户端登录预检接口。

## 2. 聊天主链路

### SDK 优先能力

- 群聊列表
- 单聊列表
- 普通单聊/群聊消息收发
- 消息复制

这些优先使用 OpenIM SDK，业务 API 只做 token、权限、发送前校验、搜索和审计相关补充。

### 单聊桥接

- `/friend/openim/send-before`：单聊消息发送前业务校验。通过后前端使用 OpenIM SDK 发送消息。
- `/friend/openim/messages/search`：用户端单聊聊天记录搜索。数据来自已落库 OpenIM 消息审计。

### 群聊桥接与发送

- `/room/openim/send-before`：群消息发送前校验。
- `/room/openim/messages/search`：用户端群聊聊天记录搜索。数据来自已落库 OpenIM 消息审计。
- `/room/openim/message/recall`：群消息撤回。普通成员只能撤回自己 2 分钟内消息，群主/管理员可撤回本群任意消息。

### 消息转发、收藏、合并

- `/message/merge/preview`：合并消息预览。
- `/message/merge/save`：保存合并消息快照。
- `/message/merge/forward-before`：合并转发前生成 OpenIM SDK payload，真实发送仍由前端 SDK 完成。
- `/message/merge/saved`：已保存合并消息列表。
- `/message/merge/detail`：已保存合并消息详情。
- `/message/merge/delete`：删除已保存合并消息。
- `/message/favorites`：用户端消息收藏列表。
- `/message/favorites/add`：收藏单条消息。
- `/message/favorites/delete`：删除消息收藏。
- `/message/favorites/detail`：用户端消息收藏详情。
- `/message/favorites/context`：用户端消息收藏上下文。
- `/message/favorites/merge`：合并收藏多条消息。
- `/message/favorites/update`：更新消息收藏标题、备注或标签。

## 3. 文件与媒体

- `/file/upload/context`：文件上传上下文。
- `/file/upload`：上传文件。
- `/file/sign`：生成文件下载或预览签名。
- `/file/download`：按签名下载文件。
- `/file/preview`：按签名预览文件。
- `/file/compress`：压缩图片文件。
- `/file/convert`：转换视频文件为 MP4 格式。
- `/file/delete`：逻辑删除未被引用的上传文件。
- `/file/resources`：当前用户上传文件列表。
- `/file/resources/detail`：当前用户文件详情。
- `/file/resources/references`：当前用户文件引用关系。
- `/file/reference/status`：查询文件引用失效状态。
- `/file/reference/invalidate`：标记文件引用为失效。
- `/file/storage/overview`：当前用户文件容量概览。
- `/file/storage/room-overview`：群文件容量概览。
- `/file/storage/enterprise-overview`：企业文件容量概览。

## 4. 群管理

### 群详情与成员

- `/room/openim/detail`：群详情聚合查询。
- `/room/openim/members`：查询群成员列表。
- `/room/openim/online-members`：查询群在线成员列表。
- `/room/openim/special-members`：查询群隐身人和监控人列表。
- `/room/openim/member/set-special-role`：设置群隐身人或监控人。
- `/room/openim/member/remark/update`：修改群成员备注。

备用旧群组接口：

- `/room/get`：根据房间 ID 获取群组。
- `/room/member/list`：查询群成员。
- `/room/member/get`：获取成员详情。

### 群公告

- `/room/openim/notices`：查询群公告列表。
- `/room/openim/notice/update`：修改群公告并同步 OpenIM。
- `/room/openim/notice/delete`：删除群公告并同步 OpenIM。

### 邀请审核与二维码

- `/room/openim/join-requests`：查询入群审核申请列表。
- `/room/openim/join-requests/handle`：处理入群审核申请。
- `/room/openim/qr/create`：生成群二维码短码。
- `/room/openim/qr/resolve`：解析群二维码短码。
- `/room/openim/qr/join`：扫码入群或提交入群审核。

### 群消息与个人群设置

- `/room/openim/message/read-detail`：查询群消息已读详情能力状态。
- `/room/openim/member/set-offline-no-push`：设置当前用户群免打扰。
- `/room/openim/member/set-top`：设置当前用户群置顶。
- `/room/openim/member/clear-message`：清空当前用户群消息游标。
- `/room/openim/share/add`：新增群共享文件。
- `/room/openim/share/delete`：删除群共享文件。
- `/room/openim/shares`：查询群共享文件列表。

### 群助手

仅在产品需要群助手/自动回复时接入：

- `/room/openim/group-helpers`
- `/room/openim/group-helpers/add`
- `/room/openim/group-helpers/delete`
- `/room/openim/group-helpers/available`
- `/room/openim/group-helpers/context`
- `/room/openim/group-helpers/keywords/add`
- `/room/openim/group-helpers/keywords/update`
- `/room/openim/group-helpers/keywords/delete`

## 5. 好友、成员、资料展示

- `/friends/list`：获取好友列表。
- `/friends/get`：获取好友详情。
- `/friends/page`：查找好友。
- `/friends/add`：加好友。
- `/friends/delete`：删除好友。
- `/friends/remark`：修改备注。
- `/friends/update`：修改好友属性。
- `/friends/update/OfflineNoPushMsg`：好友消息免打扰、阅后即焚、聊天置顶。
- `/friends/newFriend/list`：获取新的朋友列表。
- `/friends/newFriendListWeb`：新朋友列表。
- `/friends/blacklist`：黑名单列表。
- `/friends/blacklist/add`：添加黑名单。
- `/friends/blacklist/delete`：取消拉黑。
- `/friendGroup/list`：好友分组列表。
- `/friendGroup/add`：添加好友列表。
- `/friendGroup/update`：修改好友列表。
- `/friendGroup/delete`：修改好友列表。
- `/friendGroup/updateFriend`：更新好友。
- `/friendGroup/updateGroupUserList`：更新分组的好友列表。

风险：当前前端代码里使用了 `/user/find/full`、`/user/search/full`，但更新后的 Swagger 未看到这两个接口，需要后端确认是否仍可用。

## 6. 组织架构和权限

如果群成员权限或管理员入口依赖企业组织架构，需要接入：

- `/org/company/getByUserId`：根据 userId 查找其所属公司。
- `/org/company/employees`：公司员工列表。
- `/org/company/managerList`：管理员列表。
- `/org/employee/role`：获取公司中某个员工角色值。
- `/org/departmemt/empList`：部门员工列表。
- `/org/department/list`：部门列表。

## 7. 明确排除

当前 Web 用户端首期不需要优先接入：

- `console` 后台完整管理接口。
- 支付、转账、消费记录。
- 商务圈、直播间、客服。
- 商品、订单、转盘、在线奖励、首页图等运营功能。
- 平台总后台和企业后台安全配置管理。
