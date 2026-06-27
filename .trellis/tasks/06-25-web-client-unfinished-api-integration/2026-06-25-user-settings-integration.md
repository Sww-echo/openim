# 2026-06-25 `/user/settings` 与 `/user/settings/update` 接入

## 背景

旧任务中 `/user/settings`、`/user/settings/update` 被暂缓，原因是接口包含生活圈、地图、多点登录、关注、打招呼等大量非本期 Web 用户端字段，直接全量落 UI 会扩大范围。

本轮按 Web 用户端现有账号设置页收敛，只接入已经有文案和自然入口的“添加好友设置”。

## 实现

- 新增 `src/api/userSettings.ts`：
  - `getUserPrivacySettings()` 调用 `/user/settings`。
  - `updateUserPrivacySettings()` 调用 `/user/settings/update`。
  - 仅标准化当前会用到的 `friendsVerify`，保留 `phoneSearch/nameSearch/isTyping/isVibration/isShowMsgState` 类型字段作为后续明确入口时使用。
- 在账号设置页 `PersonalSettings` 中新增“添加好友设置”区块：
  - 读取 `/user/settings` 的 `friendsVerify`。
  - 开关“禁止添加我为好友”。
  - 打开时提交 `friendsVerify=2`。
  - 关闭时提交 `friendsVerify=1`。
  - 提交前弹二次确认。
- 同步更新 `selfInfo.allowAddFriend`，让本地用户资料状态与业务隐私设置保持一致。

## 未做

- 未接入生活圈屏蔽、地图、多点登录、客服模式、关注/粉丝、打招呼等非当前 Web IM 主线字段。
- 未新增或修改单元测试。
- 未运行单元测试。
- 未在浏览器中点击确认触发真实 `/user/settings/update`，仍待浏览器复测。
