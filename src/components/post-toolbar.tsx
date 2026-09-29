// src/components/post-card/PostToolbar.tsx
//
// Replaces the old project's MediaUploadGrid. Same set of actions (attach
// media, start a poll, record a voice note, schedule) and the same
// ifPoll/ifRecord/ifSchedule flags, but built from the new design's `Icon`
// component instead of importing separate custom SVG files per action, and
// with a real (if minimal) file-picker in place of the old `PostUploader`
// (the accepted types now match its list — see useFileQueue.ts).
//
// Only the media-attach button is wired end-to-end right now — poll/record/
// schedule fire the same callbacks the old component did, so whoever builds
// the poll composer / voice recorder / date picker in the new design can
// wire straight into this without touching the toolbar again.

import { useRef } from "react";
import { Icon } from "@/lib/ui";
import { ACCEPT_ATTR } from "@/hooks/useFileQueue";
import { PollGlyph, MicGlyph } from "./toolbar-icons";

export function PostToolbar({
  onFilesSelected,
  ifPoll,
  ifRecord,
  ifSchedule,
  scheduleActive,
  onStartPoll,
  onRecordClick,
  onToggleSchedule,
}: {
  onFilesSelected: (files: File[]) => void;
  ifPoll?: boolean;
  ifRecord?: boolean;
  ifSchedule?: boolean;
  /** Highlights the calendar button while scheduling is switched on. */
  scheduleActive?: boolean;
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
        accept={ACCEPT_ATTR}
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
          <PollGlyph s={19} />
        </span>
      )}
      {ifRecord && (
        <span style={{ cursor: "pointer" }} onClick={onRecordClick}>
          <MicGlyph s={19} />
        </span>
      )}
      {ifSchedule && (
        <span
          style={{
            cursor: "pointer",
            color: scheduleActive ? "var(--blueL-ink)" : undefined,
          }}
          onClick={onToggleSchedule}
          aria-pressed={scheduleActive}
          title={scheduleActive ? "Post now instead" : "Schedule for later"}
        >
          <Icon
            n="cal"
            s={19}
            solid
            c={scheduleActive ? "var(--blueL-ink)" : undefined}
          />
        </span>
      )}
    </div>
  );
}
