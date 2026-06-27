import { GroupMemberRole } from "@openim/wasm-client-sdk";
import { GroupMemberItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Button, Empty, Input, InputNumber, Modal, Spin } from "antd";
import { t } from "i18next";
import { FC, memo, useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { modal } from "@/AntdGlobalComp";
import { deleteOpenIMMemberRemark, updateOpenIMMemberRemark } from "@/api/group";
import OIMAvatar from "@/components/OIMAvatar";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import useGroupMembers from "@/hooks/useGroupMembers";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useUserStore } from "@/store";
import { BusinessRecord, pickExplicitBusinessRoomId } from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

import styles from "./group-setting.module.scss";

const getMemberRemark = (member: GroupMemberItem) => {
  const record = member as GroupMemberItem & Record<string, unknown>;
  const value = record.remarkName ?? record.remark ?? record.groupRemark;

  return typeof value === "string" || typeof value === "number" ? String(value) : "";
};

const GroupMemberList: FC = () => {
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const { currentMemberInGroup, currentRolevel, isOwner, isAdmin } =
    useCurrentMemberRole();
  const { fetchState, getMemberData, resetState, updateMemberInState } =
    useGroupMembers();
  const hasPermissions = isOwner || isAdmin;
  const fallbackGroupID =
    currentMemberInGroup?.groupID ?? currentGroupInfo?.groupID ?? "";
  const groupBusinessRoomId =
    pickExplicitBusinessRoomId(
      currentGroupInfo as BusinessRecord | undefined,
      fallbackGroupID,
    ) || fallbackGroupID;

  useEffect(() => {
    if (currentMemberInGroup?.groupID) {
      getMemberData(true);
    }
    return () => {
      resetState();
    };
  }, [currentMemberInGroup?.groupID]);

  const endReached = () => {
    getMemberData();
  };

  const getMemberBusinessRoomId = (member: GroupMemberItem) =>
    pickExplicitBusinessRoomId(
      member as unknown as BusinessRecord,
      currentMemberInGroup?.groupID,
    ) || groupBusinessRoomId;

  const updateMemberRemark = async (member: GroupMemberItem, remarkName: string) => {
    const memberBusinessRoomId = getMemberBusinessRoomId(member);

    if (!memberBusinessRoomId || !member.userID) {
      feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
      return;
    }

    try {
      if (remarkName) {
        await updateOpenIMMemberRemark({
          roomId: memberBusinessRoomId,
          targetUserId: member.userID,
          remarkName,
        });
      } else {
        await deleteOpenIMMemberRemark({
          roomId: memberBusinessRoomId,
          targetUserId: member.userID,
        });
      }
      updateMemberInState(member.userID, {
        remark: remarkName,
        remarkName,
      });
      feedbackToast();
    } catch (error) {
      feedbackToast({ error });
      throw error;
    }
  };

  const muteMember = async (member: GroupMemberItem, durationSeconds: number) => {
    const memberBusinessRoomId = getMemberBusinessRoomId(member);

    if (!memberBusinessRoomId || !member.userID) {
      feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
      return;
    }

    try {
      await IMSDK.changeGroupMemberMute({
        groupID: member.groupID,
        userID: member.userID,
        mutedSeconds: durationSeconds,
      });
      updateMemberInState(member.userID, {
        muteEndTime: Date.now() + durationSeconds * 1000,
      });
      feedbackToast();
    } catch (error) {
      feedbackToast({ error });
      throw error;
    }
  };

  const unmuteMember = async (member: GroupMemberItem) => {
    const memberBusinessRoomId = getMemberBusinessRoomId(member);

    if (!memberBusinessRoomId || !member.userID) {
      feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
      return;
    }

    try {
      await IMSDK.changeGroupMemberMute({
        groupID: member.groupID,
        userID: member.userID,
        mutedSeconds: 0,
      });
      updateMemberInState(member.userID, {
        muteEndTime: 0,
      });
      feedbackToast();
    } catch (error) {
      feedbackToast({ error });
      throw error;
    }
  };

  const setMemberAdminRole = async (
    member: GroupMemberItem,
    roleLevel: GroupMemberRole.Admin | GroupMemberRole.Normal,
  ) => {
    const memberBusinessRoomId = getMemberBusinessRoomId(member);

    if (!memberBusinessRoomId || !member.userID) {
      feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
      return;
    }

    try {
      await IMSDK.setGroupMemberInfo({
        groupID: member.groupID,
        userID: member.userID,
        roleLevel,
      });
      updateMemberInState(member.userID, {
        role: roleLevel === GroupMemberRole.Admin ? 2 : 3,
        roleLevel,
      });
      feedbackToast();
    } catch (error) {
      feedbackToast({ error });
      throw error;
    }
  };

  const canManageMember = (member: GroupMemberItem) =>
    hasPermissions &&
    Boolean(member.userID) &&
    member.userID !== selfUserID &&
    currentRolevel > Number(member.roleLevel ?? 0);

  const canManageAdministrator = (member: GroupMemberItem) =>
    isOwner &&
    Boolean(member.userID) &&
    member.userID !== selfUserID &&
    Number(member.roleLevel ?? 0) !== GroupMemberRole.Owner;

  const canEditRemark = (member: GroupMemberItem) =>
    hasPermissions && Boolean(member.userID) && member.userID !== selfUserID;

  return (
    <div className="h-full px-2 py-2.5">
      {fetchState.groupMemberList.length === 0 ? (
        <Empty
          className="flex h-full flex-col items-center justify-center"
          description={t("empty.noSearchResults")}
        />
      ) : (
        <Virtuoso
          className="h-full overflow-x-hidden"
          data={fetchState.groupMemberList}
          endReached={endReached}
          components={{
            Header: () => (fetchState.loading ? <Spin /> : null),
          }}
          itemContent={(_, member) => (
            <MemberItem
              member={member}
              canEditRemark={canEditRemark(member)}
              canManageAdministrator={canManageAdministrator(member)}
              canManageMember={canManageMember(member)}
              muteMember={muteMember}
              setMemberAdminRole={setMemberAdminRole}
              unmuteMember={unmuteMember}
              updateMemberRemark={updateMemberRemark}
            />
          )}
        />
      )}
    </div>
  );
};

