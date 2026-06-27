# 2026-06-20 覆盖清单对齐

## 背景

- `scripts/verify-web-api-coverage.mjs` 的 `expectedWebApiPaths` 仍停留在早期 Web 接入清单，未覆盖当前已经接入的系统公告、群助手、群二维码、群共享、文件资源扩展、群成员禁言/解禁、管理员设置等接口。
- 该脚本虽本轮不运行，但属于 Trellis 任务已有的接口覆盖清单产物；清单滞后会误导后续源码级覆盖判断。

## 调整

- 将当前 `src/api/**` 已封装且属于 Web 用户端范围的 Swagger 路径补入 `expectedWebApiPaths`。
- `room/openim/qr/create|resolve|join` 已存在于最新 Swagger，改为正式期望接口，不再放在 `allowedSourceOnlyPaths`。
- 移除旧 `/account/password/change`、`/account/password/reset` 的非 Swagger 例外；当前找回/修改密码已使用最新 `/user/password/reset`、`/user/password/update`。
- `allowedSourceNotInSwaggerPaths` 仅保留既有 RTC `/user/rtc/get_token`，该能力已记录为非本次 Web 首期强迁范围。

## 边界

- 本轮未运行 `npm run verify:web-api-coverage` 或任何验证脚本。
- 未运行单元测试、构建。
- 未触发真实登录、发送、上传、下载、删除、审核、清空、退出、转让、设管理员等 mutation 或下载动作。
