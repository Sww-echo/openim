# 2026-06-20 群业务入口保留与 groupID 兜底

## 背景

- 此前为避免把 OpenIM `groupID` 误传给 businessApi `roomId`，对部分群业务入口做过显式业务 `roomId` 防护。
- 用户明确要求入口仍需保留，后续由后端调整接口实现兼容。
- 因此本轮策略调整为：显式业务 `roomId` 优先；拿不到显式值时，用当前 OpenIM `groupID` 作为 `roomId` 兜底传给 businessApi。

## 本轮调整

- 保留聊天头部群邀请入口，邀请参数 `roomId` 改为显式业务 `roomId || groupID`。
- 保留群设置中的添加/移除成员、群主转让、群业务入口，相关 `extraData.roomId` 改为显式业务 `roomId || groupID`。
- 保留聊天资源“群共享文件”Tab，查询 `/room/openim/shares` 时使用显式业务 `roomId || groupID`。
- 群成员列表、当前成员、群详情读取优先尝试 businessApi；当仅使用 `groupID` 兜底且业务成员列表为空或报错时，保留 SDK 只读兜底，避免当前页面成员展示被后端未兼容状态打空。
- 群消息发送前校验、文件上传上下文、群共享文件同步、消息收藏/撤回/已读详情等调用点统一使用显式业务 `roomId || groupID`。
- 群卡片和申请列表点击群卡片时也保留入口；业务详情接口失败时回退到已有 OpenIM/申请数据展示。

## 当前接口支持结论

- 使用账号 `18888888888 / czp0422+` 经本地 `/business-api` proxy 登录后，只读请求以下接口：
  - `/room/openim/detail?roomId=3413653759`
  - `/room/openim/members?pageIndex=0&pageSize=100&roomId=3413653759`
  - `/room/openim/members?pageIndex=0&pageSize=100&roomId=3413653759&keyword=10000003`
  - `/room/openim/shares?pageIndex=0&pageSize=50&userId=0&roomId=3413653759`
- 当前后端均返回 HTTP 200，但业务体为 `resultCode=1010101`、`resultMsg=请求参数验证失败，缺少必填参数或参数错误`。
- 结论：前端入口已按要求保留并发起 `groupID` 兜底请求；当前后端尚未兼容该 `roomId` 形态，后续需要后端实现支持后才能返回真实群详情、成员和共享文件数据。

## 浏览器复测

- 使用本机 Chrome + Playwright 打开 `http://127.0.0.1:7777/index.html#/chat/sg_3413653759`。
- 只读验证结果：
  - 聊天头部群邀请图标存在。
  - 聊天资源弹窗 Tab 包含“收藏消息 / 已保存合并消息 / 文件资源 / 群共享文件”。
  - 点击“群共享文件”Tab 后发起 `/business-api/room/openim/shares?...roomId=3413653759`。
  - 打开群设置后，“添加”成员入口存在，群公告/入群审核/在线成员等群业务入口存在。
- 本轮未运行单元测试、构建或验证脚本；未点击发送、上传、下载、删除、审核、清空、退出、转让、设管理员等真实 mutation 或下载动作。
