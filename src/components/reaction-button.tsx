// src/components/post-card/reaction-button.tsx
//
// One reaction control, shared by posts and comments — previously each had
// its own single "LIKE only" button. Behaviour (not markup) is carried over
// from the old project's reaction trigger: tapping the button while you have
// no reaction opens the picker; tapping it while you DO have one removes that
// reaction directly, with no picker needed. Hovering (desktop) also opens the
// picker. Picking an option — including your current one, to toggle it off —
// closes the picker.
//
// Emoji rather than an Icon name per reaction: LOVE/DISLIKE/LOL have no
// obvious equivalent in this project's icon set, and guessing four more names
// risks four more silent no-renders. An emoji always renders, and it carries
// no borrowed layout or styling — the popover, spacing and colors are all
// this project's own `.card`/`.pill`/`.tag` system.

import { useRef, useState } from "react";
import type { ReactionType } from "@/utils/types";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "DISLIKE", emoji: "👎", label: "Dislike" },
  { type: "LOL", emoji: "😂", label: "LOL" },
];

export function ReactionButton({
  myReaction,
  totalCount,
  byReactionType,
  onReact,
  onRemove,
  size = 19,
}: {
  myReaction: string | null;
  totalCount: number;
  byReactionType?: Record<string, number>;
  onReact: (type: ReactionType) => void;
  onRemove: () => void;
  /** Emoji + count text size, in px — smaller for a comment than a post. */
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = REACTIONS.find((r) => r.type === myReaction);

  const openPicker = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(true);
  };
  const closePicker = () => {
    hideTimer.current = setTimeout(() => setOpen(false), 200);
  };

  const pick = (type: ReactionType) => {
    if (myReaction === type) onRemove();
    else onReact(type);
    setOpen(false);
  };

  return (
    <div
      className="row"
      style={{ position: "relative", alignItems: "center" }}
      onMouseEnter={openPicker}
      onMouseLeave={closePicker}
    >
      {open && (
        <div
          className="card row gap4"
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 6,
            padding: "6px 8px",
            zIndex: 20,
            whiteSpace: "nowrap",
          }}
          onMouseEnter={openPicker}
          onMouseLeave={closePicker}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              title={r.label}
              aria-label={r.label}
              onClick={(e) => {
                e.stopPropagation();
                pick(r.type);
              }}
              className="col center"
              style={{
                padding: "4px 6px",
                borderRadius: 10,
                transform: myReaction === r.type ? "scale(1.15)" : undefined,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{r.emoji}</span>
              {(byReactionType?.[r.type] ?? 0) > 0 && (
                <span className="muted" style={{ fontSize: 10, marginTop: 2 }}>
                  {byReactionType![r.type]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="row gap6 muted"
        style={{ color: current ? "var(--coral-ink)" : "" }}
        aria-label={current ? `Remove ${current.label.toLowerCase()}` : "React"}
        onClick={(e) => {
          e.stopPropagation();
          if (myReaction) onRemove();
          else openPicker();
        }}
      >
        {current ? (
          <span style={{ fontSize: size, lineHeight: 1 }}>{current.emoji}</span>
        ) : (
          <span style={{ fontSize: size, lineHeight: 1, opacity: 0.55 }}>
            👍
          </span>
        )}
        {totalCount > 0 && totalCount.toLocaleString()}
      </button>
    </div>
  );
}
