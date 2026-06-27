# 2026-06-19 直达会话上下文稳定性修正

## 背景

继续推进 Web 端接口接入验收时，发现直达或刷新 `#/chat/sg_xxx` 这类群会话路由时，`currentConversation/currentGroupInfo/currentMemberInGroup` 恢复存在时序风险：

- `useConversationState` 只等待 `syncState !== loading`，但 SDK 登录中的 `isLogining` 不是阻断条件。
- 如果 SDK 仍在登录，路由恢复会提前调用 `IMSDK.getOneConversation`，失败后页面可能短时间缺少当前会话上下文。
- 群设置、群成员、群资源和群管理入口依赖当前会话与群详情；上下文不稳定会影响 businessApi `roomId` 提取和后续浏览器验收。

## 处理

- `src/pages/chat/queryChat/useConversationState.ts`
  - 路由会话恢复增加 `isLogining` 阻断，等 SDK 登录完成后再反查会话。
  - 群会话 `sg_` 路由不再强制等待 `selfID`；单聊 `si_` 仍需要 `selfID` 才能解析对端用户。
- `src/store/conversation.ts`
  - `updateCurrentConversation` 先写入 `currentConversation`，再异步补群详情和当前群成员，避免群页面初始阶段拿不到当前会话。
  - 切换到新会话或非群会话时清空旧的 `currentGroupInfo/currentMemberInGroup`，避免旧群业务 `roomId` 短暂残留。

## 验证

- 本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。
- 已做源码级核对：
  - 群路由恢复可在 SDK 登录完成后重试。
  - 群路由解析不再被 `selfID` 阻断。
  - 新会话切换会先落当前会话，再补充群业务上下文。
- Chrome 扩展连接恢复后，使用 Codex 连接的 Google Chrome 复测通过：
  - 打开 `http://localhost:7777/index.html#/login`，使用测试账号登录成功进入 `#/chat`。
  - 直达 `http://localhost:7777/index.html#/chat/sg_3413653759` 后未回登录页，群会话正常渲染群名、成员数 `3`、历史消息和发送区。
  - 打开右上角群设置抽屉，成员列表、`GroupID 3413653759`、群免打扰、置顶、清空聊天记录等入口正常显示。
  - 点击群成员区 `Add` 可打开邀请成员选择弹窗，显示 `Invite / My Friends / Selected 0 / Cancel / Confirm`；随后点击 `Cancel` 关闭，未触发邀请确认或远端 mutation。
  - 控制台仅观察到既有 React Router future warning 和 AntD `findDOMNode` warning，未见新增业务接口参数错误或页面阻断。
