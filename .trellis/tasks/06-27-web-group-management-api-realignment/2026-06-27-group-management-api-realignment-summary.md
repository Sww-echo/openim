# Web 群管理功能最新接口对齐完成统计

## 范围

- 接口文档：`docs/openim-frontend-api-doc.json`
- 需求来源：`需求清单.txt` 的 `2.3 群管理功能`
- 代码范围：`src/api/group.ts`、`src/hooks/useGroupMembers.ts`、`src/store/contact.ts`、`src/pages/common/ChooseModal/index.tsx`、`src/pages/chat/queryChat/GroupSetting/**`

## 需求统计

| 需求项 | 状态 | 接入口径 |
| --- | --- | --- |
| 群主/管理员管理入口 | 已对齐 | `useCurrentMemberRole` + `/room/openim/detail` 返回字段控制管理入口 |
| 群公告管理 | 已对齐 | `/room/openim/notices`、`/room/openim/notice/add`、`/room/openim/notice/update`、`/room/openim/notice/delete` |
| 群成员管理 | 已对齐 | `/room/openim/members`、`/room/openim/member/detail`、`/room/openim/member/remark/update`，邀请/踢人/转让/禁言/管理员由 SDK 承担 |
| 群权限设置 | 部分对齐 | OpenIM 原生权限用 SDK；业务扩展权限旧 `/room/update` 已移除，最新文档无写接口，UI 明确提示缺口 |
| 消息销毁设置 | 文档缺口 | 最新文档无用户端写接口，旧 `/room/update` 不再调用，UI 明确提示缺口 |
| 邀请审核 | 已对齐 | `/room/openim/join-requests`、`/room/openim/join-requests/handle` |
| 查看已读详情 | 已对齐 | `/room/openim/message/read-detail` |
| 查看在线成员 | 已对齐 | `/room/openim/online-members` |

- 总数：8
- 已按最新文档或 SDK 责任边界可用：6
- 部分可用但存在文档缺口：1
- 明确文档缺口：1
- 仍沿用旧 Swagger 主流程接口：0

## 已接入最新文档接口

- 建群：`POST /room/add`
- 群详情：`GET /room/openim/detail`
- 群成员：`GET /room/openim/members`、`GET /room/openim/member/detail`、`POST /room/openim/member/remark/update`
- 群公告：`GET /room/openim/notices`、`POST /room/openim/notice/add`、`POST /room/openim/notice/update`、`POST /room/openim/notice/delete`
- 入群审核：`GET /room/openim/join-requests`、`POST /room/openim/join-requests/handle`
- 已读详情：`GET /room/openim/message/read-detail`
- 在线成员：`GET /room/openim/online-members`
- 特殊成员：`GET /room/openim/special-members`、`POST /room/openim/member/set-special-role`
- 当前用户群设置：`POST /room/openim/member/set-offline-no-push`、`POST /room/openim/member/set-top`、`POST /room/openim/member/clear-message`
- 群助手：`GET /room/openim/group-helpers/context`、`GET /room/openim/group-helpers`、`GET /room/openim/group-helpers/available`、`POST /room/openim/group-helpers/add`、`POST /room/openim/group-helpers/delete`、`POST /room/openim/group-helpers/keywords/add`、`POST /room/openim/group-helpers/keywords/update`、`POST /room/openim/group-helpers/keywords/delete`
- 群二维码：`POST /room/openim/qr/create`、`GET /room/openim/qr/resolve`、`POST /room/openim/qr/join`
- 群共享：`GET /room/openim/shares`、`GET /room/openim/share/detail`、`POST /room/openim/share/add`、`POST /room/openim/share/delete`

## 替换或移除的旧接口

- `/room/getRoom`、`/room/get` -> `GET /room/openim/detail`
- `/room/member/list`、`/room/member/getMemberListByPage`、`/room/member/getMemberListByKeywords` -> `GET /room/openim/members`
- `/room/member/get` -> `GET /room/openim/member/detail`
- `/room/notice/list`、`/room/noticesPage` -> `GET /room/openim/notices`
- `/room/updateNotice` -> `POST /room/openim/notice/update`
- `/room/notice/delete` -> `POST /room/openim/notice/delete`
- `/room/queryGroupHelper`、`/room/addGroupHelper`、`/room/deleteGroupHelper`、旧自动回复接口 -> `/room/openim/group-helpers/**`
- `/room/share/find`、`/room/share/get`、`/room/add/share`、`/room/share/delete` -> `/room/openim/share/**`
- `/room/list`、`/room/join`、`/room/update`、`/room/member/delete`、`/room/transfer`、`/room/delete`、`/room/set/admin` 不再作为新文档主流程接口调用。

