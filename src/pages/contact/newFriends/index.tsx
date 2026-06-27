import { ApplicationHandleResult } from "@openim/wasm-client-sdk";
import { FriendApplicationItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";

import { addBusinessFriend } from "@/api/friend";
import ApplicationItem, { AccessFunction } from "@/components/ApplicationItem";
import { IMSDK } from "@/layout/MainContentWrap";
import { useUserStore } from "@/store";
import { useContactStore } from "@/store/contact";
import { feedbackToast } from "@/utils/common";

const normalizeTargetUserID = (userID?: string | number | null) =>
  String(userID ?? "").trim();

export const NewFriends = () => {
  const { t } = useTranslation();
  const currentUserID = useUserStore((state) => state.selfInfo.userID);

  const recvFriendApplicationList = useContactStore(
    (state) => state.recvFriendApplicationList,
  );
  const sendFriendApplicationList = useContactStore(
    (state) => state.sendFriendApplicationList,
  );
  const updateRecvFriendApplication = useContactStore(
    (state) => state.updateRecvFriendApplication,
  );
  const updateSendFriendApplication = useContactStore(
    (state) => state.updateSendFriendApplication,
  );
  const ensureFriendApplicationsLoaded = useContactStore(
    (state) => state.ensureFriendApplicationsLoaded,
  );

  useEffect(() => {
    void ensureFriendApplicationsLoaded(true);
  }, [ensureFriendApplicationsLoaded]);

  const friendApplicationList = sortArray(
    recvFriendApplicationList.concat(sendFriendApplicationList),
  );

  const onAccept = useCallback(
    async (application: FriendApplicationItem, isRecv: boolean) => {
      const targetUserID = normalizeTargetUserID(application.fromUserID);

      if (!targetUserID) {
        feedbackToast({ error: new Error(t("toast.sendApplicationFailed")) });
        return;
      }

      try {
        await addBusinessFriend(targetUserID);
        try {
          await IMSDK.acceptFriendApplication({
            toUserID: targetUserID,
            handleMsg: "",
          });
        } catch (error) {
          console.debug("acceptFriendApplication skipped", error);
        }
        const newApplication = {
          ...application,
          handleResult: ApplicationHandleResult.Agree,
        };
        if (isRecv) {
          updateRecvFriendApplication(newApplication);
        } else {
          updateSendFriendApplication(newApplication);
        }
        await useContactStore.getState().ensureFriendListLoaded(true);
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [t, updateRecvFriendApplication, updateSendFriendApplication],
  );

  const onReject = useCallback(
    async (application: FriendApplicationItem, isRecv: boolean) => {
      const targetUserID = normalizeTargetUserID(application.fromUserID);

      if (!targetUserID) {
        feedbackToast({ error: new Error(t("toast.sendApplicationFailed")) });
        return;
      }

      try {
        await IMSDK.refuseFriendApplication({
          toUserID: targetUserID,
          handleMsg: "",
        });
        const newApplication = {
          ...application,
          handleResult: ApplicationHandleResult.Reject,
        };
        if (isRecv) {
          updateRecvFriendApplication(newApplication);
        } else {
          updateSendFriendApplication(newApplication);
        }
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [],
  );

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <p className="m-5.5 text-base font-extrabold">{t("placeholder.newFriends")}</p>
      <div className="flex-1 pb-3">
        <Virtuoso
          className="h-full overflow-x-hidden"
          data={friendApplicationList}
          itemContent={(_, item) => (
            <ApplicationItem
              key={`${
                currentUserID === item.fromUserID ? item.toUserID : item.fromUserID
              }${item.createTime}`}
              source={item}
              currentUserID={currentUserID}
              onAccept={onAccept as AccessFunction}
              onReject={onReject as AccessFunction}
            />
          )}
        />
      </div>
    </div>
  );
};

const sortArray = (list: FriendApplicationItem[]) => {
  list.sort((a, b) => {
    if (a.handleResult === 0 && b.handleResult !== 0) {
      return -1;
    } else if (b.handleResult === 0 && a.handleResult !== 0) {
      return 1;
    }
    return b.createTime - a.createTime;
  });
  return list;
};
