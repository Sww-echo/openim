import { DownloadOutlined, FileOutlined } from "@ant-design/icons";
import { Button, Spin } from "antd";
import { t } from "i18next";
import { FC, useCallback, useMemo, useState } from "react";

import { modal } from "@/AntdGlobalComp";
import {
  getBusinessFileFromMessageEx,
  getBusinessFileId,
  triggerBusinessFileDownload,
} from "@/api/file";
import { bytesToSize, downloadFile, feedbackToast } from "@/utils/common";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";

const FileMessageRender: FC<IMessageItemProps> = ({ message }) => {
  const [downloading, setDownloading] = useState(false);
  const businessFile = useMemo(
    () => getBusinessFileFromMessageEx(message.ex),
    [message.ex],
  );
  const businessFileId = getBusinessFileId(businessFile);
  const fileName =
    message.fileElem?.fileName ??
    businessFile?.fileName ??
    businessFile?.name ??
    t("placeholder.file");
  const fileSize = message.fileElem?.fileSize ?? businessFile?.fileSize;
  const sourceUrl = message.fileElem?.sourceUrl;

  const downloadAttachment = useCallback(async () => {
    try {
      setDownloading(true);
      if (businessFileId) {
        await triggerBusinessFileDownload(businessFileId, fileName);
        return;
      }
      if (sourceUrl) {
        await downloadFile(sourceUrl);
        return;
      }
      throw new Error(t("toast.downloadFailed"));
    } catch (error) {
      feedbackToast({ error });
    } finally {
      setDownloading(false);
    }
  }, [businessFileId, fileName, sourceUrl]);

  const confirmDownloadAttachment = useCallback(() => {
    modal.confirm({
      title: t("placeholder.download"),
      content: t("placeholder.confirmDownloadFile"),
      onOk: downloadAttachment,
    });
  }, [downloadAttachment]);

  return (
    <div className={`${styles.bubble} flex w-64 items-center gap-3`}>
      <FileOutlined className="shrink-0 text-2xl text-[var(--primary)]" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm" title={fileName}>
          {fileName}
        </div>
        {fileSize ? (
          <div className="mt-1 text-xs text-[var(--sub-text)]">
            {bytesToSize(fileSize)}
          </div>
        ) : null}
      </div>
      <Spin spinning={downloading}>
        <Button
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          title={t("placeholder.download")}
          onClick={confirmDownloadAttachment}
        />
      </Spin>
    </div>
  );
};

export default FileMessageRender;
