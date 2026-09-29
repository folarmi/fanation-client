// src/components/post-card/VoiceRecorderModal.tsx
//
// The new design's version of the old VoiceRecorderModal: same controls
// (Start / Pause / Resume / Done / Cancel), same 5-minute cap, same status
// text — built from the project's own `.overlay` + `.card` instead of Tailwind.

import { Icon } from "@/lib/ui";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { MicGlyph } from "./toolbar-icons";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export function VoiceRecorderModal({
  isOpen,
  onClose,
  onRecordingComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (audioBlob: Blob) => void;
}) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onRecordingComplete: (blob) => {
      onRecordingComplete(blob);
      onClose();
    },
    maxDuration: 300, // 5 minutes
  });

  const handleClose = () => {
    if (isRecording) cancelRecording();
    onClose();
  };

  if (!isOpen) return null;

  const live = isRecording && !isPaused;

  return (
    <div
      className="overlay"
      style={{ background: "rgba(2,4,12,.72)" }}
      onClick={handleClose}
    >
      <div
        className="card col center gap16"
        style={{ padding: 24, width: 380, maxWidth: "92vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row between" style={{ width: "100%" }}>
          <span className="b7 t18">Voice recording</span>
          <button
            type="button"
            className="muted"
            aria-label="Close"
            onClick={handleClose}
          >
            <Icon n="x" s={20} />
          </button>
        </div>

        <div
          className="feature-ic"
          style={{
            width: 88,
            height: 88,
            background: live ? "var(--coral)" : "var(--fill)",
            animation: live ? "blink 1.4s ease-in-out infinite" : undefined,
          }}
        >
          <MicGlyph s={36} c={live ? "#fff" : "var(--muted)"} />
        </div>

        <div className="statnum" style={{ fontSize: 30 }}>
          {formatTime(recordingTime)}
        </div>
        <div className="muted t13">
          {!isRecording
            ? "Ready to record"
            : isPaused
              ? "Paused"
              : "Recording…"}
        </div>

        <div className="row gap10" style={{ width: "100%" }}>
          {!isRecording ? (
            <>
              <button
                type="button"
                className="btn btn-ghost grow"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-blue grow"
                onClick={startRecording}
              >
                Start recording
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost grow"
                onClick={cancelRecording}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn grow ${isPaused ? "btn-blue" : "btn-ghost"}`}
                onClick={isPaused ? resumeRecording : pauseRecording}
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                className="btn btn-blue grow"
                onClick={stopRecording}
              >
                Done
              </button>
            </>
          )}
        </div>

        <div className="muted2 t12" style={{ textAlign: "center" }}>
          Maximum recording duration: 5 minutes
        </div>
      </div>
    </div>
  );
}
