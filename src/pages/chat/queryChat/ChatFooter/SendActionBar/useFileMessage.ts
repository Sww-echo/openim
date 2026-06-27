import { MessageItem } from "@openim/wasm-client-sdk";
import { v4 as uuidV4 } from "uuid";

import {
  type BusinessFileResource,
  compressImage,
  compressImageAsync,
  convertVideo,
  convertVideoAsync,
  generateFileThumbnail,
  getBusinessFileId,
  getUploadContext,
  normalizeBusinessFileResource,
  uploadFile as uploadBusinessFile,
} from "@/api/file";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import { BusinessRecord, pickExplicitBusinessRoomId } from "@/utils/businessPayload";

export interface FileWithPath extends File {
  path?: string;
}

const BUSINESS_FILE_EX_KEY = "openimBusinessFile";
type BusinessFileScene = "image" | "video" | "file";
type BusinessUploadScene = "common" | "image" | "room_share";

type BusinessFileMessageEx = {
  version: 1;
  scene: BusinessFileScene;
  uploadScene: BusinessUploadScene;
  roomId?: string;
  resource: BusinessFileResource;
  originalResource: BusinessFileResource;
  compressed?: boolean;
  converted?: boolean;
};

const normalizeBusinessId = (value?: string | number | null) =>
  String(value ?? "").trim();

const getBusinessUploadParams = (scene: BusinessFileScene) => {
  const { currentConversation, currentGroupInfo } = useConversationStore.getState();
  const groupID = normalizeBusinessId(currentConversation?.groupID);
  const roomId = normalizeBusinessId(
    pickExplicitBusinessRoomId(
      currentGroupInfo as BusinessRecord | undefined,
      groupID,
    ) || groupID,
  );
  const uploadScene: BusinessUploadScene =
    scene === "image" ? "image" : groupID && roomId ? "room_share" : "common";

  return {
    scene: uploadScene,
    roomId: roomId || undefined,
  };
};

const parseMessageEx = (ex?: string): Record<string, unknown> => {
  if (!ex) {
    return {};
  }

  try {
    const parsed = JSON.parse(ex);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : { legacyEx: ex };
  } catch {
    return { legacyEx: ex };
  }
};

const appendBusinessFileEx = (
  message: MessageItem,
  businessFile: BusinessFileMessageEx,
) => {
  message.ex = JSON.stringify({
    ...parseMessageEx(message.ex),
    [BUSINESS_FILE_EX_KEY]: businessFile,
  });
  return message;
};

const canGenerateBusinessThumbnail = (file: File) =>
  file.type.startsWith("image/") || file.type === "application/pdf";

const requestFileThumbnail = (fileId: string | number) => {
  void generateFileThumbnail(fileId).catch((error) => {
    console.warn("Failed to request business file thumbnail", error);
  });
};

const uploadBusinessResource = async (file: FileWithPath, scene: BusinessFileScene) => {
  const uploadParams = getBusinessUploadParams(scene);

  await getUploadContext(uploadParams);
  const originalResource = normalizeBusinessFileResource(
    await uploadBusinessFile(file, uploadParams),
    file,
  );
  const fileId = getBusinessFileId(originalResource);
  let processedResource: BusinessFileResource | undefined;

  if (fileId && canGenerateBusinessThumbnail(file)) {
    requestFileThumbnail(fileId);
  }

  if (fileId && scene === "image") {
    try {
      processedResource = normalizeBusinessFileResource(
        await compressImage({
          fileId,
          maxWidth: 1920,
        }),
        file,
      );
    } catch (error) {
      console.warn("Failed to compress uploaded image", error);
      void compressImageAsync({
        fileId,
        maxWidth: 1920,
      }).catch((asyncError) => {
        console.warn("Failed to request async image compression", asyncError);
      });
    }
  }
  if (fileId && scene === "video") {
    try {
      processedResource = normalizeBusinessFileResource(
        await convertVideo(fileId),
        file,
      );
    } catch (error) {
      console.warn("Failed to convert uploaded video", error);
      void convertVideoAsync(fileId).catch((asyncError) => {
        console.warn("Failed to request async video conversion", asyncError);
      });
    }
  }

  return {
    version: 1,
    scene,
    uploadScene: uploadParams.scene,
    roomId: uploadParams.roomId,
    resource: processedResource ?? originalResource,
    originalResource,
    compressed: scene === "image" ? Boolean(processedResource) : undefined,
    converted: scene === "video" ? Boolean(processedResource) : undefined,
  } satisfies BusinessFileMessageEx;
};

