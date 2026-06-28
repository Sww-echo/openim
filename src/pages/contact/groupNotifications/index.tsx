import { ApplicationHandleResult } from "@openim/wasm-client-sdk";
import { GroupApplicationItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Empty, Spin } from "antd";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";

import { handleOpenIMJoinRequest } from "@/api/group";
import ApplicationItem, { AccessFunction } from "@/components/ApplicationItem";
import { IMSDK } from "@/layout/MainContentWrap";
import { useUserStore } from "@/store";
import { useContactStore } from "@/store/contact";
import { pickBusinessJoinRequestId } from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

const syncBusinessGroupApplication = async (
  application: GroupApplicationItem,
  agree: boolean,
) => {
  const requestId = pickBusinessJoinRequestId(application);

  if (!requestId) {
    return;
  }

  await handleOpenIMJoinRequest({
    requestId,
    agree,
    remark: "",
  });
};

const normalizeApplicationId = (value?: string | number | null) =>
  String(value ?? "").trim();

export const GroupNotifications = () => {
  const { t } = useTranslation();
  const currentUserID = useUserStore((state) => state.selfInfo.userID);

  const recvGroupApplicationList = useContactStore(
    (state) => state.recvGroupApplicationList,
  );
  const sendGroupApplicationList = useContactStore(
    (state) => state.sendGroupApplicationList,
  );
  const updateRecvGroupApplication = useContactStore(
    (state) => state.updateRecvGroupApplication,
  );
  const updateSendGroupApplication = useContactStore(
    (state) => state.updateSendGroupApplication,
  );
  const ensureGroupApplicationsLoaded = useContactStore(
    (state) => state.ensureGroupApplicationsLoaded,
  );
  const groupApplicationsLoading = useContactStore(
    (state) => state.contactDataLoading.groupApplications,
  );

  useEffect(() => {
    void ensureGroupApplicationsLoaded();
  }, [ensureGroupApplicationsLoaded]);

  const groupApplicationList = sortArray(
    recvGroupApplicationList.concat(sendGroupApplicationList),
  );

  const onAccept = useCallback(
    async (application: GroupApplicationItem, isRecv: boolean) => {
      const groupID = normalizeApplicationId(application.groupID);
      const fromUserID = normalizeApplicationId(application.userID);

      if (!groupID || !fromUserID) {
        feedbackToast({ error: new Error(t("toast.sendApplicationFailed")) });
        return;
      }

      try {
        await syncBusinessGroupApplication(application, true);
        await IMSDK.acceptGroupApplication({
          groupID,
          fromUserID,
          handleMsg: "",
        });
        const newApplication = {
          ...application,
          handleResult: ApplicationHandleResult.Agree,
        };
        if (isRecv) {
          updateRecvGroupApplication(newApplication);
        } else {
          updateSendGroupApplication(newApplication);
        }
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [t, updateRecvGroupApplication, updateSendGroupApplication],
  );

  const onReject = useCallback(
    async (application: GroupApplicationItem, isRecv: boolean) => {
      const groupID = normalizeApplicationId(application.groupID);
      const fromUserID = normalizeApplicationId(application.userID);

      if (!groupID || !fromUserID) {
        feedbackToast({ error: new Error(t("toast.sendApplicationFailed")) });
        return;
      }

      try {
        await syncBusinessGroupApplication(application, false);
        await IMSDK.refuseGroupApplication({
          groupID,
          fromUserID,
          handleMsg: "",
        });
        const newApplication = {
          ...application,
          handleResult: ApplicationHandleResult.Reject,
        };
        if (isRecv) {
          updateRecvGroupApplication(newApplication);
        } else {
          updateSendGroupApplication(newApplication);
        }
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [t, updateRecvGroupApplication, updateSendGroupApplication],
  );

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <p className="m-5.5 text-base font-extrabold">
        {t("placeholder.groupNotification")}
      </p>
      <div className="flex-1 pb-3">
        {groupApplicationsLoading ? (
          <Spin className="mt-[30%] w-full" />
        ) : groupApplicationList.length === 0 ? (
          <Empty className="mt-[30%]" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Virtuoso
            className="h-full overflow-x-hidden"
            data={groupApplicationList}
            itemContent={(_, item) => (
              <ApplicationItem
                key={`${item.userID}${item.reqTime}`}
                source={item}
                currentUserID={currentUserID}
                onAccept={onAccept as AccessFunction}
                onReject={onReject as AccessFunction}
              />
            )}
          />
        )}
      </div>
    </div>
  );
};

const sortArray = (list: GroupApplicationItem[]) => {
  list.sort((a, b) => {
    if (a.handleResult === 0 && b.handleResult !== 0) {
      return -1;
    } else if (b.handleResult === 0 && a.handleResult !== 0) {
      return 1;
    }
    return b.reqTime - a.reqTime;
  });
  return list;
};
