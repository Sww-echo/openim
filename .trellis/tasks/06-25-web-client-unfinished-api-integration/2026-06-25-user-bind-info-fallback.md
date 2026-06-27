# 2026-06-25 用户绑定信息只读兜底接入

## 接口

- `/user/getBindInfo`

## Swagger 核对

- 接口无参数。
- 属于当前登录用户相关的只读绑定信息读取。

## 实现

- `src/api/friend.ts` 新增 `getBusinessUserBindInfo()`。
- `src/api/login.ts` 继续作为聚合出口导出该方法。
- 自己资料卡打开时，在 `selfInfo` 与 `/user/getUserInfo` 基础上尝试读取 `/user/getBindInfo`。
- 返回内容按现有 `unwrapFriendInfo()` 合并，用作手机号、邮箱等绑定资料补充。
- 读取失败只写 `console.debug`，不阻断资料卡展示。
- 未接入 `/user/bindingEmail`、`/user/bindingTelephone` 等写接口，因为当前没有完整验证码/绑定 UI。

## 验证

- 已静态确认新增路径、封装、聚合导出和资料卡调用点存在。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 160。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查。
- 未做真实浏览器资料卡复测。
