# 2026-06-25 `/user/report` 接入

## 背景

Swagger 中 `/user/report` 用于举报其它用户或群组，参数包含 `toUserId`、`roomId`、`webUrl`、`reason`、`reportType`、`reportInfo`。该接口属于用户端操作，现有用户资料卡和群设置抽屉有自然入口。

## 实现

- 新增 `src/api/report.ts`：
  - `reportBusinessTarget()` 调用 `/user/report`。
  - 支持用户举报和群举报。
  - 缺少 `toUserId` 和 `roomId` 时阻断调用。
- 用户资料卡：
  - 非自己用户显示“举报”按钮。
  - 提交前输入举报原因，空原因不提交。
  - 调用 `/user/report`，传 `toUserId/reportType=1/webUrl/reason`。
  - 如果从群成员卡片进入，额外传 `reportInfo=groupID:<groupID>`。
- 群设置：
  - 已加入群时显示“举报群组”入口。
  - 提交前输入举报原因，空原因不提交。
  - 调用 `/user/report`，传 `roomId/reportType=2/webUrl/reason`。

## 验证

- 本轮只做静态核对。
- 未新增或修改单元测试。
- 未运行单元测试。
- 浏览器复测待 dev server 可用后执行，重点观察：
  - 用户资料卡举报是否发起 `/business-api/user/report`。
  - 群设置举报是否发起 `/business-api/user/report`。
  - 参数是否包含目标用户或群、`reason`、`webUrl` 和 `reportType`。
