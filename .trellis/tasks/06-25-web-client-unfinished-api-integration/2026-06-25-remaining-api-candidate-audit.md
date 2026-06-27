# 剩余接口候选复核

## 本轮新增差异扫描

- 基于 `docs/openim-swagger.json` 与 `src/api/**/*.ts` 做路径差异扫描。
- 当前 `src/api/**` 已封装唯一业务路径数：`162`。
- 重点复核 `/user`、`/friends`、`/room` 以及 Web 主线相关前缀。

## 已确认不应直接接入当前 Web 用户端的剩余类目

- 后台/运维/补偿：
  - `/config/dev/admin-token`
  - `/config/openim/callback/*`
  - `/config/openim/poc/*`
  - `/room/openim/failed`
  - `/room/openim/resync`
  - `/room/openim/resync-batch`
  - `/room/openim/status`
  - `/room/openim/batch-status`
  - `/room/openim/mapping`
- 文件清理策略：
  - `/file/cleanup/*`
  - `/file/storage/enterprise-overview`
- 红包/支付/订单/商品/实名/提现/钱包：
  - `/room/openim/red-packet/*`
  - `/user/buyOrder/*`
  - `/user/goods*`
  - `/user/recharge/*`
  - `/user/realName*`
  - `/user/getUserMoeny`
- 机器人：
  - `/room/openim/robot/*`
- 关注/粉丝/商务圈社交关系：
  - `/friends/attention/*`
  - `/friends/fans/list`
  - `/friends/friendsAndAttention`
- 好友分组：
  - `/friendGroup/*`
  - 当前 Web 端没有好友分组 UI 和数据模型，不硬接。
- 推送厂商 token：
  - `/user/apns/setToken`
  - `/user/fcmPush/setToken`
  - `/user/hwpush/setToken`
  - `/user/jPush/*`
  - `/user/MZPush/setPushId`
  - `/user/OPPOPush/setPushId`
- 加密/RSA/群密钥：
  - `/friends/modify/encryptType`
  - `/room/updateEncryptType`
  - `/room/getAllMemberRsaPublicKey`
  - `/room/getMemberRsaPublicKey`
  - `/room/resetGroupChatKey`
  - `/room/updateGroupChatKey`
- 位置共享：
  - `/room/location/*`
  - 当前没有实时位置共享 UI。
- 绑定资料写接口：
  - `/user/bindingEmail`
  - `/user/bindingTelephone*`
  - `/user/profile/email/bind`
  - `/user/profile/phone/bind`
  - 当前只接了 `/user/getBindInfo` 只读兜底；写接口需要验证码/绑定确认 UI。
- 旧登录/注册/SDK 登录：
  - `/user/login*`
  - `/user/register*`
  - `/user/registerSDK*`
  - 当前已验证主链路使用 `/account/login`、`/account/register` 和 `/user/openim/token`，不替换。
- 删除/清理类高风险接口：
  - `/user/destroyMsgRecord`
  - 语义为销毁已过期聊天记录，不应在登录或页面打开时自动触发。

## 已核对但不新增代码的原因

- `/room/update` 已覆盖群消息销毁设置字段，包括 `messageDestroyEnabled`、`messageDestroyDays`、`messageDestroyNoticeEnabled`、`burnAfterReadEnabled`、`burnAfterReadSeconds`、`burnAfterReadNoticeEnabled`、`messageDestroyContentTypes`。
- `/room/openim/status/mapping/resync/failed` 是旧系统与 OpenIM 同步状态/补偿接口，不属于 Web 用户端普通操作入口。
- `/room/openim/copy-room` 与 `/room/copyRoom` 当前没有 Web 群复制入口，不能为了接接口新增无需求入口。

## 本轮结论

- 当前剩余差异中，没有发现新的、可自然挂到现有 Web 用户端页面且低风险的接口。
- 后续继续接入时，应优先来自明确 UI 需求或后端提供清晰契约的 Web 用户端能力，而不是全量 Swagger 路径。
