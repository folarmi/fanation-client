// src/components/post-card/PostComposer.tsx
//
// The new design's version of the old CommentBox in its top-level-post form
// (no `commentId`). Carried over from it:
//   - text with @mention autocomplete       (useMentions / MentionDropdown)
//   - attachments, with the 10MB / 50MB rules and PostUploader's file types
//   - drag-and-drop onto the composer       (PostUploader had it)
//   - voice notes                           (VoiceRecorderModal)
//   - polls                                 (the toolbar's poll button swaps in
//                                            PollComposer, as CommentBox swapped
//                                            in <Poll />)
//   - scheduling: the calendar button switches the composer to "schedule for
//     later" — pick a date and time and the button becomes "Schedule post"
//   - the exact request:  POST contents
//       { message, mentions, scheduledFor, mediaFiles, mediaType }
//     where `scheduledFor` is null for a normal post, or the picked local time
//     as a UTC ISO string (combineDateAndTimeToISO, unchanged).
//
// Two improvements over CommentBox:
//   - your text and attachments are only cleared once the post actually
//     succeeds, so a failed request doesn't eat what you wrote
//   - a half-filled schedule is blocked. In CommentBox, switching to schedule
//     mode and leaving the date or time empty produced scheduledFor = null,
//     so the post was published IMMEDIATELY. Now both must be set, and the
//     moment must still be in the future.
//
// Self-contained (`onClose` / `onPosted`), so it can sit inline in the feed or
// be dropped inside a modal.

import { useRef, useState } from "react";
import { Avatar } from "@/lib/ui";
import { useCustomMutation } from "@/hooks/api/use-api";
import { useUploadFiles } from "@/hooks/useUploadFiles"; // port from the old project if it isn't in the new one yet
import { getMediaType } from "@/utils/helper";
import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";
import { useNotify } from "@/hooks/useNotify";
import { useFileQueue } from "@/hooks/useFileQueue";
import { useInvalidateContent } from "@/hooks/useContentInteractions";
import { useMentionUsers, useMentions } from "@/hooks/useMentions";
import { MentionDropdown } from "./mention-dropdown";
import { MediaAttachments } from "./media-attachements";
import { PostToolbar } from "./post-toolbar";
import { VoiceRecorderModal } from "./VoiceRecorderModal";
import {
  combineDateAndTimeToISO,
  formatScheduleDate,
  formatScheduleTime,
  isFuture,
  userTimeZone,
} from "@/utils/schedule";
import { PollComposer } from "./poll-composer";
import { SchedulePicker } from "./schedule-picker";

