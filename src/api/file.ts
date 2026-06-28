import { t } from "i18next";

import businessRequest from "./business";

type ApiPayload = Record<string, unknown>;

export interface FileSignParams {
  fileId: string | number;
  resourceId?: string | number;
  url?: string;
  mode?: "download" | "preview" | string;
  [key: string]: unknown;
}

export interface SignedFileParams extends FileSignParams {
  expiresAt: string | number;
  signature: string;
}

export interface FileListParams {
  roomId?: string | number;
  pageIndex?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface CompressImageParams {
  fileId: string | number;
  maxWidth?: number;
}

export interface FileReferenceInvalidateParams {
  fileId: string | number;
  reason: "message_withdraw" | "message_destroy";
}

export interface BusinessFileResource {
  fileId?: string | number;
  resourceId?: string | number;
  id?: string | number;
  url?: string;
  previewUrl?: string;
  downloadUrl?: string;
  fileName?: string;
  name?: string;
  originalName?: string;
  fileSize?: number;
  size?: number;
  contentType?: string;
  mimeType?: string;
  ext?: string;
  raw?: unknown;
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is ApiPayload =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const emptyFileResponse = () => Promise.resolve({});

const normalizeFileText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const normalizeFileNumber = (value: unknown) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  ) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeFileParams = (params?: object | null) =>
  Object.entries(params ?? {}).reduce((nextParams, [key, value]) => {
    if (value === undefined || value === null) {
      return nextParams;
    }
    if (typeof value === "string") {
      const text = value.trim();
      if (text) {
        nextParams[key] = text;
      }
      return nextParams;
    }
    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        nextParams[key] = value;
      }
      return nextParams;
    }

    nextParams[key] = value;
    return nextParams;
  }, {} as Record<string, unknown>);

const unwrapApiPayload = (value: unknown): unknown => {
  let current = value;
  const seen = new Set<unknown>();

  while (isRecord(current) && !seen.has(current)) {
    seen.add(current);
    const currentRecord = current;
    const wrapperKey = ["data", "result", "obj"].find(
      (key) => currentRecord[key] !== undefined && currentRecord[key] !== null,
    );
    if (!wrapperKey) {
      break;
    }
    current = currentRecord[wrapperKey];
  }

  return current;
};

const hasFileLikeField = (value: ApiPayload) =>
  [
    "fileId",
    "fileID",
    "file_id",
    "resourceId",
    "id",
    "url",
    "fileUrl",
    "previewUrl",
    "downloadUrl",
    "sourceUrl",
  ].some((key) => value[key] !== undefined && value[key] !== null);

const findFileRecord = (value: unknown, depth = 0): ApiPayload | undefined => {
  if (depth > 3) {
    return undefined;
  }

  const payload = unwrapApiPayload(value);
  if (Array.isArray(payload)) {
    return payload
      .map((item) => findFileRecord(item, depth + 1))
      .find((item): item is ApiPayload => Boolean(item));
  }
  if (!isRecord(payload)) {
    return undefined;
  }
  if (hasFileLikeField(payload)) {
    return payload;
  }

  return ["file", "fileInfo", "resource", "resourceInfo", "detail", "item"]
    .map((key) => findFileRecord(payload[key], depth + 1))
    .find((item): item is ApiPayload => Boolean(item));
};

const pickString = (value: ApiPayload, keys: string[]) => {
  const picked = keys
    .map((key) => value[key])
    .find((item) => typeof item === "string" && item.trim().length > 0);

  return typeof picked === "string" ? picked.trim() : undefined;
};

const pickId = (value: ApiPayload, keys: string[]) => {
  const picked = keys
    .map((key) => value[key])
    .find(
      (item): item is string | number =>
        typeof item === "number" ||
        (typeof item === "string" && item.trim().length > 0),
    );

  return typeof picked === "string" ? picked.trim() : picked;
};

