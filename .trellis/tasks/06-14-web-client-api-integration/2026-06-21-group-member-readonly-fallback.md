# 2026-06-21 群成员只读列表兜底

## 背景

- 群资料卡、群设置成员列表和部分选择器共用 `useGroupMembers` 读取群成员。
- 该 hook 先尝试 businessApi `/room/openim/members`，再回退 OpenIM SDK 成员列表。
- 原逻辑中 businessApi 失败会写 `console.warn`，SDK 也失败时会触发用户级错误 toast。该入口是只读列表，在后端 `roomId` 契约兼容期不应污染页面错误提示。

## 本轮调整

- `src/hooks/useGroupMembers.ts`
  - businessApi `/room/openim/members` 失败从 `console.warn` 降为 `console.debug`。
  - SDK 成员列表也失败时不再 `feedbackToast`，改为 `console.debug` 并保持空态。
  - 刷新读取失败时清空列表并停止分页；非刷新读取失败时保留已有列表。
- 群成员备注、禁言/解禁、设/取消管理员等 mutation 逻辑位于 `GroupMemberList`，本轮未改，仍保留确认框和错误提示。

## 真实浏览器复测

- 打开真实浏览器：
  - `#/contact/myGroups`
  - 点击群资料卡。
- 页面显示群 `橙子皮、橙子皮1、橙子皮4`，成员数 3，并展示 3 个成员。
- 网络请求确认：
  - `POST /business-api/room/openim/members?pageIndex=0&pageSize=100&roomId=3413653759&access_token=...` 返回 200。
- Playwright console error 复查：0 errors。

## 结论

群成员查看继续优先走 businessApi，失败时回退 SDK；两侧失败时空态兜底，不再把只读读取失败升级为用户级错误。写操作仍需用户确认后才触发。

本轮未触发备注、禁言、解禁、设管理员、邀请、踢人、转让或其他 mutation；未运行单元测试、构建或验证脚本。
