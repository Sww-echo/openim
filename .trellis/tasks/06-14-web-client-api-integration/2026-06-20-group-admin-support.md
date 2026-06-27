# 2026-06-20 群管理员接口支持性与接入

## 结论

- 最新 `docs/openim-swagger.json` 没有提供新的用户端 `/room/openim/member/set-admin` 接口。
- Swagger 明确存在旧用户端接口 `/room/set/admin`，summary 为“设置/取消 管理员”，参数为：
  - `roomId`：必填，query string。
  - `touserId`：可选，query integer，文档拼写为 `touserId`，代码按原拼写传参。
  - `type`：可选，query integer，文档说明 `1=创建者、2=管理员、3=成员`。
- Swagger 也存在 `/console/enterprise/rooms/member/set-admin` 与 `/console/platform/rooms/member/set-admin`，但两者需要 `confirmToken`，属于后台/平台接口，不纳入本次 Web 用户端接入。

## 本次接入

- `src/api/group.ts`
  - 新增 `setBusinessGroupAdmin`，封装 `/room/set/admin`。
  - 只暴露 `type=2` 设管理员、`type=3` 取消管理员，不在 Web 用户端开放 `type=1` 创建者写入。
- `src/pages/chat/queryChat/GroupSetting/GroupMemberList.tsx`
  - 群主可对普通成员执行“设为管理员”。
  - 群主可对管理员执行“取消管理员”。
  - 群主不能对自己或群主成员执行该动作。
  - 角色判断统一转成数字后比较，兼容后端/SDK 返回 `"100"`、`"60"` 这类字符串角色值时的权限判断。
  - 所有实际写操作仍由二次确认后触发。
- `src/i18n/resources/zh.json`、`src/i18n/resources/en.json`
  - 补齐取消管理员与确认框文案。

## 风险边界

- 该能力由旧 `/room/set/admin` 支持，不是 OpenIM 桥接命名空间接口；当前按 Swagger 现有用户端契约接入。
- 本轮未接后台 `/console/**` 管理员接口。
- 本轮未触发真实设管理员/取消管理员 mutation，浏览器复测仅做页面只读验证。
