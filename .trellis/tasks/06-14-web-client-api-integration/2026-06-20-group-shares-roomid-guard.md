# 2026-06-20 群共享文件 roomId 防护

## 背景

- 真实浏览器登录 `18888888888 / czp0422+` 后打开群会话 `sg_3413653759`。
- 聊天资源弹窗中原本只要 `conversation.groupID` 存在就展示“群共享文件”Tab。
- 当前会话的 `currentGroupInfo` 没有明确业务 `roomId/roomID/jid/roomJid`，根据既有 `pickExplicitBusinessRoomId` 规则不能把 OpenIM `groupID` 直接当作业务 `roomId`。
- 切到“群共享文件”Tab 后页面显示空态，但网络请求中没有 `/business-api/room/openim/shares`，容易误判为接口已调用且返回空列表。

## 本次调整

- `src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx`
  - 新增 `canShowGroupShares = Boolean(conversation?.groupID && businessRoomId)`。
  - 只有拿到明确业务 `roomId` 时才展示“群共享文件”Tab。
  - 如果当前 Tab 是 `groupShares` 且业务 `roomId` 丢失，自动切回“文件资源”。

## 接口支持性结论

- Swagger 支持 `/room/openim/shares`、`/room/openim/share/add`、`/room/openim/share/delete`。
- 当前修正不是移除接口接入，而是遵守已确认的业务 `roomId` 契约：没有明确旧系统 `roomId` 时不调用群共享接口，避免把 OpenIM `groupID` 误传给 businessApi。
- 对有明确业务 `roomId` 的群，群共享文件 Tab 仍会展示并调用 `/room/openim/shares`。

## 浏览器复测

- 登录后打开 `#/chat/sg_3413653759`。
- 打开聊天资源弹窗：
  - 收藏消息、已保存合并消息、文件资源接口均通过 `/business-api` 代理返回 200。
  - 文件资源 Tab 返回两条真实 `chuanxi.jpg`。
  - 文件详情 `/file/resources/detail` 返回 `fileId=d78c623fa5704797a08a27422385d17f`、预览/下载签名、缩略图和引用元数据。
  - 引用状态 `/file/reference/status` 返回 `referenceInvalid=false`、`canDelete=false`。
  - 引用关系 `/file/resources/references` 返回 `referenced=false`、`referenceCount=0`。
- HMR 后同一群会话的聊天资源弹窗不再显示“群共享文件”Tab，避免无请求空态。
- 未点击下载、删除、上传、发送、收藏、合并、群共享新增/删除等 mutation 或下载动作。

## 关联观察

- 同一群会话中搜索“在不在”可以显示本地 SDK 历史结果。
- 因当前群没有明确业务 `roomId`，未调用 `/room/openim/messages/search`，属于既有 roomId 防护下的 SDK 只读兜底。
