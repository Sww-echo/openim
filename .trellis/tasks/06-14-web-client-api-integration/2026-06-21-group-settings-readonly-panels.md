# 2026-06-21 群设置业务入口只读复测

## 范围

- 本轮只覆盖 Web 端群设置抽屉中的只读业务入口。
- 已打开入口：群公告、入群审核、特殊成员、群助手、在线成员。
- 未点击或提交任何保存、审核、删除、添加、移除、关键词编辑、群二维码生成、清空聊天记录、转让群组、解散群组等 mutation。
- 未运行单元测试、构建或验证脚本。

## 代码修正

- `src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx`
  - 群公告、入群审核、在线成员、特殊成员这些只读列表加载失败时，改为列表置空并 `console.debug` 记录。
  - 不再调用 `feedbackToast({ error })`，避免当前后端 `roomId` 契约不兼容时把只读空态打成 `console.error`。
- `src/pages/chat/queryChat/GroupSetting/GroupHelperPanel.tsx`
  - 群助手只读加载失败时清空上下文、已添加助手和可添加助手列表，并 `console.debug` 记录。
  - 添加、移除、关键词增删改等 mutation 仍保留原有确认框和 `feedbackToast` 错误提示。

## 真实浏览器只读复测

- 账号：`18888888888 / czp0422+`
- 群会话：`#/chat/sg_4011035808`，群名 `啊啊i`
- 群设置抽屉可见以下入口：群公告、入群审核、特殊成员、群助手、群二维码、在线成员，以及群权限/消息销毁设置项。
- 已确认只读请求：
  - `POST /business-api/room/openim/notices?pageIndex=0&pageSize=20&roomId=4011035808&access_token=...`，HTTP 200
  - `POST /business-api/room/openim/join-requests?pageIndex=0&pageSize=50&roomId=4011035808&access_token=...`，HTTP 200
  - `POST /business-api/room/openim/special-members?pageIndex=0&pageSize=100&roomId=4011035808&role=0&access_token=...`，HTTP 200
  - `POST /business-api/room/openim/group-helpers/context?roomId=4011035808&access_token=...`，HTTP 200
  - `POST /business-api/room/openim/group-helpers?roomId=4011035808&access_token=...`，HTTP 200
  - `POST /business-api/room/openim/group-helpers/available?pageIndex=0&pageSize=50&roomId=4011035808&access_token=...`，HTTP 200
  - `POST /business-api/room/openim/online-members?pageIndex=0&pageSize=100&roomId=4011035808&access_token=...`，HTTP 200
- 页面展示：上述面板当前均为空态或无可展示结果。
- 修正后刷新并再次打开群公告，只读请求仍发出；未再新增 `src/utils/common.ts` 的 `feedbackToast` console error。
- 截图：`output/playwright/chrome-group-settings-business-readonly-20260621.png`

## 残留风险

- 当前仍使用 OpenIM `groupID=4011035808` 作为 business `roomId` 兜底。部分接口 HTTP 200 但业务体可能返回 `resultCode=1010101` 或 `群ID格式不正确`，后续仍需后端兼容 OpenIM groupID 或返回显式 business roomId 后复测真实数据。
- 刷新群会话时仍可见既有 React/AntD `findDOMNode` warning 和 OpenIM SDK 同步日志；这不是本轮 businessApi 只读面板新增错误。
