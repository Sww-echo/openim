# 2026-06-21 群共享文件只读兜底复测

## 背景

- 用户已重新启动本地前端服务，本轮继续使用真实浏览器复测，不运行单元测试、构建或验证脚本。
- 当前页面：`http://127.0.0.1:7777/index.html#/chat/sg_4011035808`。
- 当前群会话：`啊啊i`，OpenIM `groupID=4011035808`。
- 本轮只验证聊天资源中的“群共享文件”只读列表，不触发上传、下载、删除、发送、收藏、合并、审核或群设置保存等真实 mutation。

## 发现

- 打开“聊天资源”并切换到“群共享文件”后，请求按预期走业务代理：
  - `GET /business-api/room/openim/shares?pageIndex=0&pageSize=50&userId=0&roomId=4011035808&access_token=...`
  - HTTP 状态为 200。
- 当前后端业务体仍返回参数校验失败，和之前 `roomId=OpenIM groupID` 契约不兼容的结论一致。
- 原实现会在只读列表加载失败时调用 `feedbackToast({ error })`，导致页面 console 出现业务错误，不符合当前“入口保留 + 空态兜底 + 后端后续兼容”的策略。

## 本轮调整

- `src/pages/chat/queryChat/ChatHeader/ChatBusinessResources.tsx`
  - 仅调整 `loadItems` 的只读列表加载失败处理。
  - 失败时清空列表并使用 `console.debug("Failed to load chat business resources", error)` 记录。
  - 保留详情、上下文、下载、删除、收藏编辑等用户主动操作的 `feedbackToast({ error })` 和二次确认逻辑。

## 真实浏览器复测

- 刷新真实浏览器后重新打开“聊天资源 -> 群共享文件”。
- 页面保持空态：`未搜索到相关结果`。
- 网络请求确认：
  - `/business-api/message/favorites` 返回 200。
  - `/business-api/room/openim/shares` 返回 200。
- 切换群共享文件后不再新增 `src/utils/common.ts` 的 `feedbackToast` error。
- 剩余 console error 来自 OpenIM SDK 增量群成员同步：
  - `/group/get_incremental_group_members_batch`
  - `500 ServerInternalError targetKeys is empty`
  - 属于 SDK 同步链路既有问题，不是本轮业务只读列表新增错误。
- 截图：`output/playwright/chrome-group-shares-readonly-fallback-20260621.png`。

## 结论

群共享文件入口保留，列表请求继续通过 `/business-api` 代理发起；在后端未兼容 OpenIM `groupID` 作为业务 `roomId` 前，前端按空态兜底，不用业务校验失败污染页面错误提示。
