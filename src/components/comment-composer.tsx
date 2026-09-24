// src/components/post-card/CommentComposer.tsx
//
// The new design's version of the old project's CommentBox, scoped to
// replying to a post: mentions + media attachments carried over as
// functionality, poll/voice-note/schedule intentionally left out (see the
// note on PostToolbar.tsx) since those belong to the top-level post composer.

import { useRef, useState } from "react";
import { Avatar, Icon } from "@/lib/ui";

import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";
import { useMentions, useMentionUsers } from "@/hooks/useMentions";
import { useUploadFiles } from "@/hooks/useUploadFiles";
import { getMediaType } from "@/utils/helper";
import { MentionDropdown } from "./mention-dropdown";
import { MediaAttachments } from "./media-attachements";
import { useAppStore } from "@/lib/core";
import { MediaItem } from "@/utils/types";

const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export interface CommentSubmitPayload {
  message: string;
  mentions: string[];
  mediaFiles: MediaItem[];
  mediaType?: string;
}

export function CommentComposer({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (payload: CommentSubmitPayload) => void;
  isSubmitting?: boolean;
}) {
  const { userObject } = useAppSelector((s: RootState) => s.auth);
  const toast = useAppStore((s) => s.toast);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);

  const { mentionableUsers, isLoading: mentionUsersLoading } =
    useMentionUsers();
  const {
    mentionQuery,
    filteredUsers,
    highlightedIndex,
    dropdownPos,
    handleTextareaChange,
    handleKeyDown,
    pickMention,
    closeMentionDropdown,
    mentionIds,
  } = useMentions(textareaRef, mentionableUsers);

  const {
    uploadFiles,
    isUploading,
    reset: resetUpload,
  } = useUploadFiles({
    usid: userObject?.usid,
    onError: (error: any) =>
      toast(error?.message || "Something went wrong", "err"),
  });

  const totalMB = formatMB(queuedFiles.reduce((sum, f) => sum + f.size, 0));

  const addFiles = (incoming: File[]) => {
    const oversized = incoming.filter((f) => f.size > MAX_FILE_BYTES);
    const withinLimit = incoming.filter((f) => f.size <= MAX_FILE_BYTES);

    if (oversized.length) {
      toast(
        `${oversized.map((f) => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the 10MB per-file limit`,
        "err",
      );
      SVGAElement;
    }
    if (!withinLimit.length) return;

    const currentTotal = queuedFiles.reduce((sum, f) => sum + f.size, 0);
    const incomingTotal = withinLimit.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + incomingTotal > MAX_TOTAL_BYTES) {
      const remaining = MAX_TOTAL_BYTES - currentTotal;
      toast(
        remaining <= 0
          ? "You've reached the 50MB total upload limit"
          : `Adding these files would exceed the 50MB total limit (${formatMB(remaining)}MB remaining)`,
        "err",
      );
      return;
    }

    setQueuedFiles((prev) => [...prev, ...withinLimit]);
  };

  const removeFile = (index: number) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit =
    (text.trim().length > 0 || queuedFiles.length > 0) &&
    !isSubmitting &&
    !isUploading;

  const submit = async () => {
    if (!canSubmit) return;

    if (queuedFiles.length > 0) {
      try {
        const mediaLinks = await uploadFiles(queuedFiles);
        onSubmit({
          message: text.trim(),
          mentions: mentionIds,
          mediaFiles: mediaLinks,
          mediaType: getMediaType(queuedFiles),
        });
        setQueuedFiles([]);
        resetUpload();
      } catch (error) {
        console.error("Upload failed:", error);
        return;
      }
    } else {
      onSubmit({ message: text.trim(), mentions: mentionIds, mediaFiles: [] });
    }

    setText("");
  };

  return (
    <div className="col gap8" style={{ marginTop: 8 }}>
      <div className="row gap10" style={{ alignItems: "flex-start" }}>
        <Avatar name="You" size={32} />
        <div className="grow" style={{ position: "relative" }}>
          <textarea
            ref={textareaRef}
            className="input"
            placeholder="Add a comment…"
            rows={1}
            value={text}
            style={{ padding: "9px 13px", resize: "none", width: "100%" }}
            onChange={(e) => {
              setText(e.target.value);
              handleTextareaChange(
                e.target.value,
                e.target.selectionStart ?? 0,
              );
            }}
            onKeyDown={(e) => {
              // Enter submits when the mention dropdown isn't consuming it;
              // useMentions' handleKeyDown calls preventDefault when it does.
              handleKeyDown(e, text, setText);
              if (e.key === "Enter" && !e.shiftKey && mentionQuery === null) {
                e.preventDefault();
                submit();
              }
            }}
          />
          {mentionQuery !== null && (
            <MentionDropdown
              candidates={filteredUsers}
              isLoading={mentionUsersLoading}
              highlightedIndex={highlightedIndex}
              position={dropdownPos}
              onSelect={(user) => pickMention(user, text, setText)}
              onClose={closeMentionDropdown}
            />
          )}
        </div>
        <button
          className="btn btn-blue btn-sm"
          disabled={!canSubmit}
          onClick={submit}
        >
          <Icon n="send" s={15} />
        </button>
      </div>

      <div className="row gap16" style={{ paddingLeft: 42 }}>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          id="comment-media-input"
          style={{ display: "none" }}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) addFiles(files);
            e.target.value = "";
          }}
        />
        <label
          htmlFor="comment-media-input"
          className="muted"
          style={{ cursor: "pointer" }}
        >
          <Icon n="camera" s={17} solid />
        </label>
      </div>

      <div style={{ paddingLeft: 42 }}>
        <MediaAttachments
          files={queuedFiles}
          onRemove={removeFile}
          totalMB={totalMB}
          maxMB={50}
        />
      </div>
    </div>
  );
}
