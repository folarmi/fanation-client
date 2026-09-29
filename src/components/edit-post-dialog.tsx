// src/components/post-card/EditPostDialog.tsx
//
// The new design's version of the old EditPost. Same flow: change the text,
// remove media the post already has, add new files (or a voice note), Save.
// On save the NEW files are uploaded first, then one request replaces the
// post's text and its whole media list (media kept + media uploaded).
//
// Differences from the old one, all deliberate:
//   - It takes the post as a prop instead of re-fetching it. The old fetch used
//     the query key ["GetContentsById"] with no post id in it, so every post
//     shared ONE cache entry and Edit could open with another post's text.
//   - New files go through the same rules as the composer (types, 10MB per
//     file, 50MB total). The old one added anything.
//   - A post can be saved with no text if it has media — the same rule as
//     creating one. (The old form required text even on a media-only post, so
//     such a post couldn't be edited at all.)
//   - The post's existing `mentions` are sent back. The old one sent `[]`,
//     which — if the server replaces the list — wiped them on every edit.
//   - The author's name/photo come from the post; no separate profile fetch.

import { useState } from "react";
import { Avatar, Icon } from "@/lib/ui";
import { useUploadFiles } from "@/hooks/useUploadFiles"; // port from the old project if it isn't in the new one yet
import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";
import type { MediaFile, MediaItem } from "@/utils/types";
import { useNotify } from "@/hooks/useNotify";
import { useFileQueue } from "@/hooks/useFileQueue";
import { useEditPost } from "@/hooks/useContentInteractions";
import { mapMedia, type RawContent } from "@/lib/adapters/content";
import { PostToolbar } from "./post-toolbar";
import { MediaAttachments } from "./media-attachements";
import { VoiceRecorderModal } from "./VoiceRecorderModal";

export function EditPostDialog({
  raw,
  onClose,
}: {
  raw: RawContent;
  onClose: () => void;
}) {
  const notify = useNotify();
  const { userObject } = useAppSelector((s: RootState) => s.auth);

  const [text, setText] = useState(raw.message ?? "");
  // Media the post already has. Only what the API needs is kept — the old
  // EditPost trimmed each item to { mediaType, mediaLink } the same way.
  const [existing, setExisting] = useState<MediaItem[]>(() =>
    (raw.mediaFiles ?? []).map(
      (m) => ({ mediaType: m.mediaType, mediaLink: m.mediaLink }) as MediaItem,
    ),
  );
  const [recorderOpen, setRecorderOpen] = useState(false);
  const { files, addFiles, removeFile, totalMB } = useFileQueue();

  const { uploadFiles, isUploading } = useUploadFiles({
    usid: userObject?.usid,
    onError: (error: any) => notify.error(error?.message || "Upload failed"),
  });
  const { savePost, isSaving: isPosting } = useEditPost(raw.publicId, onClose);

  const busy = isPosting || isUploading;
  const hasMedia = existing.length > 0 || files.length > 0;
  const canSave = (text.trim().length > 0 || hasMedia) && !busy;

  const removeExisting = (index: number) =>
    setExisting((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    if (!text.trim() && !hasMedia) {
      notify.error("Post message or media is required");
      return;
    }
    if (busy) return;
    try {
      const uploaded = files.length > 0 ? await uploadFiles(files) : [];
      savePost({
        message: text.trim(),
        mentions: raw.mentions ?? [],
        mediaFiles: [...existing, ...uploaded],
      });
    } catch (error) {
      console.error("Failed to update post:", error); // useUploadFiles' onError already told the user
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    const ext = blob.type.includes("mp4")
      ? "m4a"
      : blob.type.includes("ogg")
        ? "ogg"
        : "webm";
    addFiles([
      new File([blob], `voice-note-${Date.now()}.${ext}`, { type: blob.type }),
    ]);
    notify.success("Voice note added successfully");
  };

  const removeBtn: React.CSSProperties = {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "rgba(0,0,0,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    // stopPropagation: this is rendered inside a card whose own click navigates
    // to the post — nothing in here should trigger that.
    <div onClick={(e) => e.stopPropagation()}>
      <div
        className="overlay"
        style={{ background: "rgba(2,4,12,.72)" }}
        onClick={() => !busy && onClose()}
      >
        <div
          className="card col gap12"
          style={{
            padding: 20,
            width: 640,
            maxWidth: "94vw",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="row between">
            <div className="row gap12">
              <Avatar
                name={raw.creator?.name}
                src={raw.creator?.profilePic}
                size={40}
              />
              <div className="col">
                <span className="b7 t14 uname">{raw.creator?.name}</span>
                <span className="muted t13">@{raw.creator?.username}</span>
              </div>
            </div>
            <button
              type="button"
              className="muted"
              aria-label="Cancel editing"
              disabled={busy}
              onClick={onClose}
            >
              <Icon n="x" s={20} />
            </button>
          </div>

          <textarea
            className="input"
            rows={5}
            autoFocus
            value={text}
            placeholder="Edit your post…"
            style={{ resize: "none", width: "100%" }}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Media the post already has — each can be removed */}
          {existing.length > 0 && (
            <div className="row gap8" style={{ flexWrap: "wrap" }}>
              {existing.map((item, i) => {
                const media = mapMedia(item as unknown as MediaFile);
                const key = `${item.mediaLink}-${i}`;

                if (media.isVisual) {
                  return (
                    <div
                      key={key}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 10,
                        overflow: "hidden",
                        position: "relative",
                        background: "#000",
                        flex: "none",
                      }}
                    >
                      {media.isVideo ? (
                        <video
                          src={media.url}
                          muted
                          preload="metadata"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <img
                          src={media.url}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      {media.isVideo && (
                        <div
                          className="row center"
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,.25)",
                          }}
                        >
                          <Icon n="play" s={20} c="#fff" fill="#fff" />
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label="Remove attachment"
                        disabled={busy}
                        style={removeBtn}
                        onClick={() => removeExisting(i)}
                      >
                        <Icon n="x" s={12} c="#fff" />
                      </button>
                    </div>
                  );
                }

                // audio / documents don't fit a tile — a player or a chip, full width
                return (
                  <div
                    key={key}
                    className="row gap8 pill"
                    style={{ padding: "6px 10px", flexBasis: "100%" }}
                  >
                    {media.kind === "AUDIO" ? (
                      <audio
                        controls
                        src={media.url}
                        style={{ height: 28, flex: 1, minWidth: 0 }}
                      />
                    ) : (
                      <>
                        <span
                          className="tag t12"
                          style={{ padding: "1px 6px" }}
                        >
                          FILE
                        </span>
                        <span className="t13 muted grow">Attachment</span>
                      </>
                    )}
                    <button
                      type="button"
                      aria-label="Remove attachment"
                      disabled={busy}
                      onClick={() => removeExisting(i)}
                    >
                      <Icon n="x" s={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Files added in this edit — uploaded when you press Save */}
          <MediaAttachments
            files={files}
            onRemove={removeFile}
            totalMB={totalMB}
            maxMB={50}
          />

          <div className="row between">
            <PostToolbar
              onFilesSelected={addFiles}
              ifRecord
              onRecordClick={() => setRecorderOpen(true)}
            />
            <div className="row gap10">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-blue btn-sm"
                disabled={!canSave}
                onClick={submit}
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* A sibling of the edit overlay (not inside it), so clicking the
          recorder's backdrop can't also close the edit dialog. */}
      <VoiceRecorderModal
        isOpen={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onRecordingComplete={handleRecordingComplete}
      />
    </div>
  );
}
