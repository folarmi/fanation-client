// src/components/post-card/PostToolbar.tsx
//
// Replaces the old project's MediaUploadGrid. Same set of actions (attach
// media, start a poll, record a voice note, schedule) and the same
// ifPoll/ifRecord/ifSchedule flags, but built from the new design's `Icon`
// component instead of importing separate custom SVG files per action, and
// with a real (if minimal) file-picker in place of the old `PostUploader`
// (whose source wasn't provided).
//
// Only the media-attach button is wired end-to-end right now — poll/record/
// schedule fire the same callbacks the old component did, so whoever builds
// the poll composer / voice recorder / date picker in the new design can
// wire straight into this without touching the toolbar again.

import { useRef } from "react";
import { Icon } from "@/lib/ui";

export function PostToolbar({
  onFilesSelected,
  ifPoll,
  ifRecord,
  ifSchedule,
  onStartPoll,
  onRecordClick,
  onToggleSchedule,
}: {
  onFilesSelected: (files: File[]) => void;
  ifPoll?: boolean;
  ifRecord?: boolean;
  ifSchedule?: boolean;
  onStartPoll?: () => void;
  onRecordClick?: () => void;
  onToggleSchedule?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="row gap16 muted">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFilesSelected(files);
          e.target.value = ""; // allow picking the same file again later
        }}
      />
      <span
        style={{ cursor: "pointer" }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Icon n="camera" s={19} solid />
      </span>

      {ifPoll && (
        <span style={{ cursor: "pointer" }} onClick={onStartPoll}>
          <Icon n="poll" s={19} solid />
        </span>
      )}
      {ifRecord && (
        <span style={{ cursor: "pointer" }} onClick={onRecordClick}>
          <Icon n="mic" s={19} solid />
        </span>
      )}
      {ifSchedule && (
        <span style={{ cursor: "pointer" }} onClick={onToggleSchedule}>
          <Icon n="cal" s={19} solid />
        </span>
      )}
    </div>
  );
}
