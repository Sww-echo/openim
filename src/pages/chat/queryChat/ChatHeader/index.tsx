import { FolderOpenOutlined, SearchOutlined } from "@ant-design/icons";
import { SessionType } from "@openim/wasm-client-sdk";
import { Layout, Tooltip } from "antd";
import clsx from "clsx";
import i18n, { t } from "i18next";
import { memo, useEffect, useRef, useState } from "react";

import group_member from "@/assets/images/chatHeader/group_member.png";
import launch_group from "@/assets/images/chatHeader/launch_group.png";
import settings from "@/assets/images/chatHeader/settings.png";
import OIMAvatar from "@/components/OIMAvatar";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import type { GroupChooseExtraData } from "@/pages/common/ChooseModal";
import { useConversationStore, useUserStore } from "@/store";
import {
  BusinessRecord,
  pickExplicitBusinessRoomId,
} from "@/utils/businessPayload";
import type { BusinessSwitchValue } from "@/utils/businessSwitch";
import { isBusinessSwitchOn } from "@/utils/businessSwitch";
import { emit } from "@/utils/events";

import GroupSetting from "../GroupSetting";
import SingleSetting from "../SingleSetting";
import ChatBusinessResources from "./ChatBusinessResources";
import ChatMessageSearch from "./ChatMessageSearch";

const menuList = [
  {
    title: t("placeholder.createGroup"),
    icon: launch_group,
    idx: 0,
  },
  {
    title: t("placeholder.invitation"),
    icon: launch_group,
    idx: 1,
  },
  {
    title: t("placeholder.setting"),
    icon: settings,
    idx: 2,
  },
];

i18n.on("languageChanged", () => {
  menuList[0].title = t("placeholder.createGroup");
  menuList[1].title = t("placeholder.invitation");
  menuList[2].title = t("placeholder.setting");
});

const ChatHeader = () => {
  const singleSettingRef = useRef<OverlayVisibleHandle>(null);
  const groupSettingRef = useRef<OverlayVisibleHandle>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const currentUserIsInGroup = useConversationStore((state) =>
    Boolean(state.currentMemberInGroup?.userID),
  );
  const inGroup = useConversationStore((state) =>
    Boolean(state.currentMemberInGroup?.groupID),
  );
  const { isOwner, isAdmin } = useCurrentMemberRole();

  // locale re render
  useUserStore((state) => state.appSettings.locale);

  useEffect(() => {
    if (singleSettingRef.current?.isOverlayOpen) {
      singleSettingRef.current?.closeOverlay();
    }
    if (groupSettingRef.current?.isOverlayOpen) {
      groupSettingRef.current?.closeOverlay();
    }
  }, [currentConversation?.conversationID]);

  const getInviteGroupExtraData = (): GroupChooseExtraData => {
    const groupID = currentConversation?.groupID ?? currentGroupInfo?.groupID ?? "";

    return {
      groupID,
      roomId:
        pickExplicitBusinessRoomId(
          currentGroupInfo as unknown as BusinessRecord | undefined,
          groupID,
        ) || groupID,
    };
  };

  const menuClick = (idx: number) => {
    switch (idx) {
      case 0:
      case 1:
        emit("OPEN_CHOOSE_MODAL", {
          type: isSingleSession ? "CRATE_GROUP" : "INVITE_TO_GROUP",
          extraData: isSingleSession
            ? [{ ...currentConversation }]
            : getInviteGroupExtraData(),
        });
        break;
      case 2:
        if (isGroupSession) {
          groupSettingRef.current?.openOverlay();
        } else {
          singleSettingRef.current?.openOverlay();
        }
        break;
      default:
        break;
    }
  };

  const isSingleSession = currentConversation?.conversationType === SessionType.Single;
  const isGroupSession = currentConversation?.conversationType === SessionType.Group;
  const canInviteMember =
    isOwner ||
    isAdmin ||
    isBusinessSwitchOn(
      (currentGroupInfo as { allowInviteFriend?: BusinessSwitchValue } | undefined)
        ?.allowInviteFriend,
      true,
    );

  return (
    <Layout.Header className="relative border-b border-b-[var(--gap-text)] !bg-white !px-3">
      <div className="flex h-full items-center leading-none">
        <div className="flex flex-1 items-center overflow-hidden">
          <OIMAvatar
            src={currentConversation?.faceURL}
            text={currentConversation?.showName}
            isgroup={Boolean(currentConversation?.groupID)}
          />
          <div
            className={clsx(
              "ml-3 flex !h-10.5 flex-1 flex-col justify-between overflow-hidden",
            )}
          >
            <div className="truncate text-base font-semibold">
              {currentConversation?.showName}
            </div>
            {isGroupSession && currentUserIsInGroup && (
              <div className="flex items-center text-xs text-[var(--sub-text)]">
                <img width={20} src={group_member} alt="member" />
                <span>{currentGroupInfo?.memberCount}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mr-5 flex">
          {(isSingleSession || isGroupSession) && (
            <Tooltip title={t("placeholder.chatHistorySearch")}>
              <SearchOutlined
                className="ml-5 cursor-pointer text-xl text-[var(--sub-text)]"
                rev={undefined}
                onClick={() => setSearchOpen(true)}
              />
            </Tooltip>
          )}
          {(isSingleSession || isGroupSession) && (
            <Tooltip title={t("placeholder.chatResources")}>
              <FolderOpenOutlined
                className="ml-5 cursor-pointer text-xl text-[var(--sub-text)]"
                rev={undefined}
                onClick={() => setResourcesOpen(true)}
              />
            </Tooltip>
          )}
          {menuList.map((menu) => {
            if (menu.idx === 1 && (isSingleSession || (!inGroup && !isSingleSession))) {
              return null;
            }
            if (menu.idx === 1 && isGroupSession && !canInviteMember) {
              return null;
            }
            if (menu.idx === 0 && !isSingleSession) {
              return null;
            }

            return (
              <Tooltip title={menu.title} key={menu.idx}>
                <img
                  className="ml-5 cursor-pointer"
                  width={20}
                  src={menu.icon}
                  alt=""
                  onClick={() => menuClick(menu.idx)}
                />
              </Tooltip>
            );
          })}
        </div>
      </div>
      <ChatMessageSearch
        open={searchOpen}
        conversation={currentConversation}
        onClose={() => setSearchOpen(false)}
      />
      <ChatBusinessResources
        open={resourcesOpen}
        conversation={currentConversation}
        onClose={() => setResourcesOpen(false)}
      />
      <SingleSetting ref={singleSettingRef} />
      <GroupSetting ref={groupSettingRef} />
    </Layout.Header>
  );
};

export default memo(ChatHeader);
