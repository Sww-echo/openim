# 2026-06-25 旧隐身/监控成员接口兼容接入

## 接口

- `/room/setInvisibleGuardian`

## Swagger 核对

- 接口属于群组接口。
- 必填参数：`roomId`。
- 可选参数：
  - `touserId`：被指定人。
  - `type`：`4` 设置隐身人，`-1` 取消隐身人，`5` 设置监控人，`0` 取消监控人。

## 实现

- `src/api/group.ts` 新增 `setLegacyInvisibleGuardian()`。
- 群设置里的“特殊成员”面板继续复用已有入口，不新增 UI。
- 设置隐身成员时，并联调用：
  - `/room/openim/member/set-special-role(role=4)`
  - `/room/setInvisibleGuardian(type=4)`
- 设置监控成员时，并联调用：
  - `/room/openim/member/set-special-role(role=5)`
  - `/room/setInvisibleGuardian(type=5)`
- 恢复普通成员时，根据当前角色选择旧接口取消类型：
  - 当前为隐身成员：`type=-1`
  - 当前为监控成员：`type=0`
  - 当前角色不可判断时不调用旧取消接口，避免误操作。
- 写操作继续使用“至少一个业务接口成功”策略，避免新旧接口契约差异阻断页面操作。

## 验证

- 已静态确认新增路径、封装和特殊成员面板调用点存在。
- 已静态确认未引入冲突标记。
- `src/api/**` 唯一业务路径数更新为 153。
- 未新增、未修改、未运行单元测试。
- 未运行构建或类型检查。
- 未完成真实浏览器特殊成员设置复测，待管理员/群主账号和稳定业务 `roomId` 后验证。
