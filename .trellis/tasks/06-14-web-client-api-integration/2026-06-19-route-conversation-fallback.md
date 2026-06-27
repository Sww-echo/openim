# 2026-06-19 会话路由 SDK 兜底同步

## 背景

上一轮已修复 `#/chat/:conversationID` 直达或刷新后被布局层重定向的问题，并补充了从 `conversationList` 同步 `currentConversation` 的逻辑。继续复核时发现该同步仍依赖会话列表已经加载；如果目标会话暂未进入列表，详情页可能只按 URL 加载消息，头部和设置入口仍缺少完整会话状态。

## 处理

- `src/pages/chat/queryChat/useConversationState.ts`
  - 新增 `getRouteConversationSource`：
    - `sg_${groupID}` 解析为 `SessionType.Group + groupID`。
    - `si_${userA}_${userB}` 根据当前 `selfInfo.userID` 解析出对端用户 ID。
  - URL 会话同步流程调整为：
    - 优先从 `conversationList` 命中并同步当前会话。
    - 未命中时，按 URL 前缀解析 `sourceID/sessionType`，再通过 OpenIM SDK `getOneConversation` 只读获取会话对象。
    - 拿到会话对象后复用 `updateCurrentConversation`，继续触发已有群资料/当前成员加载和后续 businessApi 接入链路。
  - 同步仍要求 `syncState !== "loading"` 且当前用户 `selfInfo.userID` 存在，避免过早用空用户 ID 查询群成员。

## 真实 Chrome 复测

- 群聊直达：
  - 打开 `http://127.0.0.1:7777/index.html#/chat/sg_4011035808`。
  - 页面保留在群会话，头部显示群名 `啊啊i` 和成员数 `3`。
  - 打开右上角设置后显示完整群设置，包括群 ID、群类型、群免打扰、置顶、清空聊天记录、群权限、消息销毁、阅后即焚、转让群和解散群入口。
- 单聊直达：
  - 登录态过期后先重新使用 `18888888888` 登录。
  - 打开 `http://127.0.0.1:7777/index.html#/chat/si_10000003_10000009`。
  - 页面保留在单聊会话，头部显示 `橙子皮4`。
  - 打开右上角设置后显示单聊设置，包括屏蔽会话、置顶、定期删除消息记录、加入黑名单和解除好友入口。

## 说明

本轮只执行登录和只读页面打开/设置抽屉查看，未触发发送消息、上传/下载文件、收藏、撤回、好友/群关系变更、群设置保存、清空消息、解散群等 mutation 或下载动作。

本轮没有运行单元测试、构建或验证脚本，未新增或修改测试文件。控制台仍有既有 React Router future flag warning、AntD `findDOMNode` warning 和 SDK 对象日志，不影响本轮结论。
