import { LeftOutlined } from "@ant-design/icons";
import { t } from "i18next";
import { memo } from "react";

import invite_header from "@/assets/images/chatSetting/invite_header.png";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import type { GroupChooseExtraData } from "@/pages/common/ChooseModal";
import { useConversationStore } from "@/store";
import {
  BusinessRecord,
  pickExplicitBusinessRoomId,
  toBusinessText,
} from "@/utils/businessPayload";
import type { BusinessSwitchValue } from "@/utils/businessSwitch";
import { isBusinessSwitchOn } from "@/utils/businessSwitch";
import { feedbackToast } from "@/utils/common";
import { emit } from "@/utils/events";

const GroupMemberListHeader = ({ back2Settings }: { back2Settings: () => void }) => {
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const { isOwner, isAdmin } = useCurrentMemberRole();
  const canInviteMember =
    isOwner ||
    isAdmin ||
    isBusinessSwitchOn(
      (currentGroupInfo as { allowInviteFriend?: BusinessSwitchValue } | undefined)
        ?.allowInviteFriend,
      true,
    );
  const groupID = toBusinessText(
    currentConversation?.groupID ?? currentGroupInfo?.groupID,
  ).trim();
  const businessRoomId = (
    pickExplicitBusinessRoomId(
      currentGroupInfo as unknown as BusinessRecord | undefined,
      groupID,
    ) || groupID
  ).trim();
  const canOpenGroupChoose = Boolean(groupID && businessRoomId);

  const inviteMember = () => {
    const { currentConversation, currentGroupInfo } = useConversationStore.getState();
    const groupID = toBusinessText(
      currentConversation?.groupID ?? currentGroupInfo?.groupID,
    ).trim();
    const roomId = (
      pickExplicitBusinessRoomId(
        currentGroupInfo as unknown as BusinessRecord | undefined,
        groupID,
      ) || groupID
    ).trim();

    if (!groupID || !roomId) {
      feedbackToast({ error: new Error(t("toast.updateGroupInfoFailed")) });
      return;
    }

    const extraData: GroupChooseExtraData = {
      groupID,
      roomId,
    };

    emit("OPEN_CHOOSE_MODAL", {
      type: "INVITE_TO_GROUP",
      extraData,
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <LeftOutlined
          className="mr-2 !text-[var(--base-black)]"
          rev={undefined}
          onClick={back2Settings}
        />
        <div>{t("placeholder.memberList")}</div>
      </div>
      {canInviteMember && canOpenGroupChoose && (
        <div className="mr-4 flex items-center">
          <img
            className="mr-3 cursor-pointer"
            width={18}
            src={invite_header}
            alt=""
            onClick={inviteMember}
          />
        </div>
      )}
    </div>
  );
};

export default memo(GroupMemberListHeader);
