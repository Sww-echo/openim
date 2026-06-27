# Web 聊天功能按最新接口文档重新对齐

## 需求范围

- 群聊列表
- 单聊列表
- 群消息收发
- 文件上传下载
- 图片/视频预览
- 聊天记录搜索
- 消息转发、复制、删除
- 群设置查看
- 群成员查看，受权限控制

## 最新文档接口

后续只以 `docs/openim-frontend-api-doc.json` 为准。

- 单聊发送前校验：`GET /friend/openim/send-before`
- 群聊发送前校验：`GET /room/openim/send-before`
- 单聊记录搜索：`GET /friend/openim/messages/search`
- 群聊记录搜索：`GET /room/openim/messages/search`
- 文件上传上下文：`GET|POST /file/upload/context`
- 文件上传：`POST /file/upload`
- 文件签名、下载、预览：`GET /file/sign`、`GET /file/download`、`GET /file/preview`
- 文件资源：`GET /file/resources`、`GET /file/resources/detail`、`GET /file/resources/references`
- 群共享文件：`GET /room/openim/shares`、`GET /room/openim/share/detail`、`POST /room/openim/share/add`、`POST /room/openim/share/delete`
- 消息收藏：`/message/favorites/**`
- 合并消息：`/message/merge/**`
- 群设置查看：`GET /room/openim/detail`
- 群成员查看：`GET /room/openim/members`、`GET /room/openim/member/detail`
- 已读详情能力：`GET /room/openim/message/read-detail`

## 旧接口处理

以下旧接口需要从聊天主流程迁移或移出：

- `/room/sendMsgBefore` -> `/room/openim/send-before`
- `/user/collection/list` -> `/message/favorites` 或 `/message/favorites/detail`
- `/room/share/find` -> `/room/openim/shares`
- `/room/share/get` -> `/room/openim/share/detail`
- `/room/add/share` -> `/room/openim/share/add`
- `/room/share/delete` -> `/room/openim/share/delete`
- `/room/getRoom`、`/room/get` -> `/room/openim/detail`
- `/room/member/list`、`/room/member/getMemberListByPage` -> `/room/openim/members`
- `/room/member/get` -> `/room/openim/member/detail`

## 实施拆分

1. 静态核对 `src/api/chat.ts`、`src/api/file.ts`、`src/api/group.ts` 中聊天链路旧接口。
2. 将发送前校验统一接入 `/friend/openim/send-before` 和 `/room/openim/send-before`。
3. 将文件上传、签名下载、预览和群共享文件入口统一按最新文档参数对齐。
4. 将聊天记录搜索、收藏、合并转发按 `auditIds` 和最新消息接口对齐。
5. 将聊天页的群设置查看、群成员查看读接口迁移到 `/room/openim/**`。
6. 使用真实接口和浏览器流程验证：单聊发送、群聊发送、文件上传/预览/下载、搜索、转发、群成员查看。

## 完成统计要求

完成本任务时必须新增 Trellis 记录，至少包含：

- 需求项总数、已完成数、未完成数
- 最新文档内已接接口列表
- 替换掉的旧接口列表
- 最新文档缺口列表
- 真实接口调用或浏览器验证结果
- 剩余风险和后续动作
