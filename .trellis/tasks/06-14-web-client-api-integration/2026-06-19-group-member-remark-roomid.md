# 2026-06-19 群成员备注 roomId 修正

## 背景

继续复扫 business `roomId` 与 OpenIM `groupID` 混用风险时，发现群成员备注保存入口虽然已有二次确认保护，但实际调用 `/room/openim/member/remark/update` 时传入的是 `member.groupID`。

Swagger 中该接口的 `roomId` 是业务侧旧系统群 ID，不应直接使用 OpenIM SDK `groupID`。这与前面 `/room/openim/detail`、`/room/openim/members` 参数校验问题属于同类风险。

## 处理

- `src/pages/chat/queryChat/GroupSetting/GroupMemberList.tsx`
  - 引入当前群详情 `currentGroupInfo`。
  - 备注保存时优先从成员记录中提取显式业务 `roomId/roomID/jid/roomJid`。
  - 成员记录没有业务 roomId 时，再从当前群详情中提取业务 roomId。
  - 拿不到业务 roomId 时不调用 `/room/openim/member/remark/update`，避免把 SDK `groupID` 误传给业务接口。
  - 保留现有二次确认框，确认框 `OK` 后才执行保存动作。

## 验证

- 本轮未运行单元测试、构建或验证脚本，未新增或修改测试文件。
- 仅做源码级核对：`updateOpenIMMemberRemark` 的 `roomId` 参数已改为显式业务 roomId，取消了 `member.groupID` 直传。
- 真实浏览器完整验收仍需要一个当前账号可查看成员且具备群主/管理员权限的真实群；届时仍只先打开确认框，真正提交需用户单独确认。
