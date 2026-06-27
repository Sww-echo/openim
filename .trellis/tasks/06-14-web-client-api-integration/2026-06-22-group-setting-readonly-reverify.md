# 2026-06-22 群设置只读入口复测

## 范围

- 使用真实浏览器继续复测本地服务 `http://127.0.0.1:7777`。
- 登录账号：`18888888888 / czp0422+`。
- 页面：`#/chat/sg_3413653759`。
- 本轮目标是群设置抽屉里的只读入口，不做群设置保存、审核处理、删除、退出、清空等写操作。

## 已确认

- 群设置抽屉可以打开。
- 当前账号在该群只展示普通成员可见入口：
  - 群公告
  - 群二维码
  - 在线成员
- 未展示管理员入口：
  - 入群审核
  - 特殊成员
  - 群助手
- 群二维码可能触发远端二维码生成，本轮未点击。

## 只读接口结果

- 群公告：
  - 请求：`POST /business-api/room/openim/notices?pageIndex=0&pageSize=20&roomId=3413653759&access_token=...`
  - HTTP 200。
  - 业务体：`resultCode=1010101`，`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`。
  - 页面展示空态 `未搜索到相关结果`。
- 在线成员：
  - 请求：`POST /business-api/room/openim/online-members?pageIndex=0&pageSize=100&roomId=3413653759&access_token=...`
  - HTTP 200。
  - 业务体：`resultCode=1010101`，`resultMsg="请求参数验证失败，缺少必填参数或参数错误"`。

## 风险记录

- 浏览器网络列表出现一次 `POST /business-api/room/openim/member/clear-message?roomId=3413653759&access_token=...`。
- 该请求返回 HTTP 200，但业务体为 `resultCode=1010101`，未成功清空。
- 源码中 `clearGroupMessages` 当前有 `modal.confirm` 二次确认保护，且业务清空失败后不会继续执行 SDK 本地清空。
- 由于本轮目标是只读复测，后续继续避免点击设置抽屉中靠近“清空聊天记录”的行；如需完整验证清空逻辑，必须由用户单独明确确认。

## 结论

- 群设置只读入口继续按 `/business-api` proxy 发起请求。
- 当前失败仍指向后端未兼容 OpenIM `groupID` 作为业务 `roomId`。
- 前端保留入口和空态兜底策略符合用户要求；管理员入口因当前账号权限不可见，仍需具备群主/管理员权限的账号复测。
