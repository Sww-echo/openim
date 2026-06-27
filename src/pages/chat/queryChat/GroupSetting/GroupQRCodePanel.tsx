import {
  CopyOutlined,
  QrcodeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Empty, Input, InputNumber, QRCode, Space, Spin } from "antd";
import { t } from "i18next";
import { memo, useCallback, useMemo, useState } from "react";
import { useCopyToClipboard } from "react-use";

import { modal } from "@/AntdGlobalComp";
import {
  createOpenIMGroupQRCode,
  joinOpenIMGroupByQRCode,
  resolveOpenIMGroupQRCode,
} from "@/api/group";
import {
  BusinessRecord,
  isBusinessRecord,
  pickBusinessText,
  toBusinessText,
  unwrapBusinessPayload,
} from "@/utils/businessPayload";
import { feedbackToast } from "@/utils/common";

const toRecord = (payload: unknown): BusinessRecord => {
  const unwrapped = unwrapBusinessPayload(payload);

  if (isBusinessRecord(unwrapped)) {
    const nested = [
      unwrapped.qr,
      unwrapped.qrInfo,
      unwrapped.qrCodeInfo,
      unwrapped.room,
      unwrapped.group,
      unwrapped.groupInfo,
      unwrapped.roomInfo,
      unwrapped.detail,
    ].find(isBusinessRecord);

    return {
      ...unwrapped,
      ...(nested ?? {}),
    };
  }

  const text = toBusinessText(unwrapped);
  return text ? { code: text } : {};
};

const getQRCodeCode = (record: BusinessRecord | null) =>
  record
    ? pickBusinessText(record, [
        "code",
        "shortCode",
        "qrCode",
        "qrcode",
        "ticket",
        "token",
        "shortUrl",
      ])
    : "";

const getQRCodeValue = (record: BusinessRecord | null) =>
  record
    ? pickBusinessText(record, [
        "url",
        "link",
        "deepLink",
        "qrUrl",
        "qrCodeUrl",
        "qrcodeUrl",
        "content",
      ]) ||
      getQRCodeCode(record)
    : "";

const getGroupName = (record: BusinessRecord | null) =>
  record
    ? pickBusinessText(record, ["groupName", "roomName", "name", "subject"])
    : "";

const getGroupId = (record: BusinessRecord | null) =>
  record
    ? pickBusinessText(record, [
        "roomId",
        "roomID",
        "groupID",
        "groupId",
        "id",
      ])
    : "";

const getGroupDescription = (record: BusinessRecord | null) =>
  record ? pickBusinessText(record, ["desc", "description", "remark", "notice"]) : "";

const parseCodeInput = (value: string) => {
  const raw = value.trim();

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    const hashQuery = url.hash.includes("?")
      ? url.hash.slice(url.hash.indexOf("?") + 1)
      : url.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hashQuery);

    return (
      url.searchParams.get("code") ||
      url.searchParams.get("qrCode") ||
      hashParams.get("code") ||
      hashParams.get("qrCode") ||
      url.pathname.split("/").filter(Boolean).pop() ||
      raw
    );
  } catch {
    return raw;
  }
};

const DEFAULT_EXPIRE_HOURS = 168;
const MAX_EXPIRE_HOURS = 720;

