# 2026-06-19 选择器和群设置写操作确认保护

## 背景

继续审计 Web 用户端写操作入口时，发现两个公共入口仍可能在用户点击后直接触发远端变更：

- `ChooseModal`：
  - 创建群会直接调用 OpenIM SDK `createGroup`。
  - 邀请入群会先调用业务 `/room/member/update`，再调用 SDK `inviteUserToGroup`。
  - 踢出群成员会先调用业务 `/room/member/delete`，再调用 SDK `kickGroupMember`。
  - 转让群主会先调用业务 `/room/transfer`，再调用 SDK `transferGroupOwner`。
  - 合并转发会调用 `/message/merge/forward-before` 并通过 SDK `sendMessage` 发送消息。
- 群设置抽屉：
  - 群名、群头像、群免打扰、群置顶、入群验证、已读状态、成员可见、允许加好友、允许邀请、允许上传文件、会议/讲课、消息销毁和阅后即焚开关等入口会触发 `/room/update`、`/room/openim/member/set-offline-no-push`、`/room/openim/member/set-top` 或 OpenIM SDK 设置。

这些都属于远端 mutation 或上传/发消息动作，需要与前面已处理的下载、备注、系统公告已读、申请处理保持一致：先展示确认框，用户点击 `OK` 后才提交。

## 处理

- `src/pages/common/ChooseModal/index.tsx`
  - 新增 `shouldConfirmChoose` 和 `getConfirmContent`，统一判断选择器提交是否需要确认。
  - 将原有提交逻辑拆为 `runChooseAction`，只在无需确认或确认框 `OK` 后执行。
  - 覆盖创建群、邀请入群、踢出群成员、转让群主、合并转发。
  - `SELECT_USER` 仍保持纯选择事件，不额外弹确认。
  - 创建群只选择 1 个好友时仍按原逻辑跳转单聊，不弹确认，因为该路径不创建群。
  - 创建群头像上传改为先弹 `Upload this file?`，确认后才调用 `uploadFile`。
- `src/pages/chat/queryChat/GroupSetting/GroupSettings.tsx`
  - 新增 `confirmUpdateGroupSetting`，统一保护群设置保存。
  - 群头像上传先弹确认，确认后才上传并保存群头像。
  - 群名编辑先弹确认，确认后才调用业务/SDK 更新。
  - 群免打扰、群置顶、群权限、成员可见、成员加好友、邀请/上传/会议/讲课、消息销毁和阅后即焚相关开关均先弹确认。
  - 数值型群设置继续复用同一个确认入口。
- `src/layout/LeftNavBar/index.tsx`
  - 个人头像上传先弹确认，确认后才压缩、保存本地临时文件、上传并调用用户资料更新。
- `src/i18n/resources/en.json`、`src/i18n/resources/zh.json`
  - 新增上传、创建群、邀请、踢人、转让、转发等确认文案。

## 真实 Chrome 复测

- 使用真实 Chrome 插件打开新受控标签页：`http://127.0.0.1:7777/index.html#/chat/sg_4011035808`。
- 页面保持登录态，进入群会话 `啊啊i`，头部显示成员数 `3`。
- 打开右上角群设置抽屉。
- 点击 `Group Verification` 开关后弹出确认框：
  - 标题：`Save`
  - 内容：`Save the current group setting?`
  - 按钮：`Cancel`、`OK`
- 未点击 `OK`；使用取消/关闭操作退出确认框。
- 确认框关闭后 `Group Verification` 仍保持原有 checked 状态，未提交群设置变更。
- 打开群头部 `Invite` 选择器，当前好友均已在群内，复选框禁用，无法在真实数据下选中成员触发邀请确认。
- 打开顶部 `Create Group Chat` 入口，群名输入正常；当前创建群选择器展开后未渲染可选好友数据，本轮未触发创建群确认框。

## 说明

本轮没有运行单元测试、构建或验证脚本，也没有新增或修改测试文件。浏览器复测只打开确认框并取消；没有点击任何 `OK`，没有触发 `/room/update`、`/room/member/update`、`/room/member/delete`、`/room/transfer`、文件上传、创建群或消息转发。

`ChooseModal` 的二级确认已经由源码收敛到统一入口，但完整真实浏览器验收仍需要一个存在可选目标成员/目标会话的数据场景；后续拿到真实可选数据后仍只先验证确认框，真正提交需用户单独确认。
