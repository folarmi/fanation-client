// src/pages/PostDetailPage.tsx
//
// Route: `feed/:id`  ->  <Route path="feed/:id" element={<PostDetailPage />} />
// (the card, "Copy link" and this page's back button all take the path from
// `postPath` in PostCard.tsx).
//
// Replaces the old SinglePostDetails. Fixes carried over from reading it:
//   - EVERYTHING now comes from `data.data`. The old page read the name and
//     media from `data.data` but `publicId`, `reactions`, `bookmarkers` and
//     the owner's email from `data`, so reactions never showed on it.
//   - ONE query key. The old page fetched with JSON.stringify(id) but
//     invalidated with the plain id, so the two never matched and a new
//     comment didn't refresh the thread. Here the key is ["GetContentsById", id],
//     which is also what useContentInteractions invalidates and patches.

import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/lib/ui";
import { useGetData } from "@/hooks/api/use-api";
import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";
import { PostCard } from "@/components/post-card";
import { mapContentToFeedPost, type RawContent } from "@/lib/adapters/content";
import { CommentThread } from "@/components/comment-thread";

export default function PostDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userObject } = useAppSelector((s: RootState) => s.auth);

  const { data, isLoading } = useGetData({
    url: `contents/${id}`,
    queryKey: ["GetContentsById", id],
    enabled: !!id,
  });

  // Opened straight from a shared link there's nothing to go "back" to, and
  // navigate(-1) would leave the app — so fall back to the feed.
  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/feed");

  const raw = (data as { data?: RawContent } | undefined)?.data;
  const comments = raw
    ? mapContentToFeedPost(raw, userObject?.email).comments
    : [];

  return (
    <div className="content">
      <div className="col gap16" style={{ maxWidth: 640, margin: "0 auto" }}>
        <button
          className="row gap6 muted"
          style={{ alignSelf: "flex-start", cursor: "pointer" }}
          onClick={goBack}
        >
          <span style={{ display: "flex", transform: "rotate(180deg)" }}>
            <Icon n="chevronRight" s={18} />
          </span>
          <span className="b6 t14">Back</span>
        </button>

        {isLoading && (
          <div className="card row center" style={{ padding: 48 }}>
            <span
              aria-label="Loading post"
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

        {!isLoading && !raw && (
          <div
            className="card col center gap8"
            style={{ padding: 40, textAlign: "center" }}
          >
            <div className="b7">Post not found</div>
            <div className="muted t13">
              It may have been deleted, or the link is wrong.
            </div>
          </div>
        )}

        {raw && (
          <>
            <PostCard raw={raw} variant="detail" />
            <CommentThread
              postId={raw.publicId}
              postOwnerEmail={raw.createdBy}
              comments={comments}
            />
          </>
        )}
      </div>
    </div>
  );
}