export function PostComposer({
  onClose,
  onPosted,
  initialMode = "post",
  initialScheduling = false,
}: {
  onClose: () => void;
  onPosted?: () => void;
  initialMode?: "post" | "poll";
  /** Open with "schedule for later" already switched on. */
  initialScheduling?: boolean;
}) {
  const notify = useNotify();
  const invalidate = useInvalidateContent();
  const { userObject } = useAppSelector((s: RootState) => s.auth);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"post" | "poll">(initialMode);
  const [text, setText] = useState("");
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scheduling, setScheduling] = useState(initialScheduling);
  const [eventDate, setEventDate] = useState(""); // "YYYY-MM-DD", local
  const [eventTime, setEventTime] = useState(""); // "HH:mm", local
  const { files, addFiles, removeFile, clear, totalMB } = useFileQueue();

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
    onError: (error: any) => notify.error(error?.message || "Upload failed"),
  });

  const createPost = useCustomMutation({
    endpoint: "contents",
    onSuccessCallback: () => {
      invalidate();
      setText("");
      clear();
      resetUpload();
      onPosted?.();
      onClose();
    },
    successMessage: () =>
      scheduling ? "Post scheduled" : "Post added successfully",
    onError: (err: any) =>
      notify.error(err?.response?.data?.message || "An error occurred"),
  });

  const busy = createPost.isPending || isUploading;
  const scheduleReady = !scheduling || (!!eventDate && !!eventTime);
  const canPost =
    (text.trim().length > 0 || files.length > 0) && scheduleReady && !busy;

  const submit = async () => {
    if (!text.trim() && files.length === 0) {
      notify.error("Post message or media is required");
      return;
    }
    if (busy) return;

    let scheduledFor: string | null = null;
    if (scheduling) {
      if (!eventDate || !eventTime) {
        notify.error("Pick a date and time for your scheduled post");
        return;
      }
      if (!isFuture(eventDate, eventTime)) {
        notify.error("Scheduled time must be in the future");
        return;
      }
      scheduledFor = combineDateAndTimeToISO(eventDate, eventTime);
    }

    const base = { message: text.trim(), mentions: mentionIds, scheduledFor };
    if (files.length === 0) {
      createPost.mutate({ ...base, mediaFiles: [] });
      return;
    }
    try {
      const mediaLinks = await uploadFiles(files);
      createPost.mutate({
        ...base,
        mediaFiles: mediaLinks,
        mediaType: getMediaType(files),
      });
    } catch (error) {
      console.error("Upload failed:", error); // useUploadFiles' onError already told the user
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    // Name the file after what the browser actually recorded (Safari makes mp4).
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

  // ── Poll mode: the old box swapped itself for the poll form ────────────────
  if (mode === "poll") {
    return (
      <PollComposer
        onClose={() => setMode("post")}
        onPosted={() => {
          onPosted?.();
          onClose();
        }}
      />
    );
  }

  return (
    <div
      className="card col gap12"
      style={{
        padding: 16,
        outline: dragging ? "2px solid var(--blue-ink)" : undefined,
        outlineOffset: -2,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="row gap12" style={{ alignItems: "flex-start" }}>
        <Avatar name="You" size={40} />
        <div className="grow" style={{ position: "relative" }}>
          <textarea
            ref={textareaRef}
            className="input"
            placeholder="Share something with your fans…"
            rows={4}
            autoFocus
            value={text}
            style={{ resize: "none", width: "100%" }}
            onChange={(e) => {
              setText(e.target.value);
              handleTextareaChange(
                e.target.value,
                e.target.selectionStart ?? 0,
              );
            }}
            onKeyDown={(e) => {
              handleKeyDown(e, text, setText); // handles Enter/Tab/arrows while the mention list is open
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
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
      </div>

      <div style={{ paddingLeft: 52 }}>
        <MediaAttachments
          files={files}
          onRemove={removeFile}
          totalMB={totalMB}
          maxMB={50}
        />
      </div>

      {scheduling && (
        <div className="col gap8" style={{ paddingLeft: 52 }}>
          <div className="row between">
            <span className="up muted">Schedule for later</span>
            <button
              type="button"
              className="muted t12"
              onClick={() => setScheduling(false)}
            >
              Post now instead
            </button>
          </div>
          <SchedulePicker
            date={eventDate}
            time={eventTime}
            onDateChange={setEventDate}
            onTimeChange={setEventTime}
          />
          <span className="muted t12">
            {eventDate && eventTime
              ? `Publishes ${formatScheduleDate(eventDate)} at ${formatScheduleTime(eventTime)} · ${userTimeZone()}`
              : `Times are in your local timezone (${userTimeZone()})`}
          </span>
        </div>
      )}

      <div className="row between">
        <PostToolbar
          onFilesSelected={addFiles}
          ifPoll
          ifRecord
          ifSchedule
          scheduleActive={scheduling}
          onStartPoll={() => setMode("poll")}
          onRecordClick={() => setRecorderOpen(true)}
          onToggleSchedule={() => setScheduling((v) => !v)}
        />
        <div className="row gap10">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-blue btn-sm"
            disabled={!canPost}
            onClick={submit}
          >
            {busy
              ? scheduling
                ? "Scheduling…"
                : "Posting…"
              : scheduling
                ? "Schedule post"
                : "Post"}
          </button>
        </div>
      </div>

      <VoiceRecorderModal
        isOpen={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onRecordingComplete={handleRecordingComplete}
      />
    </div>
  );
}
