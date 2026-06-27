# 2026-06-25 好友手机号备注接入

## 接口

- `/friends/modify/phoneRemark`

## Swagger 核对

- 接口属于好友管理相关接口。
- 必填参数：`toUserId`。
- 可选参数：`phoneRemark`，描述为“手机号备注 ; 分割”。

## 实现

- `src/api/friend.ts` 新增 `updateFriendPhoneRemark()`。
- 好友资料卡新增“手机号备注”字段。
- 该字段仅在好友资料卡中展示和编辑，不影响个人资料卡、非好友资料卡。
- 好友昵称备注继续走 `/friends/remark` 和 OpenIM SDK `updateFriends()`。
- 手机号备注单独走 `/friends/modify/phoneRemark`，不复用昵称备注接口，避免语义混淆。
- 新增中英文文案：
  - `placeholder.phoneRemark`
  - `placeholder.confirmUpdateFriendPhoneRemark`

## 验证

- 已静态确认新增路径、封装、资料卡调用点和 i18n 文案存在。
- 已静态确认中英文 JSON 可解析。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 152。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查；当前 Node/npm 执行仍受环境权限限制。
- 未完成真实浏览器编辑手机号备注复测，待登录后在好友资料卡触发。
