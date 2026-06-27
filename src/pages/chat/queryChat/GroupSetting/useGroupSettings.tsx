import type { GroupItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";
import { useCallback, useRef } from "react";

import { modal } from "@/AntdGlobalComp";
import { type RoomSettingsParams } from "@/api/group";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useUserStore } from "@/store";
import { BusinessRecord, pickExplicitBusinessRoomId } from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

export type PermissionField = "applyMemberFriend" | "lookMemberInfo";
type RoomSettingsPatch = Omit<RoomSettingsParams, "roomId">;

const normalizeBusinessRoomId = (roomId?: string | number) =>
  String(roomId ?? "").trim();

export function useGroupSettings({ closeOverlay }: { closeOverlay: () => void }) {
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const updateCurrentGroupInfo = useConversationStore(
    (state) => state.updateCurrentGroupInfo,
  );
  const businessRoomId = normalizeBusinessRoomId(
    pickExplicitBusinessRoomId(
      currentGroupInfo as BusinessRecord | undefined,
      currentGroupInfo?.groupID,
    ) || currentGroupInfo?.groupID,
  );

  const modalRef = useRef<{
    destroy: () => void;
  } | null>(null);

  const updateRoomSettings = useCallback(
    (_params: RoomSettingsPatch): Promise<void> => {
      if (!currentGroupInfo || !businessRoomId) {
        return Promise.resolve();
      }
      feedbackToast({
        error: new Error(t("toast.unsupportedByLatestApiDoc")),
      });
      return Promise.resolve();
    },
    [businessRoomId, currentGroupInfo],
  );

  const updateGroupPermission = useCallback(
    async (groupParams: Partial<GroupItem>, roomParams?: RoomSettingsPatch) => {
      if (!currentGroupInfo) return;
      try {
        if (roomParams) {
          if (!businessRoomId) return;
        }
        await IMSDK.setGroupInfo({
          ...groupParams,
          groupID: currentGroupInfo.groupID,
        });
        updateCurrentGroupInfo({
          ...currentGroupInfo,
          ...groupParams,
          ...roomParams,
        } as GroupItem);
      } catch (error) {
        feedbackToast({ error, msg: t("toast.updateGroupInfoFailed") });
      }
    },
    [businessRoomId, currentGroupInfo, updateCurrentGroupInfo],
  );

  const updateGroupInfo = useCallback(
    async (value: Partial<GroupItem>) => {
      if (!currentGroupInfo) return;
      try {
        const roomParams = value.groupName ? { roomName: value.groupName } : undefined;
        await IMSDK.setGroupInfo({
          ...value,
          groupID: currentGroupInfo.groupID,
        });
        updateCurrentGroupInfo({
          ...currentGroupInfo,
          ...value,
          ...roomParams,
        });
      } catch (error) {
        feedbackToast({ error, msg: t("toast.updateGroupInfoFailed") });
      }
    },
    [businessRoomId, currentGroupInfo, updateCurrentGroupInfo],
  );

  const tryDismissGroup = () => {
    if (!currentGroupInfo || !businessRoomId || modalRef.current) return;

    modalRef.current = modal.confirm({
      title: t("placeholder.disbandGroup"),
      content: (
        <div className="flex items-baseline">
          <div>{t("toast.confirmDisbandGroup")}</div>
          <span className="text-xs text-[var(--sub-text)]">
            {t("placeholder.disbandGroupToast")}
          </span>
        </div>
      ),
      onOk: async () => {
        try {
          await IMSDK.dismissGroup(currentGroupInfo.groupID);
          closeOverlay();
        } catch (error) {
          feedbackToast({ error });
        }
        modalRef.current = null;
      },
      onCancel: () => {
        modalRef.current = null;
      },
    });
  };

  const tryQuitGroup = () => {
    if (!currentGroupInfo || !businessRoomId || !selfUserID || modalRef.current) {
      return;
    }

    modalRef.current = modal.confirm({
      title: t("placeholder.exitGroup"),
      content: (
        <div className="flex items-baseline">
          <div>{t("toast.confirmExitGroup")}</div>
          <span className="text-xs text-[var(--sub-text)]">
            {t("placeholder.exitGroupToast")}
          </span>
        </div>
      ),
      onOk: async () => {
        try {
          await IMSDK.quitGroup(currentGroupInfo.groupID);
          closeOverlay();
        } catch (error) {
          feedbackToast({ error });
        }
        modalRef.current = null;
      },
      onCancel: () => {
        modalRef.current = null;
      },
    });
  };

  return {
    currentGroupInfo,
    updateGroupInfo,
    updateRoomSettings,
    updateGroupPermission,
    tryQuitGroup,
    tryDismissGroup,
  };
}
