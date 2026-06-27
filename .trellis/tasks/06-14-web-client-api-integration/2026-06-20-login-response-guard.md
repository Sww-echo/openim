# 2026-06-20 登录/注册响应令牌防护

## 背景

- `/account/login`、`/account/register` 成功响应必须包含业务 `access_token`、OpenIM token 和 OpenIM userID，前端才能保存账号态并进入聊天页。
- `normalizeIMProfile` 此前会在字段缺失时抛出英文技术错误，但登录/注册页面成功回调没有显式捕获该异常，可能导致页面静默停留。

## 调整

- `normalizeIMProfile` 缺少必要字段时抛出 i18n 文案 `toast.invalidLoginResponse`。
- `normalizeOpenIMTokenProfile` 缺少必要字段时抛出 i18n 文案 `toast.invalidOpenIMTokenResponse`。
- 登录成功回调中捕获 `setIMProfile/normalizeIMProfile` 异常并通过 `feedbackToast` 展示。
- 注册成功回调中捕获 profile 保存异常并展示错误；注册成功提示改为 profile 保存成功后再展示，避免“接口成功但 token 缺失”时误导用户。

## 验证

- 本轮只做源码静态复核和登录页 HTTP 只读复核。
- 未运行单元测试、构建或验证脚本。
- 未触发真实登录、注册或其他 mutation。
