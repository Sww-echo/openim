# Research

## 来源

- 旧任务：`06-14-web-client-api-integration`
- Swagger：`docs/openim-swagger.json`
- 当前后端：
  - `businessApi: http://47.238.134.161:8092`
  - `openIMApiURL: http://47.238.134.161:10002`
  - `openIMWsURL: ws://47.238.134.161:10001`

## 已确认候选

### `/user/logout`

旧任务中暂缓原因：Swagger 要求 `deviceKey/devicekey/telephone(MD5)/access_token`，此前没有稳定 device key 来源，且不允许主动触发写操作。

当前变化：

- 用户授权测试数据可真实调用。
- Web 可以生成稳定本地 device key。
- 登录页已保存手机号，能够生成 `telephone=md5(phoneNumber)`。
- `businessRequest` 会自动追加 `access_token`。

结论：可优先接入正常手动退出链路，失败时继续本地退出，避免退出按钮不可用。

### `/room/add`

旧任务中暂缓原因：Swagger 暴露的是旧系统复杂 `room/member/notice/text/keys` query 参数结构，不适合直接替换当前 OpenIM SDK `createGroup`。

当前变化：

- 用户授权测试数据可真实调用。
- 可在保留 SDK 建群体验的基础上尝试业务建群前置或后置同步。

结论：作为第二阶段候选，需要先进一步读取参数并做小范围联调。

### `/user/getOnLine`

Swagger 定义：按 `userId` 获取用户在线状态。

当前代码现状：

- 用户资料卡已经聚合 SDK 用户资料、业务用户资料和好友资料。
- i18n 中已有“在线/离线”文案。
- 在线状态属于 Web 用户端查看资料时的轻量增强，只读接口，不需要新增大模块。

结论：适合接入到用户资料卡。接口失败不阻断资料展示；后端返回字段可能存在差异，因此只解析 `isOnline/online/onlineStatus/status` 等常见字段，无法判断时不展示。

浏览器复测状态：待确认。外部接口直连验证因网络提权审批器异常拒绝，未继续绕过。
