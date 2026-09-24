// src/components/post-card/MediaLightbox.tsx
//
// The old project's lightbox always rendered <img src={lightboxImage}> no
// matter what was clicked — a video had no <video> element at all, just a
// broken image tag. And because the grid flattened every post's images into
// separate tiles, there was never a *set* to page through — each tile was
// its own dead end. This fixes both: it takes a post's full media list and
// an index, renders the right element per item, and lets you step through
// the rest of that post's media without leaving the lightbox.

import { useEffect, useState } from "react";
import { Icon } from "@/lib/ui";
import type { FeedMedia } from "@/lib/adapters/content";

export function MediaLightbox({
  items,
  startIndex = 0,
  onClose,
}: {
  items: FeedMedia[];
  startIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  useEffect(() => setIndex(startIndex), [startIndex]);
  const current = items[Math.min(index, Math.max(items.length - 1, 0))];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  if (!current) return null;

  return (
    <div
      className="overlay"
      style={{ background: "rgba(2,4,12,.92)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 24,
          right: 28,
          color: "#fff",
          zIndex: 1,
        }}
      >
        <Icon n="x" s={26} c="#fff" />
      </button>

      <div
        className="row gap16"
        style={{
          alignItems: "center",
          height: "100%",
          justifyContent: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.length > 1 && (
          <button
            onClick={() =>
              setIndex((i) => (i - 1 + items.length) % items.length)
            }
            style={{ color: "#fff", flex: "none" }}
          >
            <span style={{ display: "flex", transform: "rotate(180deg)" }}>
              <Icon n="chevronRight" s={26} c="#fff" />
            </span>
          </button>
        )}

        <div
          style={{
            maxWidth: "80vw",
            maxHeight: "85vh",
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {current.isVideo ? (
            <video
              key={current.url}
              src={current.url}
              controls
              autoPlay
              style={{ maxWidth: "80vw", maxHeight: "85vh" }}
            />
          ) : (
            <img
              src={current.url}
              alt=""
              style={{
                maxWidth: "80vw",
                maxHeight: "85vh",
                objectFit: "contain",
              }}
            />
          )}
        </div>

        {items.length > 1 && (
          <button
            onClick={() => setIndex((i) => (i + 1) % items.length)}
            style={{ color: "#fff", flex: "none" }}
          >
            <Icon n="chevronRight" s={26} c="#fff" />
          </button>
        )}
      </div>

      {items.length > 1 && (
        <div
          className="row gap6"
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            justifyContent: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === index ? "#fff" : "rgba(255,255,255,.4)",
                border: "none",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
