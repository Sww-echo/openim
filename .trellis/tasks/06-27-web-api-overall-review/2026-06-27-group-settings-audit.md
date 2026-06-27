# 群聊设置功能排查记录

## 测试对象

- 页面：群聊设置抽屉
- 测试群：`codex-api-realign-1782496629149`
- OpenIM `groupID`：`2757436928`
- 业务 `roomId`：`6a3ebd7789552748667deb62`

## 已验证功能

- 设置抽屉：可打开，能加载群资料、成员入口和设置项。
- 群公告：列表接口正常；更新现有公告接口正常返回 200。
- 入群审核：列表接口正常返回空列表。
- 特殊成员：列表接口正常，能展示群助手特殊角色。
- 群助手：上下文、已添加助手、可添加助手接口正常，当前测试数据为空。
- 群二维码：生成接口正常返回短码；解析接口正常展示群信息。
- 在线成员：接口正常返回群助手和当前用户。
- 成员列表：查看更多可打开，成员列表接口正常返回 2 个成员。
- 邀请成员、移除成员、转让群组：选择弹窗可打开，未提交。
- 清空聊天记录、举报群组、解散群组：确认弹窗可打开，未执行破坏性操作。
- 群消息免打扰：修复后开启/恢复均能同步 UI，接口返回 200。
- 群聊置顶：修复后开启/恢复均能同步 UI，接口返回 200。

## 修复内容

- `群消息免打扰` 和 `群聊置顶` 现在以最新业务接口成功为准更新 UI 状态。
- OpenIM SDK 本地同步失败时降级为 `console.warn`，不再阻断业务接口已成功的设置状态。
- 同步更新 `currentGroupInfo.myMember.offlineNoPushMsg/top` 和 `currentConversation.recvMsgOpt/isPinned`。
- 最新接口文档未提供的群策略设置现在直接提示：`最新接口文档未提供该功能接口，当前暂不可用`，不再只显示泛化的 `修改群信息失败！`。

## 当前限制

- 以下群策略类配置在最新接口文档中没有对应更新接口，UI 会明确提示暂不可用：
  - 允许被搜索
  - 允许成员邀请好友
  - 允许成员修改群昵称
  - 允许成员分享群二维码
  - 允许查看在线状态
  - 允许成员上传文件
  - 允许成员私聊
  - 允许成员@全体
  - 允许成员创建公告
  - 允许成员发起会议
  - 允许成员开启讲课
  - 允许成员退出群组
  - 群消息撤回时限
  - 聊天记录保存时长
  - 定期删除消息记录及相关配置
  - 阅后即焚及相关配置

## 环境噪声

- 浏览器控制台仍可见 OpenIM SDK 侧错误：
  - `TypeError: Cannot read properties of null (reading 'map')`
  - `Getjoinedgrouplistpage RecordNotFoundError`
  - 偶发 WebSocket 断连或多端登录提示
- 这些错误会影响依赖 SDK 的操作，例如全员禁言、成员禁言、设管理员、群资料 SDK 同步等，需要单独作为 SDK/连接稳定性问题跟进。

## 验证命令

- `npx eslint --quiet "src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx" "src/pages/chat/queryChat/GroupSetting/useGroupSettings.tsx"`：通过。
- Chrome + Playwright：完成群设置抽屉、各面板、二维码、成员列表、确认弹窗、免打扰/置顶回归验证。

## 数据恢复

- 回归后后端详情确认：
  - `offlineNoPushMsg=0`
  - `top=0`
  - `limitSendSmg=-1`