const pickNumber = (value: ApiPayload, keys: string[]) => {
  const picked = keys
    .map((key) => value[key])
    .find((item) => typeof item === "number" || typeof item === "string");
  const numberValue = Number(picked);

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

export const normalizeBusinessFileResource = (
  response: unknown,
  fallback?: Pick<File, "name" | "size" | "type">,
): BusinessFileResource => {
  const payload = unwrapApiPayload(response);

  if (typeof payload === "string") {
    return {
      url: payload.trim(),
      fileName: fallback?.name,
      fileSize: fallback?.size,
      contentType: fallback?.type,
      raw: response,
    };
  }

  const record = findFileRecord(response) ?? {};

  return {
    ...record,
    fileId: pickId(record, ["fileId", "fileID", "file_id", "id", "resourceId"]),
    resourceId: pickId(record, ["resourceId", "fileId", "id"]),
    id: pickId(record, ["id", "fileId", "resourceId"]),
    url: pickString(record, ["url", "fileUrl", "sourceUrl", "path"]),
    previewUrl: pickString(record, ["previewUrl", "preview", "thumbnailUrl"]),
    downloadUrl: pickString(record, ["downloadUrl", "download"]),
    fileName:
      pickString(record, ["fileName", "filename", "name", "originalName"]) ??
      fallback?.name,
    name: pickString(record, ["name", "fileName", "originalName"]) ?? fallback?.name,
    originalName:
      pickString(record, ["originalName", "originName", "fileName", "name"]) ??
      fallback?.name,
    fileSize: pickNumber(record, ["fileSize", "size"]) ?? fallback?.size,
    size: pickNumber(record, ["size", "fileSize"]) ?? fallback?.size,
    contentType:
      pickString(record, ["contentType", "mimeType", "type"]) ?? fallback?.type,
    mimeType: pickString(record, ["mimeType", "contentType", "type"]) ?? fallback?.type,
    raw: response,
  };
};

export const getBusinessFileId = (resource?: BusinessFileResource) =>
  normalizeFileText(resource?.fileId ?? resource?.resourceId ?? resource?.id) ||
  undefined;

export const getBusinessFileFromMessageEx = (ex?: string) => {
  if (!ex) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(ex) as ApiPayload;
    const businessFile = parsed.openimBusinessFile;

    if (!isRecord(businessFile)) {
      return undefined;
    }

    return normalizeBusinessFileResource(businessFile.resource ?? businessFile);
  } catch {
    return undefined;
  }
};

const normalizeSignParams = (
  response: unknown,
  fallback: FileSignParams,
): FileSignParams => {
  const payload = unwrapApiPayload(response);

  if (typeof payload === "string") {
    return {
      ...fallback,
      fileId: normalizeFileText(fallback.fileId),
      resourceId: normalizeFileText(fallback.resourceId) || undefined,
      url: payload.trim(),
      mode: normalizeFileText(fallback.mode) || undefined,
    };
  }

  if (!isRecord(payload)) {
    return {
      ...fallback,
      fileId: normalizeFileText(fallback.fileId),
      resourceId: normalizeFileText(fallback.resourceId) || undefined,
      url: normalizeFileText(fallback.url) || undefined,
      mode: normalizeFileText(fallback.mode) || undefined,
    };
  }

  const normalizedPayload = normalizeFileParams(payload);

  return {
    ...fallback,
    ...normalizedPayload,
    fileId: normalizeFileText(normalizedPayload.fileId ?? fallback.fileId),
    resourceId:
      normalizeFileText(normalizedPayload.resourceId ?? fallback.resourceId) ||
      undefined,
    url: normalizeFileText(normalizedPayload.url ?? fallback.url) || undefined,
    mode: normalizeFileText(normalizedPayload.mode ?? fallback.mode) || undefined,
  };
};

const isSignedFileParams = (value: FileSignParams): value is SignedFileParams =>
  Boolean(normalizeFileText(value.fileId)) &&
  Boolean(normalizeFileText(value.expiresAt)) &&
  Boolean(normalizeFileText(value.signature));

const assertSignedFileParams = (value: FileSignParams): SignedFileParams => {
  if (!isSignedFileParams(value)) {
    throw new Error(t("toast.downloadFailed"));
  }

  return {
    ...value,
    fileId: normalizeFileText(value.fileId),
    resourceId: normalizeFileText(value.resourceId) || undefined,
    url: normalizeFileText(value.url) || undefined,
    mode: normalizeFileText(value.mode) || undefined,
    expiresAt: normalizeFileText(value.expiresAt),
    signature: normalizeFileText(value.signature),
  };
};

const getBlobFromResponse = (response: unknown) => {
  if (response instanceof Blob) {
    return response;
  }
  const payload = unwrapApiPayload(response);
  return payload instanceof Blob ? payload : undefined;
};

const shouldInspectBlobAsText = (blob: Blob) => {
  const contentType = blob.type.toLowerCase();

  return (
    contentType.includes("json") ||
    contentType.includes("text") ||
    (!contentType && blob.size > 0 && blob.size <= 64 * 1024)
  );
};

