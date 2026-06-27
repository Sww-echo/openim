import { getWithRenderProcess } from "@openim/electron-client-sdk/lib/render";
import { AllowType, GroupMemberRole } from "@openim/wasm-client-sdk";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useConversationStore, useUserStore } from "@/store";
import type { BusinessSwitchValue } from "@/utils/businessSwitch";
import { isBusinessSwitchOn } from "@/utils/businessSwitch";
import { isSameID } from "@/utils/common";
import { emit } from "@/utils/events";
import { getIMToken, getIMUserID } from "@/utils/storage";

// const isElectronProd = import.meta.env.MODE !== "development" && window.electronAPI;

const { instance } = getWithRenderProcess({
  wasmConfig: {
    coreWasmPath: "./openIM.wasm",
    sqlWasmPath: `/sql-wasm.wasm`,
  },
});
const openIMSDK = instance;

export const IMSDK = openIMSDK;

type BusinessGroupPermissionInfo = {
  allowAddFriend?: BusinessSwitchValue;
  allowMemberPrivateChat?: BusinessSwitchValue;
  allowSendCard?: BusinessSwitchValue;
  showMember?: BusinessSwitchValue;
};

const isPrivilegedGroupMember = (roleLevel?: number) =>
  roleLevel === GroupMemberRole.Owner || roleLevel === GroupMemberRole.Admin;

export const MainContentWrap = () => {
  const updateAppSettings = useUserStore((state) => state.updateAppSettings);

  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const isLoginRoute = location.pathname === "/login";

  useEffect(() => {
    if (isLoginRoute) {
      setAuthChecked(true);
      return;
    }

    let ignore = false;

    const loginCheck = async () => {
      const IMToken = await getIMToken();
      const IMUserID = await getIMUserID();
      if (!IMToken || !IMUserID) {
        navigate("/login");
        return;
      }
      if (!ignore) {
        setAuthChecked(true);
      }
    };

    loginCheck();
    return () => {
      ignore = true;
    };
  }, [isLoginRoute, navigate]);

  useEffect(() => {
    window.userClick = (userID?: string, groupID?: string) => {
      if (!userID || userID === "AtAllTag") return;

      const conversationState = useConversationStore.getState();
      const currentGroupInfo =
        conversationState.currentGroupInfo as
          | (typeof conversationState.currentGroupInfo &
              BusinessGroupPermissionInfo)
          | undefined;
      const hasGroupManagePermission = isPrivilegedGroupMember(
        conversationState.currentMemberInGroup?.roleLevel,
      );
      const canViewGroupMember = isBusinessSwitchOn(
        currentGroupInfo?.showMember,
        currentGroupInfo?.lookMemberInfo !== AllowType.NotAllowed,
      );

      if (groupID && !canViewGroupMember) {
        return;
      }

      const canAddGroupMemberFriend =
        !groupID ||
        hasGroupManagePermission ||
        isBusinessSwitchOn(
          currentGroupInfo?.allowAddFriend ?? currentGroupInfo?.allowSendCard,
          currentGroupInfo?.applyMemberFriend !== AllowType.NotAllowed,
        );
      const canSendMessageToGroupMember =
        !groupID ||
        hasGroupManagePermission ||
        isBusinessSwitchOn(currentGroupInfo?.allowMemberPrivateChat, true);

      emit("OPEN_USER_CARD", {
        userID,
        groupID,
        isSelf: isSameID(userID, useUserStore.getState().selfInfo.userID),
        notAdd: !canAddGroupMemberFriend,
        notSendMessage: !canSendMessageToGroupMember,
      });
    };
  }, []);

  useEffect(() => {
    const initSettingStore = async () => {
      if (!window.electronAPI) return;
      updateAppSettings({
        closeAction:
          (await window.electronAPI?.ipcInvoke("getKeyStore", {
            key: "closeAction",
          })) || "miniSize",
      });
      window.electronAPI?.ipcInvoke("main-win-ready");
    };

    initSettingStore();
  }, []);

  if (!authChecked) {
    return null;
  }

  return <Outlet />;
};
