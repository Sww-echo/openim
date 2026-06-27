# 2026-06-19 群公告保存确认保护

## 背景

继续审计群管理写操作入口时，发现群公告列表中的删除、入群审核处理、特殊成员设置已经通过 `runConfirmedAction` 先弹确认框，但群公告编辑后的 `Save` 仍会直接调用 `/room/openim/notice/update`。

群公告更新会修改远端群公告内容，属于明确的远端 mutation，应与群公告删除、入群审核和群设置保存保持一致：用户确认后才提交。

## 处理

- `src/pages/chat/queryChat/GroupSetting/GroupBusinessEntrances.tsx`
  - `saveNotice` 从直接 `await updateOpenIMGroupNotice(...)` 改为复用 `runConfirmedAction`。
  - 只有确认框 `OK` 后才调用 `/room/openim/notice/update`。
  - 更新成功后仍清空编辑状态并复用原有 `reloadPanel()` 刷新列表。
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmUpdateGroupNotice`: `Are you sure you want to update this group announcement?`
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmUpdateGroupNotice`: `确认更新这条群公告吗？`

## 真实 Chrome 复测

- 使用真实 Chrome 插件新建受控标签页，登录账号 `18888888888 / czp0422+`。
- 登录后进入 `http://127.0.0.1:7777/index.html#/chat/sg_4011035808`。
- 打开群 `啊啊i` 的群设置抽屉。
- 当前真实群设置中只显示基础群设置、群免打扰、群置顶、清空聊天记录、群权限、消息销毁、转让群和解散群；没有渲染 `Group Announcements` 业务入口。
- 因当前真实群未渲染群公告入口，本轮无法在浏览器中点到公告 `Edit -> Save` 确认框。

## 说明

本轮没有运行单元测试、构建或验证脚本，也没有新增或修改测试文件。浏览器操作只包含登录、打开群会话和查看群设置；没有点击任何确认框 `OK`，没有提交 `/room/openim/notice/update` 或其他群管理 mutation。

源码核对已确认群公告保存动作现在只位于确认框 `onOk` 回调中。后续需要一个能渲染 `Group Announcements` 且包含可编辑公告数据的真实群，才能补做完整点击验收；届时仍只先验证确认框，真正提交需用户单独确认。
