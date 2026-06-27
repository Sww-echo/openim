# 2026-06-20 接口契约继续审计

## 范围

- 仅审计 Web 用户端接口接入，不纳入后台、移动端、支付、运营、清理治理等接口。
- 不运行单元测试、构建或验证脚本；本轮只做源码与本地 Swagger JSON 的只读核对。
- 不触发上传、下载、发送、删除、审核、清空、加群、群设置等真实 mutation。

## 已复核

- `src/api/**` 中业务请求路径与 `docs/openim-swagger.json` 全量比对：
  - 源码业务请求唯一调用数：104。
  - Swagger 中未出现的源码路径为 `/account/password/reset` 和 `/user/rtc/get_token`。
  - `/account/password/reset` 属于找回密码历史兜底：只有 `/account/code/verify` 未返回 `/user/password/reset` 必需的 `serial/deviceSerial/deviceID/deviceId` 时才使用，且已加入请求层公开路径，避免未登录流程携带残留 `access_token`。
  - `/user/rtc/get_token` 属于既有 RTC 旧能力保留项，已在 `research.md` 中归类为不纳入本期 Swagger 强接范围。
  - 未发现源码业务请求 method 与 Swagger method 不匹配。
- 群管理高风险路径复核：
  - `/room/openim/detail`、`/room/getRoom`：均支持 GET/POST query `roomId`，当前封装使用 GET query，并保留旧接口兜底。
  - `/room/openim/shares`、`/room/openim/share/add`、`/room/openim/share/delete`：当前参数位置与必填字段对齐 Swagger。
  - `/room/openim/group-helpers/**`：群助手上下文、列表、可添加列表、添加、删除、关键字增删改均按 Swagger query 参数封装。
  - `/room/openim/qr/create`、`/room/openim/qr/resolve`、`/room/openim/qr/join`：二维码生成/解析/入群参数与 Swagger 一致，其中 `applyReason` 仅用于二维码入群。
- 聊天资源路径复核：
  - `/message/favorites`、`/message/merge/saved`、`/file/resources` 的 `deleted/pageIndex/pageSize/roomId` 等列表参数均在 Swagger 定义内。
  - `/message/favorites/detail|update|delete`、`/message/merge/detail|delete` 的 ID 参数名与 Swagger 一致。
  - `/file/resources/references`、`/file/reference/status`、`/file/reference/invalidate`、`/file/storage/overview`、`/file/storage/room-overview` 参数与 Swagger 一致。
- 写操作确认链路复核：
  - 群助手增删、关键字增删改均在确认框 `onOk` 后调用远端。
  - 二维码入群在确认框 `onOk` 后调用远端；二维码解析是只读查询。
  - 成员备注保存在二次确认后调用 `/room/openim/member/remark/update`。
  - 收藏编辑、删除收藏、删除合并消息、删除文件资源、删除群共享文件、下载文件均有确认入口。
  - 文件引用失效接口只在用户已确认发送但发送前置校验拒绝、或用户确认撤回后作为清理动作触发。
- 群选择器复核：
  - 邀请入群、踢出成员、转让群主均要求同时具备 OpenIM `groupID` 和业务 `roomId`；缺失时不调用远端并提示失败。
  - 合并/普通消息转发前置接口 `/message/merge/forward-before` 的 `targetId` 文档定义为 OpenIM `userID/groupID`，当前选择器使用 `item.userID/item.groupID` 符合 Swagger。
- 加群卡片复核：
  - `/room/join` Swagger 只定义 `roomId` 和 `type`，不定义申请理由字段；当前不把 UI 中的 `reqMsg` 传入该接口，避免发送未知参数。

## 仍未完成

- 后端拒绝场景、上传/下载、真实发送、删除、审核、群设置、清空消息等 mutation/下载验收仍需要用户明确确认后才能执行。
- 收藏/合并消息完整详情仍依赖真实 `auditId/favoriteId/mergeId` 数据。
- 群管理完整验收仍依赖真实群主或管理员账号，以及包含公告、申请、在线成员、特殊成员等数据的真实群。
- IP 限制和宵禁提示仍需要后端返回真实限制错误后才能验证最终文案。