const isBusinessErrorPayload = (value: unknown) => {
  if (!isRecord(value)) {
    return false;
  }

  const resultCode = value.resultCode;
  const errCode = value.errCode;

  return (
    (resultCode !== undefined && Number(resultCode) !== 1) ||
    (errCode !== undefined && Number(errCode) !== 0) ||
    Boolean(
      normalizeFileText(value.reasonText) ||
        normalizeFileText(value.resultMsg) ||
        normalizeFileText(value.errMsg) ||
        normalizeFileText(value.msg) ||
        value.fieldErrors,
    )
  );
};

const ensureSuccessFileBlob = async (response: unknown) => {
  const blob = getBlobFromResponse(response);

  if (!blob || !shouldInspectBlobAsText(blob)) {
    return blob;
  }

  try {
    const parsed = JSON.parse(await blob.text()) as unknown;

    if (
      isBusinessErrorPayload(parsed) ||
      isBusinessErrorPayload(unwrapApiPayload(parsed))
    ) {
      throw parsed;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return blob;
    }
    throw error;
  }

  return blob;
};

export const getSignedFilePreviewUrl = async (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return undefined;
  }

  const signParams = normalizeSignParams(
    await signFile({ fileId: normalizedFileId, mode: "preview" }),
    {
      fileId: normalizedFileId,
      mode: "preview",
    },
  );

  const previewUrl = normalizeFileText(signParams.url);
  if (previewUrl) {
    return previewUrl;
  }

  const previewResponse = await previewFileBySign(assertSignedFileParams(signParams));
  const previewBlob = await ensureSuccessFileBlob(previewResponse);

  return previewBlob ? URL.createObjectURL(previewBlob) : undefined;
};

export const getSignedFileDownloadUrl = async (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return undefined;
  }

  const signParams = normalizeSignParams(
    await signFile({ fileId: normalizedFileId, mode: "download" }),
    {
      fileId: normalizedFileId,
      mode: "download",
    },
  );

  const downloadUrl = normalizeFileText(signParams.url);
  if (downloadUrl) {
    return {
      url: downloadUrl,
      revoke: undefined,
    };
  }

  const downloadResponse = await downloadFileBySign(assertSignedFileParams(signParams));
  const downloadBlob = await ensureSuccessFileBlob(downloadResponse);

  if (!downloadBlob) {
    return undefined;
  }

  const url = URL.createObjectURL(downloadBlob);
  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  };
};

export const triggerBusinessFileDownload = async (
  fileId: string | number,
  fileName?: string,
) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    throw new Error(t("toast.downloadFailed"));
  }

  const signedFile = await getSignedFileDownloadUrl(normalizedFileId);

  if (!signedFile?.url) {
    throw new Error(t("toast.downloadFailed"));
  }

  const linkNode = document.createElement("a");
  linkNode.style.display = "none";
  linkNode.href = signedFile.url;
  const normalizedFileName = normalizeFileText(fileName);
  if (normalizedFileName) {
    linkNode.download = normalizedFileName;
  }
  document.body.appendChild(linkNode);
  linkNode.click();
  document.body.removeChild(linkNode);
  if (signedFile.revoke) {
    window.setTimeout(signedFile.revoke, 0);
  }
};

export const getUploadContext = (params?: Record<string, unknown>) =>
  businessRequest.get<unknown>("/file/upload/context", {
    params: normalizeFileParams(params),
  });

