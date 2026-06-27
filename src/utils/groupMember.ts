import { GroupMemberRole } from "@openim/wasm-client-sdk";

export const normalizeBusinessGroupMemberRoleLevel = (
  record: Record<string, unknown>,
  fallback?: GroupMemberRole,
) => {
  const role = Number(record.roleLevel ?? record.role ?? record.memberRole);

  if (role === GroupMemberRole.Owner || role === 1) {
    return GroupMemberRole.Owner;
  }
  if (role === GroupMemberRole.Admin || role === 2) {
    return GroupMemberRole.Admin;
  }
  if (role === GroupMemberRole.Normal || role === 3 || role === 4 || role === 5) {
    return GroupMemberRole.Normal;
  }

  return fallback;
};
