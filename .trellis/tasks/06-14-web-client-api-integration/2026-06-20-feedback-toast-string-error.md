# 2026-06-20 通用反馈提示字符串错误兼容

## 背景

- 多个已接业务接口调用方使用 `feedbackToast({ error: t("...") })` 传入本地化字符串错误，例如头像更新失败、同步失败等。
- `feedbackToast` 此前只从对象错误里读取 `resultMsg/errMsg/msg/errDlt/message`，字符串错误会被降级为通用“操作失败”。
- `feedbackToast()` 无参数成功调用时，因内部 `content` 初始化为空字符串，也可能显示空提示而不是“操作成功”。

## 调整

- `feedbackToast` 支持 `error` 为字符串时直接展示该字符串。
- `feedbackToast()` 无参数成功调用时回退到 `toast.accessSuccess`。
- 对象错误继续优先展示业务字段 `resultMsg/errMsg/msg/errDlt/message`。
- `errorHandle` 同步兼容字符串错误，避免 React Query `onError` 收到字符串时无提示。

## 影响

- 不改变任何业务接口调用时机或参数。
- 已接入的好友、群管理、文件、系统公告、头像上传等流程的成功/失败反馈更稳定。

## 验证

- 本轮只做源码静态复核和登录页 HTTP 只读复核。
- 未运行单元测试、构建或验证脚本。
- 未触发真实登录、上传、下载、删除、审核、群设置或其他 mutation。
