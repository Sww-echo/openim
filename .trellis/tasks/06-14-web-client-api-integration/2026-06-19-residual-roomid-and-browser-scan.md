# 2026-06-19 残留 roomId 扫描与浏览器状态

## 处理

- 继续按 Web 用户端范围复扫 business `roomId` 与 OpenIM SDK `groupID` 混用风险。
- 扫描范围覆盖 `src/**` 中常见直传模式：
  - `roomId: currentConversation?.groupID`
  - `roomId: currentGroupInfo.groupID`
  - `roomId: member.groupID`
  - `roomId: message.groupID`
  - `roomId: groupID`
  - `extraData as string`
- 当前未发现新的残留直传点；上一轮修正后的 `ChooseModal` 群邀请、踢人、转让群主链路仍保持 `groupID` 与业务 `roomId` 分离。

## 浏览器状态

- Codex Chrome 扩展已能看到当前本地页面标签：
  - `http://localhost:7777/index.html#/chat/sg_3413653759`
  - `http://localhost:7777/index.html#/login`
- 之前可控标签已完成登录、直达群会话、群设置和邀请弹窗取消复测。
- 本轮继续复测聊天资源时，Chrome 扩展可见标签但 `tabs.get` 无法重新接管已有标签，返回可控标签列表为空；为避免反复新建标签干扰用户浏览器，本轮未继续执行页面点击。

## 待继续

- 下一轮浏览器可控标签恢复后，优先继续只读复测：
  - 群聊天资源弹窗：收藏消息、已保存合并消息、群共享文件、文件资源。
  - 群管理入口：如当前账号/群具备业务 `roomId` 和权限，再验证公告、入群审核、在线成员、特殊成员、群助手、群二维码只读打开。
- 仍不触发上传、下载、删除、审核、发送、邀请确认、群设置保存等远端 mutation，除非用户在动作前明确确认。
