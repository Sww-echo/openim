# 2026-06-20 群申请卡片业务 roomId 防护

## 背景

- 通讯录群通知列表复用 `ApplicationItem` 展示群申请。
- 点击群申请卡片时，原逻辑直接使用 OpenIM `source.groupID` 调用 `getBusinessGroupInfo`。
- Swagger 中 `/room/openim/detail` 和 `/room/getRoom` 的 `roomId` 均为业务侧旧系统群 ID，不应直接传 OpenIM `groupID`。

## 本次调整

- `src/components/ApplicationItem/index.tsx`
  - 群申请卡片点击时，先从申请对象及其 `ex` 扩展中使用 `pickExplicitBusinessRoomId` 提取业务 `roomId`。
  - 只有解析到业务 `roomId` 时，才调用 `getBusinessGroupInfo(roomId)`。
  - 未解析到业务 `roomId` 时，直接用 OpenIM 申请对象中的 `groupID/groupName/groupFaceURL` 组装最小群卡片数据并打开卡片，不调用业务群详情接口。

## 影响

- 避免群通知只读查看路径把 OpenIM `groupID` 误传给业务群详情接口，减少“缺少必填参数或参数错误”类校验失败。
- 不改变同意/拒绝群申请的写操作路径；该路径仍由 `ApplicationItem` 统一确认框保护，确认后才调用业务审核兼容桥和 OpenIM SDK。

## 浏览器复测

- 按用户要求使用 Codex 连接的 Google Chrome。
- Chrome 扩展通道已连接，并新建受控 Chrome 标签打开 `http://127.0.0.1:7777/index.html#/login`。
- 页面正常加载，控制台无 error。
- 当前未登录、未进入群通知页、未触发群申请同意/拒绝或任何远端 mutation。

## 说明

- 本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。
- 完整群通知只读卡片验收仍需要当前账号存在真实群申请数据；同意/拒绝属于 mutation，必须由用户明确确认后再触发。
