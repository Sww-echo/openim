# 2026-06-21 群通知 businessApi 列表兜底复测

## 范围

- 本轮只覆盖 Web 端通讯录「群通知」只读列表接入。
- 不触发同意、拒绝、删除、发送、上传、下载、群设置保存等 mutation。
- 不运行单元测试、构建或验证脚本。

## 代码接入

- `src/store/contact.ts` 在 `getRecvGroupApplicationListByReq` 中保留 OpenIM SDK 申请列表作为基线。
- 基于当前 `groupList` 遍历群，尝试调用 `getOpenIMJoinRequests({ roomId, status: -1, pageIndex: 0, pageSize: 100 })`。
- 将 `/room/openim/join-requests` 返回归一化为 `GroupApplicationItem` 后与 SDK 列表合并。
- 业务列表失败时降级为 `console.debug`，不影响 SDK 群通知兜底展示。
- 处理同意/拒绝的 mutation 链路未改：只有能解析到业务 `requestId` 时才会走 `/room/openim/join-requests/handle`，且页面仍保留原有确认流程。

## 真实浏览器只读复测

- 浏览器 URL：`http://127.0.0.1:7777/index.html#/contact/groupNotifications`
- 页面状态：通讯录「群通知」页面正常渲染，当前为空态。
- 新增业务请求已通过 `/business-api` proxy 发出：
  - `POST /business-api/room/openim/join-requests?pageIndex=0&pageSize=100&roomId=4011035808&status=-1&access_token=...`，HTTP 200
  - `POST /business-api/room/openim/join-requests?pageIndex=0&pageSize=100&roomId=3413653759&status=-1&access_token=...`，HTTP 200
- 日志中可见后端业务体返回 `resultCode=1010101`、`resultMsg=请求参数验证失败，缺少必填参数或参数错误`，说明当前仍存在 OpenIM `groupID` 作为 business `roomId` 的后端契约不兼容。
- Playwright console level 复查：0 errors，0 warnings。
- 截图：`output/playwright/chrome-group-notifications-business-list-fallback-20260621.png`

## 结论

- 群通知业务列表入口已保留并开始尝试调用 businessApi。
- 当前后端未兼容 OpenIM `groupID` 作为 `roomId` 时，前端不会打断页面，继续用 SDK 申请列表兜底。
- 后续后端修正 `roomId` 契约或返回显式 business `roomId` 后，需要用真实群申请数据复测列表合并和 `requestId` 处理链路。
