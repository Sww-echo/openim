# 2026-06-19 日志上传确认保护

## 背景

继续审计 Web 用户端接入过程中可能直接触发真实远端动作的入口。`About Us` 中的日志上报使用 OpenIM SDK `uploadLogs`，不是本期 Swagger 业务接口主线，但属于真实上传动作，按当前联调约束需要用户二次确认后再执行。

## 处理

- `src/layout/LeftNavBar/About.tsx`
  - 保留现有 `tryLogReport` 上传逻辑、进度监听和上传结果提示。
  - 新增 `confirmLogReport`，使用现有 `modal.confirm` 展示确认框。
  - `Report log` 和 `Report specific log` 的最终提交都改为确认框 `OK` 后才调用 `IMSDK.uploadLogs`。
  - 取消确认框时不上传日志。
- 文案复用已有 `placeholder.confirmUploadFile`，未新增 i18n key。

## 验证

- 本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。
- 当前改动仅静态核对：上传调用只保留在确认框 `onOk` 后，未触发真实日志上传。

## 范围说明

该项不改变 Swagger Web 用户端接口接入范围，只补齐现有 SDK 诊断上传入口的确认保护。
