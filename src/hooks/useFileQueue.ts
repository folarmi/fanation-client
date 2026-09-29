// src/hooks/useFileQueue.ts
//
// The attachment queue behind every composer (post, comment, reply): which
// files are waiting to upload, and the rules for letting one in. Lifted out of
// the old CommentBox so the post composer and the comment composer share ONE
// copy instead of each carrying their own.
//
// Rules, all from the old project:
//   - accepted types: the list from PostUploader
//   - 10MB per file, 50MB per post (CommentBox's guards — stricter than
//     PostUploader's own 20MB, so these are the effective limits)

import { useRef, useState } from "react";
import { useNotify } from "@/hooks/useNotify";

export const ACCEPTED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "pdf",
  "doc",
  "docx",
  "txt",
  "mp3",
  "wav",
  "aac",
  "m4a",
  "ogg",
];
/** For <input type="file" accept=...> */
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",");

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export function useFileQueue() {
  const notify = useNotify();
  const [files, setFiles] = useState<File[]>([]);
  // The ref lets several addFiles() calls in one tick each see the latest list
  // (state alone would be stale) — the old CommentBox did the same.
  const filesRef = useRef<File[]>([]);

  const commit = (next: File[]) => {
    filesRef.current = next;
    setFiles(next);
  };

  const addFiles = (incoming: File[]) => {
    const extOf = (f: File) => f.name.split(".").pop()?.toLowerCase() ?? "";

    const unsupported = incoming.filter(
      (f) => !ACCEPTED_EXTENSIONS.includes(extOf(f)),
    );
    if (unsupported.length) {
      notify.error(
        `${unsupported.map((f) => f.name).join(", ")} isn't a supported file type`,
      );
    }
    const supported = incoming.filter((f) =>
      ACCEPTED_EXTENSIONS.includes(extOf(f)),
    );

    const oversized = supported.filter((f) => f.size > MAX_FILE_BYTES);
    if (oversized.length) {
      notify.error(
        `${oversized.map((f) => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the 10MB per-file limit`,
      );
    }
    const withinLimit = supported.filter((f) => f.size <= MAX_FILE_BYTES);
    if (!withinLimit.length) return;

    const currentTotal = filesRef.current.reduce((sum, f) => sum + f.size, 0);
    const incomingTotal = withinLimit.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + incomingTotal > MAX_TOTAL_BYTES) {
      const remaining = MAX_TOTAL_BYTES - currentTotal;
      notify.error(
        remaining <= 0
          ? "You've reached the 50MB total upload limit for this post"
          : `Adding these files would exceed the 50MB total limit (${mb(remaining)}MB remaining)`,
      );
      return;
    }

    commit([...filesRef.current, ...withinLimit]);
  };

  const removeFile = (index: number) =>
    commit(filesRef.current.filter((_, i) => i !== index));
  const clear = () => commit([]);

  return {
    files,
    addFiles,
    removeFile,
    clear,
    totalMB: mb(files.reduce((sum, f) => sum + f.size, 0)),
  };
}
