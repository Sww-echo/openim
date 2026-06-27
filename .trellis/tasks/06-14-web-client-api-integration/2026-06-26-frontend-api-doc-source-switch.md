# 2026-06-26 前端接口文档源切换

## 结论

- 后续 Web 用户端接口对接以 `docs/openim-frontend-api-doc.json` 为准。
- 不再使用 `docs/openim-swagger.json` 作为前端接口对接依据；该旧文件当前也不在 `docs` 目录中。
- 新文档来自 `view-source_47.238.134.161_8092_openim-swagger.html` 中内嵌的 `frontendApiGroups`、`genericResponseFields` 和 `responseFieldDocs`，未使用 `/v2/api-docs`。

## 文档统计

- groupCount：28
- operationCount：450
- uniqueOperationCount：433
- responseFieldDocCount：95

## 同步范围

- `.trellis/tasks/06-14-web-client-api-coverage/task.json` 已将 `relatedFiles` 和 `meta.apiDoc` 切换到 `docs/openim-frontend-api-doc.json`。
- `.trellis/tasks/06-14-web-client-api-integration/task.json` 已将 `relatedFiles` 和 `meta.apiDoc` 切换到 `docs/openim-frontend-api-doc.json`。
- `.trellis/tasks/06-25-web-client-unfinished-api-integration/task.json` 已将 `relatedFiles` 和 `meta.apiDoc` 切换到 `docs/openim-frontend-api-doc.json`。
- `scripts/verify-web-api-coverage.mjs` 已改为读取 `docs/openim-frontend-api-doc.json`，并从 `operations[].path` 生成接口路径集合。
- `scripts/verify-web-api-contract.mjs` 已改为读取 `docs/openim-frontend-api-doc.json`，并从 `operations[].parameters` 校验关键参数。

## 兼容说明

- 新前端联调文档不包含 `/room/list`、`/room/getRoom`、`/room/join` 等旧群接口。
- 这些旧接口只作为当前源码兼容保留项，不再作为新接口文档覆盖目标。
- 新前端联调文档包含 `/room/add`、`/room/openim/**`、`/friends/**`、`/file/**`、`/system/announcements/**` 等当前 Web 对接主线接口。
