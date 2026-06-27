# 2026-06-20 加群业务 type 参数契约修正

## 背景

继续按本地 `docs/openim-swagger.json` 复扫 Web 用户端接口时，确认 `src/api/**` 当前 104 个 businessRequest 封装没有 Swagger method mismatch。仅 `/user/rtc/get_token` 和 `/account/password/reset` 属于已知兼容路径，不在最新 Swagger。

进一步检查 Web 前缀未封装候选时，`/room/join` 已经接入，但页面调用参数存在业务语义差异：

- Swagger `/room/join` 参数：
  - `roomId` 必填。
  - `type` 可选，定义为 `1=自己的房间；2=加入的房间`。
- 群卡片加群入口此前传入 OpenIM SDK `GroupJoinSource.Search`，其值为 `3`。

这会把 SDK 的“入群来源”枚举误传给业务接口的“房间关系类型”字段。

## 本次处理

- `src/pages/common/GroupCardModal/index.tsx`
  - 移除 `GroupJoinSource` 引用。
  - 群卡片提交 `/room/join` 时改为传 `type: 2`，对齐业务文档“加入的房间”语义。

## 接口影响

- `/room/join`：仍只在用户进入群卡片申请页并确认发送后调用；本次只修正参数值，不改变二次确认保护。
- `reqMsg` 暂不传递：Swagger `/room/join` 当前未定义申请理由参数，仍按文档只传 `roomId/type`。

## 验证状态

本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。加群申请属于真实关系变更，本轮未在浏览器中点击确认发送；后续如需完整验证，需要用户明确确认后再触发 `/room/join`。
