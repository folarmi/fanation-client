// src/components/profile/MediaTab.tsx
//
// Ported from the old project's Media.tsx: tabs with live counts (All /
// Photos / Videos / Audio), a grid/list toggle, and a lightbox. Two things
// fixed along the way (see MediaLightbox.tsx for why):
//   1. The grid groups tiles BY POST, not by individual media file — a post
//      with 4 photos is one tile with a "1/4" badge, and clicking it opens
//      all 4 as a carousel. The old grid flattened every file into its own
//      dead-end tile.
//   2. Video tiles actually get a <video> element; the old grid rendered a
//      static <img> with a play icon glued on top of nothing playable.
// List view reuses the real PostCard directly, so it gets real reactions/
// comments/video playback for free instead of a second bespoke renderer.

import { useMemo, useState } from "react";
import { Icon } from "@/lib/ui";
import type { RawContent } from "@/lib/adapters/content";
import { mapMedia, type FeedMedia } from "@/lib/adapters/content";
import { PostCard } from "@/components/post-card";

import { formatTimeAgo } from "@/utils/helper";
import type { MediaFile } from "@/utils/types";
import { InfiniteLoader } from "./infinite-loader";
import { MediaLightbox } from "./media-light-box";

type MediaTabName = "All" | "Photos" | "Videos" | "Audio";

function qualifies(m: MediaFile, tab: MediaTabName) {
  if (tab === "All") return m.mediaType !== "AUDIO";
  if (tab === "Photos") return m.mediaType === "PHOTO";
  if (tab === "Videos") return m.mediaType === "VIDEO";
  if (tab === "Audio") return m.mediaType === "AUDIO";
  return false;
}

export function MediaTab({
  posts,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  posts: RawContent[];
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<MediaTabName>("All");
  const [ifList, setIfList] = useState(false);
  const [lightbox, setLightbox] = useState<{
    items: FeedMedia[];
    index: number;
  } | null>(null);

  const counts = useMemo(() => {
    const all = posts.flatMap((p) => p.mediaFiles ?? []);
    return {
      photos: all.filter((m) => m.mediaType === "PHOTO").length,
      videos: all.filter((m) => m.mediaType === "VIDEO").length,
      audio: all.filter((m) => m.mediaType === "AUDIO").length,
    };
  }, [posts]);

  const tabs: { name: MediaTabName; count?: number }[] = [
    { name: "All" },
    { name: "Photos", count: counts.photos },
    { name: "Videos", count: counts.videos },
    { name: "Audio", count: counts.audio },
  ];

  const matchingPosts = useMemo(
    () =>
      posts.filter((p) =>
        (p.mediaFiles ?? []).some((m) => qualifies(m, activeTab)),
      ),
    [posts, activeTab],
  );

  if (isLoading) {
    return (
      <div className="card row center" style={{ padding: 48 }}>
        <span
          aria-label="Loading media"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "var(--muted)",
            display: "block",
            animation: "blink 1.4s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div className="col gap16">
      <div className="row between">
        <div className="row gap8">
          {tabs.map(({ name, count }) => (
            <button
              key={name}
              onClick={() => setActiveTab(name)}
              className="tag"
              style={{
                padding: "6px 14px",
                border: "none",
                cursor: "pointer",
                background: activeTab === name ? "var(--blueL)" : "var(--fill)",
                color: activeTab === name ? "var(--blueL-ink)" : "var(--muted)",
              }}
            >
              {name}
              {count !== undefined && count > 0 && (
                <span style={{ marginLeft: 4 }}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab !== "Audio" && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setIfList((v) => !v)}
            title={ifList ? "Grid view" : "List view"}
          >
            <Icon n={ifList ? "grid" : "list"} s={16} />
          </button>
        )}
      </div>

      {/* ── Audio ─────────────────────────────────────────────── */}
      {activeTab === "Audio" &&
        (matchingPosts.length === 0 ? (
          <EmptyState label="audio" />
        ) : (
          <div className="col gap12">
            {matchingPosts.map((post) => (
              <div key={post.publicId} className="card" style={{ padding: 16 }}>
                <div className="row gap10" style={{ marginBottom: 10 }}>
                  <div className="col">
                    <span className="t14 b6 uname">{post.creator?.name}</span>
                    <span className="muted t12">
                      @{post.creator?.username} ·{" "}
                      {formatTimeAgo(post.createdDate)}
                    </span>
                  </div>
                </div>
                {post.message && (
                  <div className="t14" style={{ marginBottom: 10 }}>
                    {post.message}
                  </div>
                )}
                {(post.mediaFiles ?? [])
                  .filter((m) => m.mediaType === "AUDIO")
                  .map((audio, i) => (
                    <audio
                      key={i}
                      controls
                      src={audio.mediaLink}
                      style={{ width: "100%", marginBottom: 6 }}
                    />
                  ))}
              </div>
            ))}
          </div>
        ))}

      {/* ── Grid: one tile per POST, not per media file ──────────── */}
      {activeTab !== "Audio" &&
        !ifList &&
        (matchingPosts.length === 0 ? (
          <EmptyState label={activeTab.toLowerCase()} />
        ) : (
          <div
            className="grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
            }}
          >
            {matchingPosts.map((post) => {
              const items = (post.mediaFiles ?? [])
                .filter((m) => qualifies(m, activeTab))
                .map(mapMedia);
              const cover = items[0];
              if (!cover) return null;
              return (
                <div
                  key={post.publicId}
                  onClick={() => setLightbox({ items, index: 0 })}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    background: "#000",
                  }}
                >
                  {cover.isVideo ? (
                    <video
                      src={cover.url}
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
                      src={cover.url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {cover.isVideo && (
                    <div
                      className="row center"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,.25)",
                      }}
                    >
                      <Icon n="play" s={22} c="#fff" fill="#fff" />
                    </div>
                  )}
                  {items.length > 1 && (
                    <div
                      className="pill t12 onart"
                      style={{ position: "absolute", top: 6, right: 6 }}
                    >
                      1/{items.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

      {/* ── List: the real PostCard, full functionality for free ── */}
      {activeTab !== "Audio" &&
        ifList &&
        (matchingPosts.length === 0 ? (
          <EmptyState label={`${activeTab.toLowerCase()} posts`} />
        ) : (
          matchingPosts.map((post) => (
            <PostCard key={post.publicId} raw={post} />
          ))
        ))}

      <InfiniteLoader
        onLoadMore={() => fetchNextPage?.()}
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
      />

      {lightbox && (
        <MediaLightbox
          items={lightbox.items}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="card col center gap8"
      style={{ padding: 40, textAlign: "center" }}
    >
      <div className="feature-ic" style={{ background: "var(--fill)" }}>
        <Icon n="eye" c="var(--muted)" />
      </div>
      <div className="b7">No {label} found</div>
    </div>
  );
}
