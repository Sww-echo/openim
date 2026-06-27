# 2026-06-21 已读详情真实浏览器验收阻塞

## 代码现状

- `src/api/group.ts` 已封装 `getOpenIMMessageReadDetail`：
  - `POST /room/openim/message/read-detail`
- `src/pages/chat/queryChat/MessageItem/index.tsx` 已在群消息右键菜单中提供“已读详情”入口。
- 如果没有业务 `roomId`，当前实现会弹出空态，不强行请求业务接口。

## 本轮浏览器尝试

- 先在 `#/chat/sg_4011035808` 检查消息区，页面显示加载状态，未渲染可右键的消息节点。
- 控制台剩余错误来自 OpenIM SDK 增量群成员同步：
  - `/group/get_incremental_group_members_batch`
  - `500 ServerInternalError targetKeys is empty`
- 重新登录 `18888888888 / czp0422+` 后进入 `#/chat`，会话列表为空，仅显示“创建群聊”，没有可通过 UI 打开的群消息。
- 因缺少真实群消息节点，本轮未触发“已读详情”入口，也未请求 `/room/openim/message/read-detail`。

## 结论

已读详情属于“代码已接入，但当前浏览器数据状态未验收”。后续需要在真实浏览器中出现可右键的群消息后，再只读点击“已读详情”确认 `/business-api/room/openim/message/read-detail` 的参数和响应。

本轮未运行单元测试、构建或验证脚本；未触发发送、撤回、删除、下载、上传、审核或群设置保存等 mutation。
