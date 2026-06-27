# 2026-06-20 群搜索详情兜底与提交去重

## 背景

- Trellis 记录中曾出现添加群组搜索已知群 ID 后参数校验错误，修正后仍有“弹窗停留在确认态，未打开群卡片”的历史现象。
- 当前群搜索走 `getBusinessGroupInfo(keyword)`，优先请求 `/room/openim/detail`，异常时才兜底 `/room/getRoom`。
- 如果 `/room/openim/detail` 返回成功但数据为空，旧逻辑不会继续尝试 `/room/getRoom`。
- 搜索弹窗同时存在 `form onSubmit`、确认按钮 `onClick` 和 `Input.Search onSearch`，存在一次用户操作触发重复查询的风险。

## 本次调整

- `src/api/group.ts`
  - `getBusinessGroupInfo` 先调用 `/room/openim/detail`。
  - 如果响应能归一化出群信息，直接返回。
  - 如果请求失败或响应为空，继续兜底调用 `/room/getRoom`。
- `src/layout/TopSearchBar/SearchUserOrGroup.tsx`
  - 群/好友搜索弹窗统一只通过 `<form onSubmit>` 调用 `searchData`。
  - 移除确认按钮上的重复 `onClick`。
  - 移除 `Input.Search onSearch`，避免回车触发表单提交时重复请求。

## 影响

- 群搜索只读链路能覆盖“新版详情接口成功但空数据，旧群详情接口可命中”的场景。
- 同一次搜索操作只发起一次查询，降低重复请求导致 loading 状态和弹窗状态不一致的概率。
- 不改变加群申请、发好友申请等 mutation 行为。

## 浏览器复测

- 按用户要求使用 Codex 连接的 Google Chrome。
- Chrome 扩展通道已连接，并用受控 Chrome 标签打开 `http://127.0.0.1:7777/index.html#/login`。
- 页面正常加载，控制台无 error。
- 本轮未登录、未触发搜索请求、未触发加群或好友申请 mutation。

## 说明

- 本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。
- 完整群搜索复测需要可用登录态和真实群数据；仍只做搜索和群卡片打开，不点击加群申请。
