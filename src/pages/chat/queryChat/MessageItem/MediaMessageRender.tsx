import { MessageStatus } from "@openim/wasm-client-sdk";
import { Image, Spin } from "antd";
import { FC, useEffect, useMemo, useState } from "react";

import {
  getBusinessFileFromMessageEx,
  getBusinessFileId,
  getSignedFilePreviewUrl,
} from "@/api/file";

import { IMessageItemProps } from ".";

const min = (a: number, b: number) => (a > b ? b : a);

const MediaMessageRender: FC<IMessageItemProps> = ({ message }) => {
  const businessFileId = useMemo(
    () => getBusinessFileId(getBusinessFileFromMessageEx(message.ex)),
    [message.ex],
  );
  const [businessSourceUrl, setBusinessSourceUrl] = useState<string>();
  const [businessPreviewLoading, setBusinessPreviewLoading] = useState(false);
  const imageHeight = message.pictureElem!.sourcePicture.height;
  const imageWidth = message.pictureElem!.sourcePicture.width;
  const snapshotMaxHeight = message.pictureElem!.snapshotPicture?.height ?? imageHeight;
  const minHeight = min(200, imageWidth) * (imageHeight / imageWidth) + 2;
  const adaptedHight = min(minHeight, snapshotMaxHeight) + 10;
  const adaptedWidth = min(imageWidth, 200) + 10;

  const sdkSourceUrl =
    message.pictureElem!.snapshotPicture?.url || message.pictureElem!.sourcePicture.url;
  const sourceUrl = businessFileId
    ? businessSourceUrl || (businessPreviewLoading ? undefined : sdkSourceUrl)
    : sdkSourceUrl;
  const isSending = message.status === MessageStatus.Sending;
  const minStyle = { minHeight: `${adaptedHight}px`, minWidth: `${adaptedWidth}px` };

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;

    setBusinessSourceUrl(undefined);
    if (!businessFileId) {
      setBusinessPreviewLoading(false);
      return undefined;
    }

    setBusinessPreviewLoading(true);
    getSignedFilePreviewUrl(businessFileId)
      .then((url) => {
        if (!active) {
          if (url?.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
          return;
        }
        if (!url) {
          setBusinessPreviewLoading(false);
          return;
        }
        objectUrl = url.startsWith("blob:") ? url : undefined;
        setBusinessSourceUrl(url);
        setBusinessPreviewLoading(false);
      })
      .catch((error) => {
        if (active) {
          setBusinessPreviewLoading(false);
        }
        console.debug("Failed to load business file preview", error);
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [businessFileId]);

  return (
    <Spin spinning={isSending}>
      <div className="relative max-w-[200px]" style={minStyle}>
        <Image
          rootClassName="message-image cursor-pointer"
          className="max-w-[200px] rounded-md"
          src={sourceUrl}
          preview
          placeholder={
            <div style={minStyle} className="flex items-center justify-center">
              <Spin />
            </div>
          }
        />
      </div>
    </Spin>
  );
};

export default MediaMessageRender;
