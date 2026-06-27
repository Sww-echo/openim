# 2026-06-19 个人资料保存确认保护

## 背景

继续审计资料类写操作入口时，发现个人信息卡片中的 `Edit profile` 表单在校验通过后会直接调用 `/user/update`。

个人资料更新会修改远端用户资料，属于明确 mutation，应与个人头像上传、好友备注、群成员备注和群设置保存保持一致：先展示确认框，用户点击 `OK` 后才提交。

## 处理

- `src/pages/common/UserCardModal/EditSelfInfo.tsx`
  - 引入全局 `modal`。
  - `onFinish` 不再直接调用 `updateBusinessUserInfo`。
  - 表单校验通过后先展示确认框。
  - 只有确认框 `OK` 后才调用 `/user/update`，成功后继续同步本地 `selfInfo`、刷新用户卡片并关闭弹窗。
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmUpdateSelfInfo`: `Save this profile information?`
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmUpdateSelfInfo`: `确认保存这份个人资料吗？`

## 真实 Chrome 复测

- 使用真实 Chrome 插件新建受控标签页，登录账号 `18888888888 / czp0422+`。
- 点击左侧头像打开个人菜单。
- 点击 `My Information` 打开个人信息卡片。
- 点击 `Edit profile` 打开编辑资料弹窗。
- 保持当前资料原值，点击 `Confirm`。
- 页面弹出确认框：
  - 标题：`Save`
  - 内容：`Save this profile information?`
  - 按钮：`Cancel`、`OK`
- 未点击 `OK`；取消后确认框关闭，编辑资料弹窗仍停留在原表单状态。

## 说明

本轮没有运行单元测试、构建或验证脚本，也没有新增或修改测试文件。浏览器复测只打开确认框并取消，没有提交 `/user/update`。
