# Web 聊天功能最新接口方法对齐进展

## 本轮完成

- `src/api/chat.ts`
  - `singleSendBefore` 改为 `GET /friend/openim/send-before`。
  - `groupSendBefore` 改为 `GET /room/openim/send-before`。
  - 移除旧 `/room/sendMsgBefore` fallback。
  - 单聊/群聊聊天记录搜索改为 `GET /friend/openim/messages/search`、`GET /room/openim/messages/search`。
  - 合并消息预览、转发前校验、列表、上下文、详情查询改为最新文档 GET 方法。
  - 消息收藏列表、上下文、详情查询改为最新文档 GET 方法。
  - 移除旧 `/user/collection/list` 收藏 fallback。
- `src/api/file.ts`
  - 上传上下文、文件签名、签名下载、签名预览、文件列表、文件详情、引用列表、空间概览、引用状态查询改为最新文档 GET 方法。
  - `POST /file/upload`、`POST /file/delete`、`POST /file/reference/invalidate`、压缩/转码类写操作保持最新文档 POST 方法。
- 群共享聊天入口
  - `ChatBusinessResources.tsx` 只使用 `/room/openim/shares`、`/room/openim/share/detail`、`/room/openim/share/delete`。
  - `SendActionBar/index.tsx` 发送附件后只使用 `/room/openim/share/add` 同步群共享文件。
  - 移除聊天 UI 中旧 `/room/share/find`、`/room/share/get`、`/room/add/share` fallback。
- 验证脚本
  - `scripts/verify-web-api-contract.mjs` 增加聊天/文件 GET 方法断言和旧接口禁用断言。
  - `scripts/verify-web-api-coverage.mjs` 纳入 `/room/openim/share/detail`。
  - `scripts/verify-web-api-e2e.mjs` 的读接口按最新文档 GET 方法发送。

## 已替换旧接口

- `/room/sendMsgBefore` -> `GET /room/openim/send-before`
- `/user/collection/list` -> `GET /message/favorites`
- `/room/share/find` -> `GET /room/openim/shares`
- `/room/share/get` -> `GET /room/openim/share/detail`
- `/room/add/share` -> `POST /room/openim/share/add`
- `/room/share/delete` -> `POST /room/openim/share/delete`

## 真实接口验证

使用临时账号 `18892517876 / userID=10000038` 登录后验证：

- `GET /friend/openim/send-before?toUserId=10000039`：通过。
- `GET /message/favorites?pageIndex=0&pageSize=5&deleted=0`：通过。
- `GET /message/merge/context`：通过。
- `GET /file/upload/context?scene=common`：通过。
- `POST /file/upload?scene=common`：通过，返回 `fileId=cd548b25e51f47059e13b63756b54bf8`。
- `GET /file/resources/detail?fileId=cd548b25e51f47059e13b63756b54bf8`：通过。
- `GET /file/sign?fileId=...&mode=download` 后下载 URL：通过，返回 54 bytes。
- `GET /file/sign?fileId=...&mode=preview` 后预览 URL：通过，返回 54 bytes。

## 静态验证

- `npm run verify:web-api-coverage`：通过，`expectedCount=109`，`missingInApiDoc=[]`，`missingInSource=[]`，`unexpectedSourceOnly=[]`。
- `npm run verify:web-api-contract`：通过，`checkedCount=230`，`failedCount=0`。
- `npx eslint --quiet "src/api/chat.ts" "src/api/file.ts" "src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx" "src/pages/chat/queryChat/ChatFooter/SendActionBar/index.tsx" "scripts/verify-web-api-contract.mjs" "scripts/verify-web-api-coverage.mjs" "scripts/verify-web-api-e2e.mjs"`：通过。

## 剩余项

- 群设置查看、群成员查看、公告、审核、在线成员等仍需继续把 `src/api/group.ts` 中的新文档 GET-only 接口从 POST 改为 GET。
- `src/api/group.ts` 仍保留多条旧 `/room/**` wrapper，后续要按群管理任务逐项移除、降级为 SDK 承担或记录文档缺口。
- 全量 `src/api/group.ts` lint 仍有既有 Prettier 问题，本轮未整文件格式化，避免扩大无关 diff。
- 聊天大功能项尚未最终完成；完成后还需要新增最终总结统计记录。
