# 2026-06-20 最新 Swagger 接口支持性核对

## 文档来源

- 已从 `http://47.238.134.161:8092/v2/api-docs` 重新保存最新 Swagger JSON 到 `docs/openim-swagger.json`。
- 首次使用 PowerShell `.Content` 保存会造成中文摘要乱码，已改用 `Invoke-WebRequest -OutFile` 按原始字节重新保存。
- 当前本地文件：`docs/openim-swagger.json`，大小约 1.95MB，中文摘要可被 Node 正常解析。

## Web 用户端已确认支持的接口

- 登录：`/account/login`，文档说明兼容前端 JSON 请求，当前阶段使用手机号和密码登录。
- 用户搜索/加好友：
  - `/user/getByAccount`：按通讯号查用户，必填 `account`，`access_token` 由请求层追加。
  - `/user/public/search/list`：公开搜索，必填 `keyWorld`。
  - `/friends/page`：好友/用户分页搜索，必填 `userId`，可传 `keyword/pageIndex/pageSize/status`。
  - `/friends/add`：加好友，必填 `toUserId`。
- 聊天记录搜索：
  - `/friend/openim/messages/search`：单聊搜索，必填 `peerUserId`，可传 `keyword/contentType/fileExt/startTime/endTime/includeDestroyed/pageIndex/pageSize`。
  - `/room/openim/messages/search`：群聊搜索，必填旧系统 `roomId`，可传 `keyword/senderUserId/contentType/fileExt/startTime/endTime/includeDestroyed/pageIndex/pageSize`。
  - 文档明确搜索数据来自“已落库 OpenIM 消息审计”，因此真实会话可见但审计未落库/未覆盖时，业务接口可能返回空；当前 SDK 本地历史只读兜底不替代业务接口，只处理这种展示空洞。
- 收藏/合并消息：
  - `/message/favorites/add`：支持 `auditId`，也兼容 `roomId/clientMsgID/serverMsgID/seq/note/tags`。
  - `/message/favorites/merge`：必填 `auditIds`。
  - `/message/merge/preview`、`/message/merge/save`：必填 `auditIds`，后端只预览/保存，不发送 OpenIM 消息。
- 群相关：
  - `/room/join`：必填 `roomId`，`type` 可选，文档仍是业务关系类型。
  - `/room/member/getMemberListByPage`、`/room/member/list`：支持群成员列表/搜索。
  - `/room/notice/list`、`/room/noticesPage`：支持公告列表。
- 文件：
  - `/file/upload`：multipart `file` 必填，可传 `scene/roomId`。
  - `/file/download`：签名下载，必填 `fileId/expiresAt/signature`。

## 对当前代码的判断

- 当前聊天记录搜索优先调用业务接口是正确的，且参数名与文档一致。
- 本地 SDK 历史兜底只能用于只读搜索展示，不能给本地结果生成或推断 `auditId`，否则会误开放收藏/合并等依赖审计 ID 的写入口。
- 好友搜索当前三段链路与文档支持一致：通讯号、公开搜索、分页兜底。
- 文件下载必须先拿到签名参数；不能把普通文件 URL 当作 `/file/download` 的 `fileId` 直接调用。

## 验证状态

- 已完成线上 Swagger 只读 GET 和本地 JSON 保存。
- 已完成文档路径/参数的源码级核对。
- 未运行单元测试、构建或验证脚本。
- 未触发登录、加好友、发送、上传、下载、收藏、合并、删除或审核等真实 mutation。
