# 2026-06-25 `/user/profile/metas` 与 `/user/profile/update` 接入

## 背景

Swagger 中 `/user/profile/metas` 用于用户资料编辑元信息，`/user/profile/update` 用于用户资料扩展字段更新。现有 Web 端已有“编辑资料”弹窗，适合承载这一组接口。

## 实现

- 新增 `src/api/profile.ts`：
  - `getUserProfileMetas()` 调用 `/user/profile/metas`。
  - `updateUserProfile()` 调用 `/user/profile/update`。
- 编辑资料弹窗打开时读取 profile metas。
- 表单固定新增“个人简介”字段。
- 如果后端返回额外扩展字段元信息，则动态渲染为输入项。
- 保存时保留原 `/user/update` 基础资料更新。
- 基础资料保存成功后尝试调用 `/user/profile/update` 同步扩展资料。
- `/user/profile/update` 失败只写 `console.debug`，不阻断原基础资料保存，避免后端扩展资料契约不稳定影响现有主流程。

## 验证

- 本轮只做静态核对。
- 未新增或修改单元测试。
- 未运行单元测试。
- 浏览器复测待 dev server 可用后执行，重点观察：
  - 打开编辑资料时是否请求 `/business-api/user/profile/metas`。
  - 保存资料时是否在 `/user/update` 后尝试 `/business-api/user/profile/update`。
