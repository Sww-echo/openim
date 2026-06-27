# `src/api/report.ts` 类型报错修复

## 变更

- 为 `normalizeReportParams()` 增加显式返回类型 `NormalizedReportBusinessTargetParams`。
- 将 `webUrl`、`reason`、`reportInfo` 的归一化结果提取为局部变量，避免条件 spread 导致返回对象类型推断不稳定。
- 保留 `/user/checkReportUrl` 预检失败不阻断 `/user/report` 主链路的既有行为。

## 验证

- 静态检查 `src/api/report.ts` 未发现冲突标记。
- 静态确认 `reportBusinessTarget`、`checkReportUrl`、`ReportTargetType` 导出仍被现有举报入口正常引用。
- 未运行单元测试，符合当前项目约束。
- `tsc --noEmit` 未能执行：当前 shell 不能访问工作区外 Node，提权执行被审批器拒绝。
