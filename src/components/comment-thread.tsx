// src/components/post-card/CommentThread.tsx
//
// The new design's version of the old CommentThread: compose box, every
// comment, inline reply boxes, likes, and delete. Behaviour carried over from
// the old one:
//   - replies nest up to MAX_DEPTH (6) levels; the Reply button stops there
//   - a comment can be deleted by its author OR by the post's owner
//   - replies are collapsed behind "View N replies"
//   - comments and replies can carry attachments
// Each <CommentItem> calls useContentInteractions() with ITS OWN publicId and
// kind "comment", which is what makes likes and replies work at any depth.
//
// Not carried over: the old `showPollOption` prop. It made the thread's
// compose box offer a poll, but a poll posts to `contents` as a brand-new
// top-level post — not as a comment — so it never belonged in a thread.

import { useState } from "react";
import { Avatar, Icon } from "@/lib/ui";
import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";
import {
  useContentInteractions,
  useDeleteComment,
} from "@/hooks/useContentInteractions";
import type { FeedComment, FeedMedia } from "@/lib/adapters/content";
import { MediaExtras } from "./media-extras";
import { MediaLightbox } from "./media-light-box";
import { formatTimeAgo } from "@/utils/helper";
import { CommentComposer } from "./comment-composer";
import { MentionText } from "./MentionText";

const MAX_DEPTH = 6;

const countAll = (list: FeedComment[]): number =>
  list.reduce((n, c) => n + 1 + countAll(c.replies), 0);

/** Compact attachments for a comment: photo/video tiles that open the
 *  lightbox, plus a player / link for audio and documents. */