const GroupQRCodePanel = ({ roomId }: { roomId: string }) => {
  const [qrRecord, setQrRecord] = useState<BusinessRecord | null>(null);
  const [resolvedRecord, setResolvedRecord] = useState<BusinessRecord | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [resolvedCode, setResolvedCode] = useState("");
  const [applyReason, setApplyReason] = useState("");
  const [expireHours, setExpireHours] = useState<number | null>(
    DEFAULT_EXPIRE_HOURS,
  );
  const [loading, setLoading] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  const normalizedRoomId = roomId.trim();
  const qrCodeValue = useMemo(() => getQRCodeValue(qrRecord), [qrRecord]);
  const qrCodeCode = useMemo(() => getQRCodeCode(qrRecord), [qrRecord]);
  const canCreate = Boolean(normalizedRoomId);
  const canResolve = Boolean(parseCodeInput(inputCode));
  const canJoin = Boolean(resolvedCode);

  const copyValue = useCallback(
    (value: string) => {
      copyToClipboard(value);
      feedbackToast({ msg: t("toast.copySuccess") });
    },
    [copyToClipboard],
  );

  const generateQRCode = useCallback(async () => {
    if (!canCreate) {
      return;
    }

    setLoading(true);
    try {
      const response = await createOpenIMGroupQRCode({
        roomId: normalizedRoomId,
        ...(expireHours ? { expireHours } : {}),
      });
      setQrRecord(toRecord(response));
      feedbackToast();
    } catch (error) {
      feedbackToast({ error });
    } finally {
      setLoading(false);
    }
  }, [canCreate, expireHours, normalizedRoomId]);

  const confirmGenerateQRCode = useCallback(() => {
    modal.confirm({
      title: t("placeholder.generateGroupQRCode"),
      content: t("placeholder.confirmGenerateGroupQRCode"),
      onOk: generateQRCode,
    });
  }, [generateQRCode]);

  const resolveQRCode = useCallback(async () => {
    const code = parseCodeInput(inputCode);

    if (!code) {
      return;
    }

    setLoading(true);
    try {
      const response = await resolveOpenIMGroupQRCode(code);
      setResolvedCode(code);
      setResolvedRecord(toRecord(response));
    } catch (error) {
      setResolvedCode("");
      setResolvedRecord(null);
      feedbackToast({ error });
    } finally {
      setLoading(false);
    }
  }, [inputCode]);

  const joinByQRCode = useCallback(() => {
    if (!resolvedCode) {
      return;
    }

    modal.confirm({
      title: t("placeholder.qrCodeToGroup"),
      content: t("placeholder.confirmJoinGroupByQRCode"),
      onOk: async () => {
        try {
          await joinOpenIMGroupByQRCode({
            code: resolvedCode,
            ...(applyReason.trim() ? { applyReason: applyReason.trim() } : {}),
          });
          feedbackToast();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  }, [applyReason, resolvedCode]);

  const renderGroupInfo = () => {
    if (!resolvedRecord) {
      return <Empty description={t("empty.noSearchResults")} />;
    }

    const name = getGroupName(resolvedRecord);
    const id = getGroupId(resolvedRecord);
    const description = getGroupDescription(resolvedRecord);

    return (
      <div className="rounded border border-[var(--gap-text)] p-3 text-sm">
        <div className="font-medium">{name || t("placeholder.groupInfo")}</div>
        {id && (
          <div className="mt-2 text-xs text-[var(--sub-text)]">
            {`${t("placeholder.group")}ID: ${id}`}
          </div>
        )}
        {description && (
          <div className="mt-2 text-xs text-[var(--sub-text)]">{description}</div>
        )}
      </div>
    );
  };

  return (
    <Spin spinning={loading}>
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 text-sm font-medium">
            {t("placeholder.generateGroupQRCode")}
          </div>
          <Space.Compact className="w-full">
            <InputNumber
              min={1}
              max={MAX_EXPIRE_HOURS}
              className="w-32"
              value={expireHours}
              placeholder={t("placeholder.expireHours")}
              onChange={(value) =>
                setExpireHours(typeof value === "number" ? value : null)
              }
            />
            <Button
              type="primary"
              disabled={!canCreate}
              icon={<QrcodeOutlined rev={undefined} />}
              onClick={confirmGenerateQRCode}
            >
              {t("placeholder.generate")}
            </Button>
          </Space.Compact>
          {qrCodeValue && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <QRCode value={qrCodeValue} size={180} />
              <div className="max-w-full break-all text-center text-xs text-[var(--sub-text)]">
                {qrCodeCode || qrCodeValue}
              </div>
              <Button
                icon={<CopyOutlined rev={undefined} />}
                onClick={() => copyValue(qrCodeCode || qrCodeValue)}
              >
                {t("placeholder.copyQRCode")}
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">
            {t("placeholder.resolveGroupQRCode")}
          </div>
          <Space.Compact className="w-full">
            <Input
              value={inputCode}
              allowClear
              placeholder={t("placeholder.groupQRCodeContent")}
              onChange={(event) => setInputCode(event.target.value)}
              onPressEnter={() => void resolveQRCode()}
            />
            <Button
              type="primary"
              disabled={!canResolve}
              icon={<SearchOutlined rev={undefined} />}
              onClick={() => void resolveQRCode()}
            >
              {t("placeholder.search")}
            </Button>
          </Space.Compact>
          <Input.TextArea
            className="mt-3"
            rows={2}
            maxLength={100}
            value={applyReason}
            placeholder={t("placeholder.applyReason")}
            onChange={(event) => setApplyReason(event.target.value)}
          />
          <div className="mt-3">{renderGroupInfo()}</div>
          <div className="mt-3 flex justify-end">
            <Button type="primary" disabled={!canJoin} onClick={joinByQRCode}>
              {t("application.applyToJoin")}
            </Button>
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default memo(GroupQRCodePanel);
