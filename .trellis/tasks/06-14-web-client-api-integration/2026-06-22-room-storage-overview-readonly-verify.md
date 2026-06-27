# 2026-06-22 群文件容量概览只读复测

## 范围

- 本轮只复测群聊聊天资源里的只读入口：
  - 群共享文件列表。
  - 群文件容量概览。
- 不触发上传、下载、删除、发送、群共享新增/删除、审核或群设置保存。

## 浏览器状态

- 本地 `127.0.0.1:7777` 一度未监听，已重新启动 `npm run dev:web`。
- 使用用户指定账号 `18888888888 / czp0422+` 重新登录。
- 页面：`http://127.0.0.1:7777/index.html#/chat/sg_3413653759`
- 群名：`橙子皮、橙子皮1、橙子皮4`
- 群成员数：3

## 请求结果

- 打开群聊资源弹窗后，`收藏消息` 列表先按默认 Tab 读取：
  - `POST /business-api/message/favorites?pageIndex=0&pageSize=50&deleted=0&access_token=...`
  - HTTP 200。
- 切换 `群共享文件` Tab：
  - `GET /business-api/room/openim/shares?pageIndex=0&pageSize=50&userId=0&roomId=3413653759&access_token=...`
  - HTTP 200。
  - 页面展示空态 `未搜索到相关结果`。
- 点击 `容量概览`：
  - `POST /business-api/file/storage/room-overview?roomId=3413653759&access_token=...`
  - HTTP 200。
  - 响应体：
    - `resultCode=0`
    - `resultMsg="群ID不合法。"`
    - `data.reasonText="群ID不合法。"`
    - `data.retryable=true`
  - 前端弹窗展示 `{}`，按只读详情兜底处理，没有弹用户级错误 toast。

## 结论

- 前端入口保留，且群资源只读失败不会污染用户级错误提示。
- 后端仍未兼容 OpenIM `groupID=3413653759` 作为 `/file/storage/room-overview` 的业务 `roomId`。
- 该问题与此前 `/room/openim/**` 的 `roomId=OpenIM groupID` 契约风险一致，等待后端接口实现调整后再复测。
- 本轮 Playwright console error 复查为 0；未触发任何真实 mutation。