const createObjectUrl = (file: File) => URL.createObjectURL(file);

const createVideoSnapshot = (
  file: File,
): Promise<{
  duration: number;
  width: number;
  height: number;
  snapshotFile: File;
  snapshotUrl: string;
}> =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const videoUrl = createObjectUrl(file);
    let settled = false;

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
      video.removeAttribute("src");
      video.load();
    };

    const fail = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error instanceof Error ? error : new Error("Failed to read video file"));
    };

    const capture = () => {
      if (settled) {
        return;
      }

      const width = video.videoWidth || 320;
      const height = video.videoHeight || 180;
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (settled) {
            return;
          }
          if (!blob) {
            fail(new Error("Failed to create video snapshot"));
            return;
          }

          settled = true;
          cleanup();
          const snapshotFile = new File([blob], `${file.name}.jpg`, {
            type: "image/jpeg",
          });

          resolve({
            duration: Math.ceil(video.duration || 0),
            width,
            height,
            snapshotFile,
            snapshotUrl: createObjectUrl(snapshotFile),
          });
        },
        "image/jpeg",
        0.82,
      );
    };

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0.2) {
        video.currentTime = 0.1;
        return;
      }
      capture();
    };
    video.onseeked = capture;
    video.onloadeddata = capture;
    video.onerror = () => fail(new Error("Failed to load video file"));
    video.src = videoUrl;
  });

export function useFileMessage() {
  const getImageMessage = async (file: FileWithPath) => {
    const businessFile = await uploadBusinessResource(file, "image");
    const { width, height } = await getPicInfo(file);
    const baseInfo = {
      uuid: uuidV4(),
      type: file.type,
      size: file.size,
      width,
      height,
      url: createObjectUrl(file),
    };

    if (window.electronAPI) {
      const imageMessage = (await IMSDK.createImageMessageFromFullPath(file.path!))
        .data;
      imageMessage.pictureElem!.sourcePicture.url = baseInfo.url;
      return appendBusinessFileEx(imageMessage, businessFile);
    }
    const options = {
      sourcePicture: baseInfo,
      bigPicture: baseInfo,
      snapshotPicture: baseInfo,
      sourcePath: "",
      file,
    };

    return appendBusinessFileEx(
      (await IMSDK.createImageMessageByFile(options)).data,
      businessFile,
    );
  };

  const getVideoMessage = async (file: FileWithPath) => {
    const [businessFile, snapshot] = await Promise.all([
      uploadBusinessResource(file, "video"),
      createVideoSnapshot(file),
    ]);
    const videoUrl = createObjectUrl(file);
    const videoMessage = (
      await IMSDK.createVideoMessageByFile({
        videoPath: "",
        duration: snapshot.duration,
        videoType: file.type,
        snapshotPath: "",
        videoUUID: uuidV4(),
        videoUrl,
        videoSize: file.size,
        snapshotUUID: uuidV4(),
        snapshotSize: snapshot.snapshotFile.size,
        snapshotUrl: snapshot.snapshotUrl,
        snapshotWidth: snapshot.width,
        snapshotHeight: snapshot.height,
        snapShotType: snapshot.snapshotFile.type,
        videoFile: file,
        snapshotFile: snapshot.snapshotFile,
      })
    ).data;

    return appendBusinessFileEx(videoMessage, businessFile);
  };

  const getFileMessage = async (file: FileWithPath) => {
    const businessFile = await uploadBusinessResource(file, "file");
    const fileMessage = (
      await IMSDK.createFileMessageByFile({
        filePath: "",
        fileName: file.name,
        uuid: uuidV4(),
        sourceUrl: createObjectUrl(file),
        fileSize: file.size,
        fileType: file.type,
        file,
      })
    ).data;

    return appendBusinessFileEx(fileMessage, businessFile);
  };

  const getPicInfo = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const _URL = window.URL || window.webkitURL;
      const img = new Image();
      const objectUrl = _URL.createObjectURL(file);
      img.onload = function () {
        _URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = function () {
        _URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to read image metadata"));
      };
      img.src = objectUrl;
    });

  return {
    getImageMessage,
    getVideoMessage,
    getFileMessage,
  };
}