export const uploadFile = (
  file: File,
  params: Record<string, string | number | undefined> = {},
) => {
  if (!(file instanceof File)) {
    return emptyFileResponse();
  }

  const formData = new FormData();
  formData.append("file", file);

  return businessRequest.post<unknown>("/file/upload", formData, {
    params: normalizeFileParams(params),
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const signFile = (params: FileSignParams) => {
  const normalizedParams = normalizeFileParams(params);
  const fileId = normalizeFileText(normalizedParams.fileId);
  if (!fileId) {
    return emptyFileResponse();
  }

  return businessRequest.get<unknown>("/file/sign", {
    params: {
      ...normalizedParams,
      fileId,
    },
  });
};

export const downloadFileBySign = (params: SignedFileParams) => {
  const normalizedParams = normalizeFileParams(params);
  const signedParams = {
    ...params,
    ...normalizedParams,
    fileId: normalizeFileText(normalizedParams.fileId),
    expiresAt: normalizeFileText(normalizedParams.expiresAt),
    signature: normalizeFileText(normalizedParams.signature),
  };
  if (!isSignedFileParams(signedParams)) {
    return emptyFileResponse();
  }

  return businessRequest.get<Blob>("/file/download", {
    params: signedParams,
    responseType: "blob",
  });
};

export const previewFileBySign = (params: SignedFileParams) => {
  const normalizedParams = normalizeFileParams(params);
  const signedParams = {
    ...params,
    ...normalizedParams,
    fileId: normalizeFileText(normalizedParams.fileId),
    expiresAt: normalizeFileText(normalizedParams.expiresAt),
    signature: normalizeFileText(normalizedParams.signature),
  };
  if (!isSignedFileParams(signedParams)) {
    return emptyFileResponse();
  }

  return businessRequest.get<Blob>("/file/preview", {
    params: signedParams,
    responseType: "blob",
  });
};

export const compressImage = (params: CompressImageParams) => {
  const fileId = normalizeFileText(params.fileId);
  if (!fileId) {
    return emptyFileResponse();
  }
  const normalizedParams = {
    ...normalizeFileParams(params),
    fileId,
  };
  const maxWidth = normalizeFileNumber(params.maxWidth);
  if (maxWidth !== undefined) {
    normalizedParams.maxWidth = maxWidth;
  }

  return businessRequest.post<unknown>("/file/compress", undefined, {
    params: normalizedParams,
  });
};

export const compressImageAsync = (params: CompressImageParams) => {
  const fileId = normalizeFileText(params.fileId);
  if (!fileId) {
    return emptyFileResponse();
  }
  const normalizedParams = {
    ...normalizeFileParams(params),
    fileId,
  };
  const maxWidth = normalizeFileNumber(params.maxWidth);
  if (maxWidth !== undefined) {
    normalizedParams.maxWidth = maxWidth;
  }

  return businessRequest.post<unknown>("/file/compress/async", undefined, {
    params: normalizedParams,
  });
};

export const convertVideo = (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return emptyFileResponse();
  }

  return businessRequest.post<unknown>("/file/convert", undefined, {
    params: {
      fileId: normalizedFileId,
    },
  });
};

export const convertVideoAsync = (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return emptyFileResponse();
  }

  return businessRequest.post<unknown>("/file/convert/async", undefined, {
    params: {
      fileId: normalizedFileId,
    },
  });
};

export const generateFileThumbnail = (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return emptyFileResponse();
  }

  return businessRequest.post<unknown>("/file/thumbnail", undefined, {
    params: {
      fileId: normalizedFileId,
    },
  });
};

export const getFileResources = (params: FileListParams = {}) =>
  businessRequest.get<unknown>("/file/resources", {
    params: {
      pageIndex: 0,
      pageSize: 20,
      ...normalizeFileParams(params),
    },
  });

export const getFileResourceDetail = (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return emptyFileResponse();
  }

  return businessRequest.get<unknown>("/file/resources/detail", {
    params: {
      fileId: normalizedFileId,
    },
  });
};

export const getFileResourceReferences = (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return emptyFileResponse();
  }

  return businessRequest.get<unknown>("/file/resources/references", {
    params: {
      fileId: normalizedFileId,
    },
  });
};

export const getFileStorageOverview = () =>
  businessRequest.get<unknown>("/file/storage/overview");

export const getRoomFileStorageOverview = (roomId: string | number) => {
  const normalizedRoomId = normalizeFileText(roomId);
  if (!normalizedRoomId) {
    return emptyFileResponse();
  }

  return businessRequest.get<unknown>("/file/storage/room-overview", {
    params: {
      roomId: normalizedRoomId,
    },
  });
};

export const deleteFileResource = (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return emptyFileResponse();
  }

  return businessRequest.post<unknown>("/file/delete", undefined, {
    params: {
      fileId: normalizedFileId,
    },
  });
};

export const invalidateFileReference = (params: FileReferenceInvalidateParams) => {
  const fileId = normalizeFileText(params.fileId);
  const reason = normalizeFileText(params.reason);
  if (!fileId || !reason) {
    return emptyFileResponse();
  }

  return businessRequest.post<unknown>("/file/reference/invalidate", undefined, {
    params: {
      ...normalizeFileParams(params),
      fileId,
      reason,
    },
  });
};

export const getFileReferenceStatus = (fileId: string | number) => {
  const normalizedFileId = normalizeFileText(fileId);
  if (!normalizedFileId) {
    return emptyFileResponse();
  }

  return businessRequest.get<unknown>("/file/reference/status", {
    params: {
      fileId: normalizedFileId,
    },
  });
};
