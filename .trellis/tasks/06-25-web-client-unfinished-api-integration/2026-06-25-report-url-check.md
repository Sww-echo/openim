# 2026-06-25 举报 URL 预检接口接入

## 接口

- `/user/checkReportUrl`

## Swagger 核对

- 接口属于用户操作。
- 可选参数：`webUrl`。

## 实现

- `src/api/report.ts` 新增 `checkReportUrl()`。
- `reportBusinessTarget()` 内部在提交 `/user/report` 前尝试调用 `/user/checkReportUrl`。
- 现有用户举报、群举报入口无需改动，继续统一走 `reportBusinessTarget()`。
- 预检失败只写 `console.debug`，不阻断 `/user/report` 主提交链路，避免预检接口异常导致举报不可用。

## 验证

- 已静态确认新增路径、封装和现有举报调用链路存在。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 157。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查。
- 未完成真实浏览器举报提交复测，待登录后在用户资料卡或群设置中触发。

## 修复记录

- 2026-06-25：修复 `src/api/report.ts` 中旧实现残留的重复 `params` 代码块，避免语法报错。
