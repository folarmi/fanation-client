/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { MediaItem } from "@/utils/types";
import { useState } from "react";
import { useFileUpload } from "./api/use-file-upoad";

interface UseUploadFilesOptions {
  usid?: string;
  onSuccess?: (mediaItems: MediaItem[]) => void;
  onError?: (error: Error) => void;
}

interface UseUploadFilesReturn {
  uploadFiles: (files: File[]) => Promise<MediaItem[]>;
  isUploading: boolean;
  uploadedFiles: MediaItem[];
  reset: () => void;
}

export const useUploadFiles = (
  options?: UseUploadFilesOptions,
): UseUploadFilesReturn => {
  const [uploadedFiles, setUploadedFiles] = useState<MediaItem[]>([]);

  const { mutate: uploadPostWithPictures, isPending: isUploading } =
    useFileUpload({
      url: "files/upload-multiple",
      onSuccess: (data) => {
        return data?.message || "File uploaded successfully!";
      },
      errorToast: (error: any) =>
        error.response?.data?.message || "Upload failed",
    });

  const uploadFiles = async (files: File[]): Promise<MediaItem[]> => {
    if (!files || files.length === 0) {
      return [];
    }

    const mediaLinks: MediaItem[] = [];

    try {
      // Upload all files in a single request
      const result = await new Promise<any>((resolve, reject) => {
        uploadPostWithPictures(
          {
            files: files,
            extraData: {
              usid: options?.usid,
            },
          },
          {
            onSuccess: (data) => resolve(data),
            onError: (error) => reject(error),
          },
        );
      });

      // Process the response body array
      if (result?.body && Array.isArray(result.body)) {
        result.body.forEach((item: any, index: number) => {
          const file = files[index];
          const mediaType = file.type.startsWith("image/")
            ? "PHOTO"
            : file.type.startsWith("video/")
              ? "VIDEO"
              : file.type.startsWith("audio/")
                ? "AUDIO"
                : "DOCUMENT";

          mediaLinks?.push({
            mediaType,
            mediaLink: item.url,
          });
        });
      }

      setUploadedFiles(mediaLinks);
      options?.onSuccess?.(mediaLinks);

      return mediaLinks;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to upload files");
      options?.onError?.(error);
      throw error;
    } finally {
    }
  };

  const reset = () => {
    setUploadedFiles([]);
  };

  return {
    uploadFiles,
    isUploading,
    uploadedFiles,
    reset,
  };
};
