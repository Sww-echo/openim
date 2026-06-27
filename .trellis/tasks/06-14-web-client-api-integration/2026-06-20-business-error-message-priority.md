# 2026-06-20 业务错误提示优先级收敛

## 背景

- PRD 要求 IP 限制和宵禁限制能在登录阶段展示明确提示。
- 当前 Web 不直接接后台 `/console/**/security/**`，登录限制提示依赖 `/account/login` 等业务接口返回的错误文本。

## 调整

- `src/api/errorHandle.ts` 增加 `errDlt` 兜底，并继续优先展示 `errMsg/resultMsg/msg` 等业务响应字段。
- `src/utils/common.ts` 的 `feedbackToast` 调整错误文本优先级：先取 `resultMsg/errMsg/msg/errDlt`，最后才取通用 `message`。

## 影响

- 登录、企业号校验、业务操作失败时更容易展示后端给出的明确业务原因。
- 网络错误或普通 `Error` 仍会回退到 `message`，不影响现有本地异常提示。
- 本轮未运行单元测试、构建或验证脚本，未触发真实登录、注册、发送、上传、下载、删除、审核或其他 mutation。
