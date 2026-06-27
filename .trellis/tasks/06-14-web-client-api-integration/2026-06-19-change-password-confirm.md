# 2026-06-19 修改密码确认保护

## 背景

继续按 Web 用户端接口接入任务审计真实写操作入口。账号设置里的修改密码会调用 `/user/password/update`，属于会影响真实账号登录状态的远端写操作。浏览器复测不得直接触发真实改密，因此提交表单后必须先展示二次确认。

## 处理

- `src/layout/LeftNavBar/PersonalSettings.tsx`
  - 保留现有修改密码表单、`modifyPassword` mutation、成功后退出登录逻辑。
  - 将 `mutate` 调用移动到 `modal.confirm` 的 `onOk` 回调。
  - 用户取消确认框时，不调用 `/user/password/update`，不退出登录。
- `src/i18n/resources/en.json`
  - 新增 `placeholder.confirmUpdatePassword`: `Change this password?`
- `src/i18n/resources/zh.json`
  - 新增 `placeholder.confirmUpdatePassword`: `确认修改当前密码吗？`

## 真实 Chrome 复测

- 已在真实 Chrome 扩展受控页打开 `http://127.0.0.1:7777/index.html#/chat/si_10000003_10000006`。
- 页面处于已登录态，进入 `Account Settings` -> `Change Password`。
- 输入占位旧密码 `dummyOld1` 和符合规则的新密码 `Aa123467` 后点击表单 `Confirm`。
- 页面弹出二次确认框：
  - 标题：`Change Password`
  - 内容：`Change this password?`
  - 按钮：`Cancel`、`OK`
- 未点击 `OK`，因此没有执行 `/user/password/update`，没有触发退出登录。
- 后续浏览器扩展会话被中断，取消按钮点击未形成稳定可复现记录；当前有效证据只证明“提交表单先弹确认框，未执行 OK”。

## 说明

本轮未新增或修改测试文件，未运行单元测试、构建或验证脚本。实现遵循当前项目已有 `modal.confirm` 模式，避免引入新的抽象。
