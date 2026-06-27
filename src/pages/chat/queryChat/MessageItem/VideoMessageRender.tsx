import { MessageStatus } from "@openim/wasm-client-sdk";
import { Spin } from "antd";
import { FC, useEffect, useMemo, useState } from "react";

import {
  getBusinessFileFromMessageEx,
  getBusinessFileId,
  getSignedFileDownloadUrl,
} from "@/api/file";

import { IMessageItemProps } from ".";

const VideoMessageRender: FC<IMessageItemProps> = ({ message }) => {
  const businessFileId = useMemo(
    () => getBusinessFileId(getBusinessFileFromMessageEx(message.ex)),
    [message.ex],
  );
  const [businessSourceUrl, setBusinessSourceUrl] = useState<string>();
  const isSending = message.status === MessageStatus.Sending;
  const videoElem = message.videoElem;
  const sourceUrl = businessSourceUrl ?? videoElem?.videoUrl;
  const posterUrl = videoElem?.snapshotUrl;

  useEffect(() => {
    let active = true;
    let revokeSignedUrl: (() => void) | undefined;

    setBusinessSourceUrl(undefined);
    if (!businessFileId) {
      return undefined;
    }

    getSignedFileDownloadUrl(businessFileId)
      .then((signedFile) => {
        if (!signedFile?.url) {
          return;
        }
        if (!active) {
          signedFile.revoke?.();
          return;
        }
        revokeSignedUrl = signedFile.revoke;
        setBusinessSourceUrl(signedFile.url);
      })
      .catch((error) => {
        console.debug("Failed to load business video download", error);
      });

    return () => {
      active = false;
      revokeSignedUrl?.();
    };
  }, [businessFileId]);

  return (
    <Spin spinning={isSending}>
      <div className="relative max-w-[260px]">
        <video
          className="block max-h-[240px] max-w-[260px] rounded-md bg-black"
          src={sourceUrl}
          poster={posterUrl}
          controls
          preload="metadata"
        />
      </div>
    </Spin>
  );
};

export default VideoMessageRender;
