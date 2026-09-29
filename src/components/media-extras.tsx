// src/components/post-card/MediaExtras.tsx
//
// Photos and videos are drawn as tiles. Audio (voice notes) and documents are
// not images, so drawing them as tiles shows a broken picture. This renders
// them the way they should be: a real <audio controls> player, and a link.
// Shared by post cards and comments.

import type { FeedMedia } from "@/lib/adapters/content";

export function MediaExtras({ media }: { media: FeedMedia[] }) {
  if (!media.length) return null;

  return (
    <div className="col gap8">
      {media.map((m, i) =>
        m.kind === "AUDIO" ? (
          <audio key={i} controls src={m.url} style={{ width: "100%" }} />
        ) : (
          <a
            key={i}
            href={m.url}
            target="_blank"
            rel="noreferrer"
            className="row gap8 pill"
            style={{ padding: "8px 12px", alignSelf: "flex-start" }}
          >
            <span className="tag t12" style={{ padding: "1px 6px" }}>
              FILE
            </span>
            <span className="t13">Open attachment</span>
          </a>
        ),
      )}
    </div>
  );
}
