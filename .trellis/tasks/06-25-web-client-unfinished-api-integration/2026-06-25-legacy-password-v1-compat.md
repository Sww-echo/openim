# 2026-06-25 旧密码 v1 接口兼容接入

## 接口

- `/user/password/reset/v1`
- `/user/password/update/v1`

## Swagger 核对

- `/user/password/reset/v1` 必填：
  - `serial`
  - `randcode`
  - `telephone`
  - `newPassword`
- `/user/password/reset/v1` 可选：
  - `areaCode`
  - `rsaPublicKey`
  - `rsaPrivateKey`
  - `dhPublicKey`
  - `dhPrivateKey`
  - `mac`
- `/user/password/update/v1` 必填：
  - `oldPassword`
  - `newPassword`
- `/user/password/update/v1` 可选：
  - `param`

## 实现

- `src/api/login.ts` 新增 `settleAtLeastOneAuthRequest()`。
- 找回密码流程继续保留 `/user/password/reset`，并联调用 `/user/password/reset/v1`。
- 修改密码流程继续保留 `/user/password/update`，并联调用 `/user/password/update/v1`。
- 新旧接口至少一个成功即认为业务请求成功。
- 未引入 RSA/DH 等前端未持有参数，避免伪造安全字段。

## 验证

- 已静态确认新增路径和调用点存在。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 159。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查。
- 未做真实找回密码/修改密码浏览器复测。
