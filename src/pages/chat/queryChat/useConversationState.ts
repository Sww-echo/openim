import { SessionType } from "@openim/wasm-client-sdk";
import { useLatest, useThrottleFn, useUpdateEffect } from "ahooks";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useUserStore } from "@/store";

const getRouteConversationSource = (conversationID: string, selfID?: string) => {
  if (conversationID.startsWith("sg_")) {
    return {
      sessionType: SessionType.Group,
      sourceID: conversationID.slice(3),
    };
  }

  if (!conversationID.startsWith("si_")) {
    return undefined;
  }

  if (!selfID) {
    return undefined;
  }

  const [firstID, secondID] = conversationID.slice(3).split("_");
  if (!firstID || !secondID) {
    return undefined;
  }

  const sourceID = firstID === selfID ? secondID : secondID === selfID ? firstID : "";
  return sourceID
    ? {
        sessionType: SessionType.Single,
        sourceID,
      }
    : undefined;
};

export default function useConversationState() {
  const { conversationID } = useParams();
  const syncState = useUserStore((state) => state.syncState);
  const isLogining = useUserStore((state) => state.isLogining);
  const selfID = useUserStore((state) => state.selfInfo.userID);
  const latestSyncState = useLatest(syncState);
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const conversationList = useConversationStore((state) => state.conversationList);
  const updateCurrentConversation = useConversationStore(
    (state) => state.updateCurrentConversation,
  );
  const latestCurrentConversation = useLatest(currentConversation);

  useEffect(() => {
    if (
      !conversationID ||
      syncState === "loading" ||
      isLogining ||
      currentConversation?.conversationID === conversationID
    ) {
      return;
    }

    const routeConversation = conversationList.find(
      (conversation) => conversation.conversationID === conversationID,
    );
    if (routeConversation) {
      void updateCurrentConversation({ ...routeConversation });
      return;
    }

    const routeSource = getRouteConversationSource(conversationID, selfID);
    if (!routeSource) {
      return;
    }

    let ignore = false;
    IMSDK.getOneConversation(routeSource)
      .then(({ data }) => {
        if (!ignore) {
          void updateCurrentConversation({ ...data });
        }
      })
      .catch((error) => {
        console.warn("get route conversation failed", error);
      });

    return () => {
      ignore = true;
    };
  }, [
    conversationID,
    conversationList,
    currentConversation?.conversationID,
    isLogining,
    selfID,
    syncState,
    updateCurrentConversation,
  ]);

  useUpdateEffect(() => {
    if (syncState !== "loading") {
      checkConversationState();
    }
  }, [syncState]);

  useUpdateEffect(() => {
    throttleCheckConversationState();
  }, [currentConversation?.unreadCount]);

  useEffect(() => {
    checkConversationState();
  }, [currentConversation?.conversationID]);

  const checkConversationState = () => {
    if (
      !latestCurrentConversation.current ||
      latestSyncState.current === "loading"
    )
      return;

    if (latestCurrentConversation.current.unreadCount > 0) {
      IMSDK.markConversationMessageAsRead(
        latestCurrentConversation.current.conversationID,
      );
    }
  };

  const { run: throttleCheckConversationState } = useThrottleFn(
    checkConversationState,
    { wait: 2000, leading: false },
  );

  return {
    currentConversation,
  };
}
