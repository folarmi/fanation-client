// src/components/post-card/InfiniteLoader.tsx
//
// Auto-loads the next page when the bottom of a list scrolls into view — what
// your old <InfiniteScroll> did — without depending on that component. Drop it
// after the list:
//
//   <InfiniteLoader onLoadMore={fetchNextPage} hasMore={hasNextPage} isLoading={isFetchingNextPage} />
//
// It renders nothing once there are no more pages.

import { useEffect, useRef } from "react";

export function InfiniteLoader({
  onLoadMore,
  hasMore,
  isLoading,
}: {
  onLoadMore: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef(onLoadMore); // always the latest, without re-subscribing
  loadRef.current = onLoadMore;

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) loadRef.current();
      },
      { rootMargin: "400px" }, // start loading a little before it's on screen
    );
    observer.observe(sentinelRef.current);
    // Re-runs when a page finishes loading (isLoading flips), so if the sentinel
    // is still in view — a short page — the next one is fetched straight away.
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  if (!hasMore) return null;

  return (
    <div
      ref={sentinelRef}
      className="row center"
      style={{ padding: 24, minHeight: 40 }}
    >
      {isLoading && (
        <span
          aria-label="Loading more"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "var(--muted)",
            display: "block",
            animation: "blink 1.4s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}
