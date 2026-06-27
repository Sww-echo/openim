# 2026-06-25 修改密码旧密码校验预检接入

## 接口

- `/user/verify/password`

## Swagger 核对

- 接口属于用户操作。
- 必填参数：`password`。

## 实现

- `src/api/login.ts` 新增 `verifyBusinessPassword()`。
- 修改密码流程在提交 `/user/password/update` 与 `/user/password/update/v1` 前，先尝试调用 `/user/verify/password`。
- 调用参数复用页面已传入的 `currentPassword`，该值在当前页面中已经是 MD5 结果，不重复 hash。
- 预检失败只写 `console.debug`，不阻断后续密码修改主链路，避免旧预检接口异常导致现有修改密码不可用。

## 验证

- 已静态确认新增路径和调用点存在。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 161。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查。
- 未做真实修改密码浏览器复测。