function CommentMedia({ media }: { media: FeedMedia[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!media.length) return null;
  const visual = media.filter((m) => m.isVisual);
  const extras = media.filter((m) => !m.isVisual);

  return (
    <div className="col gap8" style={{ marginTop: 8 }}>
      {visual.length > 0 && (
        <div className="row gap6" style={{ flexWrap: "wrap" }}>
          {visual.slice(0, 4).map((m, i) => (
            <div
              key={i}
              onClick={() => setOpen(i)}
              style={{
                width: 110,
                height: 110,
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                background: "#000",
              }}
            >
              {m.isVideo ? (
                <video
                  src={m.url}
                  muted
                  preload="metadata"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={m.url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              {m.isVideo && (
                <div
                  className="row center"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,.25)",
                  }}
                >
                  <Icon n="play" s={20} c="#fff" fill="#fff" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <MediaExtras media={extras} />
      {open !== null && (
        <MediaLightbox
          items={visual}
          startIndex={open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

/** "Delete" → "Delete? Yes / No", like the old one. */
function DeleteButton({ commentId }: { commentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const { deleteComment, isDeleting } = useDeleteComment(commentId, () =>
    setConfirming(false),
  );

  if (confirming) {
    return (
      <span className="row gap8 t12">
        <span className="muted">Delete?</span>
        <button
          type="button"
          className="b6"
          style={{ color: "var(--coral-ink)" }}
          disabled={isDeleting}
          onClick={deleteComment}
        >
          {isDeleting ? "Deleting…" : "Yes"}
        </button>
        <button
          type="button"
          className="muted"
          onClick={() => setConfirming(false)}
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="row gap4 muted"
      aria-label="Delete"
      onClick={() => setConfirming(true)}
    >
      <Icon n="x" s={13} />
      Delete
    </button>
  );
}

function CommentItem({
  comment,
  postOwnerEmail,
  depth,
}: {
  comment: FeedComment;
  postOwnerEmail: string;
  depth: number;
}) {
  const { userObject } = useAppSelector((s: RootState) => s.auth);
  const currentUserEmail = userObject?.email ?? userObject?.usid ?? "";
  const { react, removeReaction, addComment } = useContentInteractions(
    comment.id,
    userObject?.email,
    "comment",
  );
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const canDelete =
    !!currentUserEmail &&
    (currentUserEmail === comment.authorEmail ||
      currentUserEmail === postOwnerEmail);
  const replyCount = comment.replies.length;

  // Replies hang off a thread line for two levels, then stop indenting so a
  // deep thread stays readable on a phone.
  const threadStyle: React.CSSProperties =
    depth < 2
      ? { marginLeft: 16, paddingLeft: 14, borderLeft: "2px solid var(--line)" }
      : {};

  return (
    <div>
      <div
        className="row gap10"
        style={{ padding: "10px 0", alignItems: "flex-start" }}
      >
        <Avatar
          name={comment.who}
          src={comment.avatar}
          size={depth ? 28 : 34}
        />
        <div className="col grow" style={{ minWidth: 0 }}>
          <span className="t13">
            <b className="uname">{comment.who}</b>{" "}
            <span className="muted2">
              {comment.handle && `@${comment.handle}`}
              {comment.createdAt
                ? ` · ${formatTimeAgo(comment.createdAt)}`
                : ""}
            </span>
          </span>
          {comment.text && (
            <span
              className="t14"
              style={{ lineHeight: 1.5, whiteSpace: "pre-wrap" }}
            >
              <MentionText text={comment.text} />
            </span>
          )}
          <CommentMedia media={comment.media} />

          <div
            className="row gap16 muted t13"
            style={{ marginTop: 6, flexWrap: "wrap" }}
          >
            <button
              className="row gap6 muted"
              onClick={() => (comment.liked ? removeReaction() : react("LIKE"))}
              style={{ color: comment.liked ? "var(--coral-ink)" : "" }}
              aria-label={comment.liked ? "Unlike" : "Like"}
            >
              <Icon
                n="heart"
                s={15}
                fill={comment.liked ? "var(--coral-ink)" : undefined}
              />
              {comment.likes > 0 && comment.likes.toLocaleString()}
            </button>

            {depth < MAX_DEPTH && (
              <button className="muted" onClick={() => setReplying((v) => !v)}>
                {replying ? "Cancel" : "Reply"}
              </button>
            )}

            {replyCount > 0 && (
              <button
                className="muted"
                onClick={() => setShowReplies((v) => !v)}
              >
                {showReplies ? "Hide" : "View"} {replyCount}{" "}
                {replyCount === 1 ? "reply" : "replies"}
              </button>
            )}

            {canDelete && <DeleteButton commentId={comment.id} />}
          </div>
        </div>
      </div>

      {(showReplies || replying) && (
        <div style={threadStyle}>
          {showReplies &&
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postOwnerEmail={postOwnerEmail}
                depth={depth + 1}
              />
            ))}

          {replying && (
            <div style={{ paddingBottom: 8 }}>
              <CommentComposer
                placeholder={`Reply to ${comment.who}…`}
                autoFocus
                onSubmit={(payload) => {
                  addComment(payload);
                  setReplying(false);
                  setShowReplies(true);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentThread({
  postId,
  postOwnerEmail,
  comments,
}: {
  postId: string;
  /** Email of the post's owner — they can delete anyone's comment on it. */
  postOwnerEmail: string;
  comments: FeedComment[];
}) {
  const { userObject } = useAppSelector((s: RootState) => s.auth);
  const { addComment } = useContentInteractions(postId, userObject?.email);
  const total = countAll(comments);

  return (
    <div id="post-comments" className="card" style={{ padding: 18 }}>
      <div className="b7 t18" style={{ marginBottom: 4 }}>
        Comments{total > 0 ? ` · ${total.toLocaleString()}` : ""}
      </div>

      <CommentComposer placeholder="Write a comment…" onSubmit={addComment} />

      <div style={{ marginTop: 12, borderTop: "1px solid var(--line)" }}>
        {comments.length === 0 ? (
          <div
            className="muted t13"
            style={{ padding: "24px 0", textAlign: "center" }}
          >
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postOwnerEmail={postOwnerEmail}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
}
