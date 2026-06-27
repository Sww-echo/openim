# 2026-06-25 当前状态文档企业号对齐

## 范围

本轮继续对齐固定企业号当前契约，清理根目录当前状态文档中的错误企业号描述。用户明确说明 `DEFAULT_ENTERPRISE_CODE = "LOCALTEST001"` 是其主动修改且正确的当前配置。本轮不触发任何真实登录、注册、验证码、企业号校验或其它接口请求。

## 已处理

- `WEB_API_INTEGRATION_STATUS.md`
- `WEB_API_INTEGRATION_DELIVERY_STATUS.md`
- `WEB_API_INTEGRATION_PROGRESS.md`
- `WEB_API_INTEGRATION_REPORT.md`

上述根目录当前状态/交付/进度/报告文档已把固定企业号恢复为 `LOCALTEST001`，并更新文档日期为 `2026-06-25`。

## 边界

- 未修改 `e2e/**` 或任何测试文件，遵守“不走单元测试、不修改单元测试相关内容”的当前项目约束。
- 早期 Trellis 真实浏览器复测记录继续保留历史请求事实，不作为当前有效契约。
- 当前有效契约以 `src/api/login.ts` 的 `DEFAULT_ENTERPRISE_CODE = "LOCALTEST001"` 和根目录最新状态文档为准。

## 验收状态

- 本轮未运行单元测试、构建、覆盖检查或验证脚本。
- 本轮未打开浏览器，也未触发任何真实接口请求。
- 当前只完成文档状态对齐。
