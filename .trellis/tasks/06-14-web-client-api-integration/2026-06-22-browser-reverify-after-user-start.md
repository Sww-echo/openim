# 2026-06-22 用户启动服务后的真实浏览器复测

## 范围

- 用户启动本地服务后，使用 Playwright CLI 连接真实浏览器复测。
- 本轮账号：`18888888888 / czp0422+`，登录后进入 `#/chat`，账号展示为 `qqq`，当前 OpenIM userID 为 `10000003`。
- 进入群会话：`#/chat/sg_3413653759`，群名 `橙子皮、橙子皮1、橙子皮4`。
- 仅验证只读入口和请求结果，未触发发送、上传、下载、删除、转发、收藏、审核、群设置保存或其他 mutation。
- 未运行单元测试、构建或验证脚本。

## 已确认链路

- `/business-api/enterprise/code/validate?code=LOCALTEST001` 返回 HTTP 200。
- `/business-api/account/login` 返回 HTTP 200，后续 businessApi 请求继续通过 `access_token` query 传递业务 token。
- `/business-api/system/announcements/unread-count` 返回 HTTP 200。
- `/business-api/friends/list`、`/business-api/friends/queryBlacklistWeb`、`/business-api/friends/newFriendListWeb`、`/business-api/user/get`、`/business-api/user/avatar/get` 均通过 `/business-api` proxy 返回 HTTP 200。
- OpenIM SDK/API 仍走 `http://47.238.134.161:10002`，会话、群、好友基础同步请求保持 SDK 通道。

## 群业务只读结果

- `/business-api/room/openim/detail?roomId=3413653759&access_token=...`
  - HTTP 200。
  - 业务体：`resultCode=1010101`，`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`。
- `/business-api/room/openim/members?pageIndex=0&pageSize=100&roomId=3413653759&keyword=10000003&access_token=...`
  - HTTP 200。
  - 业务体：`resultCode=1010101`，`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`。
- `/business-api/room/openim/join-requests?pageIndex=0&pageSize=100&roomId=3413653759&status=-1&access_token=...`
  - HTTP 200。
  - 业务体：`resultCode=1010101`，`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`。
- `/business-api/room/openim/shares?pageIndex=0&pageSize=50&userId=0&roomId=3413653759&access_token=...`
  - HTTP 200。
  - 业务体：`resultCode=1010101`，`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`。
  - 页面展示空态 `未搜索到相关结果`。
- `/business-api/file/storage/room-overview?roomId=3413653759&access_token=...`
  - HTTP 200。
  - 业务体：`resultCode=0`，`resultMsg="群ID不合法。"`，`data.reasonText="群ID不合法。"`，`data.retryable=true`。
  - 页面按只读详情失败兜底展示 `{}`。

## 结论

- 前端代理、token 传递、入口保留和只读兜底策略均按预期工作。
- 仍未打通的是后端对 `roomId=OpenIM groupID` 的兼容：当前群业务接口大多 HTTP 200，但业务体返回参数校验失败或群 ID 不合法。
- 控制台 error 复查为 0，页面没有未处理异常。
- 根据用户要求，后续仍保留群业务入口，等待后端调整接口契约后再用真实浏览器复测成功数据。
