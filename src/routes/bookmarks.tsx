// src/pages/BookmarksPage.tsx
//
// The new design's version of the old Bookmarks page. Same request, same query
// key, and the same shape handling: the endpoint returns SAVE RECORDS, and the
// post itself is the record's `.content` (the old page passed `data?.content`
// to <FeedPost> for exactly that reason).
//
// Every card gets `isAlreadyBookmarked` — the nested post doesn't carry a
// reliable `bookmarkers` list, and everything on this page is bookmarked by
// definition. Un-bookmarking a card removes it from the page at once (see
// useBookmarkRemover in useContentInteractions.ts).
//
// Route: wherever your app puts it, e.g. <Route path="bookmarks" element={<BookmarksPage />} />

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/lib/ui";
import { useInfiniteGetData } from "@/hooks/api/use-api";
import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";
import { PostCard } from "@/components/post-card";
import type { RawContent } from "@/lib/adapters/content";
import { InfiniteLoader } from "@/components/infinite-loader";

export default function BookmarksPage() {
  const navigate = useNavigate();
  const { userObject } = useAppSelector((s: RootState) => s.auth);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteGetData({
      // Identical to the old page. If pagination ever repeats page 1, drop
      // `page=0&size=20` from this URL — your new useInfiniteGetData may add
      // them itself, which would send `page` twice.
      url: `contents/saves?saveType=BOOKMARK&userEmail=${userObject?.email}&page=0&size=20&sort=desc`,
      queryKey: ["GetUserBookmarks", userObject?.email ?? ""],
      enabled: !!userObject?.email,
      pageSize: 20,
    });

  // save record -> the post inside it. Skip any record that has no post.
  const posts: RawContent[] = useMemo(
    () =>
      (data?.pages?.flatMap((page: any) => page?.data?.content ?? []) ?? [])
        .map((save: any) => save?.content as RawContent | undefined)
        .filter(
          (post: RawContent | undefined): post is RawContent =>
            !!post?.publicId,
        ),
    [data],
  );

  return (
    <div className="content">
      <div className="col gap16" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="row between">
          <span className="b7 t24">Bookmarks</span>
          {posts.length > 0 && (
            <span className="muted t13">{posts.length} saved</span>
          )}
        </div>

        {isLoading && (
          <div className="card row center" style={{ padding: 48 }}>
            <span
              aria-label="Loading bookmarks"
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
        )}

        {!isLoading && posts.length === 0 && (
          <div
            className="card col center gap10"
            style={{ padding: 48, textAlign: "center" }}
          >
            <div className="feature-ic" style={{ background: "var(--fill)" }}>
              <Icon n="bookmark" c="var(--muted)" />
            </div>
            <div className="b7">No bookmarks yet</div>
            <div className="muted t13">Posts you save will show up here.</div>
            <button
              className="btn btn-blue btn-sm"
              onClick={() => navigate("/feed")}
            >
              Back to feed
            </button>
          </div>
        )}

        {posts.map((post) => (
          <PostCard key={post.publicId} raw={post} isAlreadyBookmarked />
        ))}

        <InfiniteLoader
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
        />
      </div>
    </div>
  );
}
