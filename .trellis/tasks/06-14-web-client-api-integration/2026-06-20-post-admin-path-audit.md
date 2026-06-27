# 2026-06-20 管理员接入后业务路径反扫

## 扫描范围

- Swagger：`docs/openim-swagger.json`
- 源码：`src/**/*.ts`、`src/**/*.tsx` 中通过 `businessRequest` 调用的静态业务路径。

## 结果

- 当前源码静态业务请求唯一路径数：107。
- 不在最新 Swagger 的路径仍只有：
  - `/user/rtc/get_token`，来源 `src/api/imApi.ts`。
- 新增的 `/room/set/admin` 已存在于最新 Swagger，属于“群组接口”，summary 为“设置/取消 管理员”。

## 契约判断

- `/room/set/admin` 的 Swagger 参数为 `roomId/touserId/type`，其中 `touserId` 为文档原始拼写，代码保持该拼写传参。
- Web 端封装层强制传 `touserId` 和 `type`，避免文档虽标可选但实际操作缺少目标成员或目标角色。
- 后台 `/console/enterprise/rooms/member/set-admin`、`/console/platform/rooms/member/set-admin` 仍不接入，因为它们属于后台/平台接口且要求 `confirmToken`。

## 复测边界

- 本轮不运行单元测试、构建或验证脚本。
- 真实设管理员/取消管理员是远端 mutation，本轮不点击确认提交。
- 浏览器只读快照：
  - URL：`http://127.0.0.1:7777/index.html#/login`
  - 页面标题：`OpenCorp-Base`
  - 控制台：0 errors，1 warning（既有 npm project config warning）