## SDK 承担项

- 群聊列表和已加入群组列表：OpenIM SDK `getJoinedGroupListPage`。
- 普通邀请成员、踢出成员、转让群主、设置/取消管理员、成员禁言/解禁。
- 退群、解散群、OpenIM 群名称/头像/基础权限更新。
- 群消息实际收发和本地消息清理。

## 文档缺口

- 最新文档没有旧 `/room/update` 的用户端等价接口，因此业务扩展权限、消息销毁、消息销毁通知、撤回时长、聊天记录保留、搜索入群方式等不能继续按旧接口写入。
- 最新文档没有普通搜索入群/直接入群接口；只有群二维码 `/room/openim/qr/join`。
- 最新文档没有用户端 `/room/set/admin`、`/room/member/delete`、`/room/transfer`、`/room/delete` 等旧业务写接口，当前由 OpenIM SDK 承担。
- 最新文档未列出 `/room/openim/member/mute`、`/room/openim/member/unmute`、`/room/openim/member/remark/delete`，因此禁言走 SDK，删除备注通过 `remarkName=""` 的文档内更新接口实现。

## 验证结果

- `npm run verify:web-api-coverage`：通过，`expectedCount=101`，`missingInApiDoc=[]`，`missingInSource=[]`，`unexpectedSourceOnly=[]`，`unexpectedSourceNotInApiDoc=[]`。
- `npm run verify:web-api-contract`：通过，`checkedCount=240`，`failedCount=0`。
- `npm run verify:web-api-lint`：通过。
- `npm run verify:web-api-e2e` 远程验证通过：
  - 登录测试账号成功，`userID=10000004`。
  - `GET /room/openim/detail`、`GET /room/openim/members`、`GET /room/openim/notices`、`GET /room/openim/join-requests`、`GET /room/openim/online-members`、`GET /room/openim/special-members` 均通过。
  - `GET /room/openim/send-before`、`GET /room/openim/message/read-detail` 均通过。
  - 新增、编辑、删除群公告写入链路通过：创建内容 `codex-e2e-notice-add-1782497700000`，查到 `noticeId=6a3ec3ad89552748667debc4`，更新为 `codex-e2e-notice-update-1782497700000` 后删除成功。
  - 首次临时验证遗留公告 `noticeId=6a3ec0e289552748667deb82` 已清理。
- Playwright CLI 浏览器验证通过：
  - 登录测试账号后进入 `#/chat`。
  - 进入 `#/contact/myGroups` 后，“我的群组”列表显示 `codex-api-realign-1782496629149`，不再是空数据。
  - 点击群组后群资料卡打开，显示 `ID: 2757436928`、`群成员：1`。
  - 相关 OpenIM SDK 群列表/群成员请求为 200；`/business-api/room/openim/join-requests` 请求为 200；console error 为 0。
- 验证脚本同步增强：
  - `scripts/verify-web-api-e2e.mjs` 已支持 `OPENIM_E2E_GROUP_NOTICE_ADD_CONTENT`、`OPENIM_E2E_GROUP_NOTICE_DELETE_ID`、`OPENIM_E2E_GROUP_NOTICE_DELETE_AFTER_ADD`。
  - 列表解析已覆盖 `notices/members/onlineMembers/specialMembers/joinRequests/shares` 等最新文档响应字段。

## 剩余风险

- 群权限和消息销毁的业务写入不是前端实现问题，而是最新文档缺少用户端接口；当前正确行为是阻断旧接口并提示“最新接口文档未提供该功能接口”。
- 入群审核处理需要真实待审核 `requestId` 才能验证 approve/reject 写入，本轮验证了列表和处理接口契约，未强造审核单。
- 已读详情接口需要真实 `clientMsgID/serverMsgID/seq` 才能验证具体明细，本轮验证了能力接口和空定位容错。