export default GroupMemberList;

interface IMemberItemProps {
  member: GroupMemberItem;
  canEditRemark: boolean;
  canManageAdministrator: boolean;
  canManageMember: boolean;
  muteMember: (member: GroupMemberItem, durationSeconds: number) => Promise<void>;
  setMemberAdminRole: (
    member: GroupMemberItem,
    roleLevel: GroupMemberRole.Admin | GroupMemberRole.Normal,
  ) => Promise<void>;
  unmuteMember: (member: GroupMemberItem) => Promise<void>;
  updateMemberRemark: (member: GroupMemberItem, remarkName: string) => Promise<void>;
}

const MemberItem = memo(
  ({
    member,
    canEditRemark,
    canManageAdministrator,
    canManageMember,
    muteMember,
    setMemberAdminRole,
    unmuteMember,
    updateMemberRemark,
  }: IMemberItemProps) => {
    const currentRemark = getMemberRemark(member);
    const [remarkValue, setRemarkValue] = useState(currentRemark);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [muteMinutes, setMuteMinutes] = useState(10);
    const [muteOpen, setMuteOpen] = useState(false);
    const [muting, setMuting] = useState(false);
    const [admining, setAdmining] = useState(false);

    useEffect(() => {
      setRemarkValue(currentRemark);
    }, [currentRemark]);

    const roleLevel = Number(member.roleLevel ?? 0);
    const isOwner = roleLevel === GroupMemberRole.Owner;
    const isAdmin = roleLevel === GroupMemberRole.Admin;
    const isMuted = (member.muteEndTime ?? 0) > Date.now();
    const displayName = currentRemark || member.nickname;

    const saveRemark = () => {
      modal.confirm({
        title: t("placeholder.remark"),
        content: t("placeholder.confirmUpdateGroupMemberRemark"),
        onOk: async () => {
          setSaving(true);
          try {
            await updateMemberRemark(member, remarkValue.trim());
            setEditing(false);
          } catch {
            // Error toast is handled by updateMemberRemark.
          } finally {
            setSaving(false);
          }
        },
      });
    };

    const saveMute = () => {
      const durationSeconds = Math.max(1, Math.round(muteMinutes)) * 60;

      modal.confirm({
        title: t("placeholder.setMute"),
        content: t("placeholder.setMute"),
        onOk: async () => {
          setMuting(true);
          try {
            await muteMember(member, durationSeconds);
            setMuteOpen(false);
          } catch {
            // Error toast is handled by muteMember.
          } finally {
            setMuting(false);
          }
        },
      });
    };

    const cancelMute = () => {
      modal.confirm({
        title: t("placeholder.cancelMute"),
        content: t("placeholder.cancelMute"),
        onOk: async () => {
          setMuting(true);
          try {
            await unmuteMember(member);
          } catch {
            // Error toast is handled by unmuteMember.
          } finally {
            setMuting(false);
          }
        },
      });
    };

    const changeAdministratorRole = () => {
      const nextRole = isAdmin ? GroupMemberRole.Normal : GroupMemberRole.Admin;
      const title = isAdmin
        ? t("placeholder.cancelAdministrator")
        : t("placeholder.setAdministrator");

      modal.confirm({
        title,
        content: isAdmin
          ? t("placeholder.confirmCancelAdministrator")
          : t("placeholder.confirmSetAdministrator"),
        onOk: async () => {
          setAdmining(true);
          try {
            await setMemberAdminRole(member, nextRole);
          } catch {
            // Error toast is handled by setMemberAdminRole.
          } finally {
            setAdmining(false);
          }
        },
      });
    };

    return (
      <div className={styles["list-member-item"]}>
        <div
          className="flex flex-1 items-center overflow-hidden"
          onClick={() => window.userClick(member.userID, member.groupID)}
        >
          <OIMAvatar src={member.faceURL} text={displayName} />
          <div className="ml-3 min-w-0 flex-1">
            <div className="flex items-center">
              <div className="max-w-[120px] truncate">{displayName}</div>
              {isOwner && (
                <span className="ml-2 rounded border border-[#FF9831] px-1 text-xs text-[#FF9831]">
                  {t("placeholder.groupOwner")}
                </span>
              )}
              {isAdmin && (
                <span className="ml-2 rounded border border-[var(--primary)] px-1 text-xs text-[var(--primary)]">
                  {t("placeholder.administrator")}
                </span>
              )}
            </div>
            {currentRemark && (
              <div className="mt-1 max-w-[180px] truncate text-xs text-[var(--sub-text)]">
                {member.nickname}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          {canManageAdministrator && (
            <Button
              type="link"
              size="small"
              loading={admining}
              onClick={(event) => {
                event.stopPropagation();
                changeAdministratorRole();
              }}
            >
              {isAdmin
                ? t("placeholder.cancelAdministrator")
                : t("placeholder.setAdministrator")}
            </Button>
          )}
          {canManageMember && (
            <Button
              type="link"
              size="small"
              loading={muting}
              onClick={(event) => {
                event.stopPropagation();
                if (isMuted) {
                  cancelMute();
                } else {
                  setMuteOpen(true);
                }
              }}
            >
              {isMuted ? t("placeholder.cancelMute") : t("placeholder.mute")}
            </Button>
          )}
          {canEditRemark && (
            <Button
              type="link"
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setRemarkValue(currentRemark);
                setEditing(true);
              }}
            >
              {t("placeholder.remark")}
            </Button>
          )}
        </div>
        <Modal
          title={t("placeholder.remark")}
          open={editing}
          okText={t("placeholder.save")}
          cancelText={t("cancel")}
          confirmLoading={saving}
          onCancel={() => setEditing(false)}
          onOk={saveRemark}
        >
          <Input
            value={remarkValue}
            maxLength={20}
            placeholder={t("placeholder.pleaseEnter")}
            onChange={(event) => setRemarkValue(event.target.value)}
            onPressEnter={saveRemark}
          />
        </Modal>
        <Modal
          title={t("placeholder.setMute")}
          open={muteOpen}
          okText={t("placeholder.save")}
          cancelText={t("cancel")}
          confirmLoading={muting}
          onCancel={() => setMuteOpen(false)}
          onOk={saveMute}
        >
          <InputNumber
            className="w-full"
            min={1}
            max={1440}
            precision={0}
            value={muteMinutes}
            addonAfter={t("date.minute", { num: "" }).trim()}
            onChange={(value) => setMuteMinutes(typeof value === "number" ? value : 10)}
          />
        </Modal>
      </div>
    );
  },
);
