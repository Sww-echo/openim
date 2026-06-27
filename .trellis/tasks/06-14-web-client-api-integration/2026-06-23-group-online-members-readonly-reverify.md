# 2026-06-23 群在线成员只读复测

## 范围

- 仅复测 Web 用户端群设置中的 `在线成员` 入口。
- 使用真实浏览器访问本地 Web：`http://127.0.0.1:7777/index.html#/chat/sg_3413653759`。
- 登录账号：`18888888888 / czp0422+`。
- 未触发发送、上传、下载、删除、审核、保存、清空、退出群组等 mutation 或副作用动作。
- 未运行单元测试、构建、覆盖检查或验证脚本。

## 结果

- 群设置抽屉可打开。
- 当前普通成员账号可见入口：`群公告`、`群二维码`、`在线成员`。
- 点击 `在线成员` 后前端按预期发起：
  - `POST /business-api/room/openim/members?pageIndex=0&pageSize=100&roomId=3413653759`
  - `POST /business-api/room/openim/online-members?pageIndex=0&pageSize=100&roomId=3413653759`
- `/room/openim/online-members` HTTP 状态为 200。
- 响应业务体：

```json
{"currentTime":1782227376024,"resultCode":1010101,"resultMsg":"请求参数验证失败，缺少必填参数或参数错误"}
```

- 页面弹窗标题为 `在线成员`，展示空态 `未搜索到相关结果`。
- 浏览器 console error 复查为 0。

## 结论

前端入口、`/business-api` 代理、`access_token` 传递和只读空态兜底均已验证。当前不可展示在线成员数据的原因仍是后端未兼容 OpenIM `groupID=3413653759` 作为业务 `roomId`，与群公告、群详情、群共享文件、已读详情等接口的现象一致。

后续待后端兼容 `roomId=OpenIM groupID` 或提供业务 `roomId` 映射后，再用真实浏览器复测成功数据。
