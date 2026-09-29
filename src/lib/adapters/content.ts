// src/lib/adapters/content.ts
//
// This file is the ONLY place that should know what the backend's JSON
// actually looks like. Components only ever see `FeedPost` / `FeedComment`.
// When the backend adds a feature, you extend this file and the components
// keep working unmodified.
//
// The raw types (StoryPost, MediaFile, PostComment, ...) come from your real
// `@/utils/types`, so this file can't drift out of sync with them.

import type { StoryPost, MediaFile, PostComment } from "@/utils/types";

/** Alias kept so existing imports of `RawContent` keep working. */
export type RawContent = StoryPost;

export type FeedMediaKind = "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";

export interface FeedMedia {
  url: string;
  kind: FeedMediaKind;
  isVideo: boolean;
  /** Photos and videos are drawn as tiles; audio and documents can't be —
   *  they get a player / a link instead (see MediaExtras.tsx). */
  isVisual: boolean;
  duration?: string; // not in MediaFile today; stays optional for when it is
}

export interface FeedComment {
  id: string;
  authorEmail: string;
  mine: boolean;
  who: string;
  handle: string;
  avatar?: string;
  createdAt?: string;
  text: string;
  media: FeedMedia[];
  myReaction: string | null;
  reactionCount: number;
  byReactionType: Record<string, number>;
  replies: FeedComment[];
}

export interface FeedPollOption {
  id: string; // PollChoice.publicId — what a vote request needs
  label: string;
  votes: number;
  pct: number;
}

export interface FeedPost {
  id: string;
  authorEmail: string;
  who: string;
  handle: string;
  avatar?: string;
  verified: boolean;
  live: boolean;
  createdAt: string;
  text?: string;

  media: FeedMedia[];

  poll: FeedPollOption[] | null;
  pollVotedIndex: number | null;
  pollTotalVotes: number;
  pollExpiresAt: string | null; // ISO, null when the post has no poll/duration
  pollClosed: boolean;
  pollDuration?: { days: number; hours: number; minutes: number };

  locked: boolean;
  price?: number;

  counts: {
    reactions: number;
    comments: number;
    byReactionType: Record<string, number>;
  };
  myReaction: string | null;
  isBookmarked: boolean;

  comments: FeedComment[];

  /** Escape hatch — the untouched raw object, for anything not promoted above. */
  raw: RawContent;
}

const REACTION_TYPES = ["LIKE", "DISLIKE", "LOVE", "LOL"] as const;

export function mapMedia(file: MediaFile): FeedMedia {
  // Anything without a recognisable type is treated as a photo, as before.
  const kind = (file.mediaType ?? "PHOTO") as FeedMediaKind;
  return {
    url: file.mediaLink,
    kind,
    isVideo: kind === "VIDEO",
    isVisual: kind === "PHOTO" || kind === "VIDEO",
    // MediaFile has no duration field yet — reading it defensively means
    // the moment the backend adds one, this line just starts working.
    duration: (file as { duration?: string }).duration,
  };
}

type CommentAuthor = {
  name?: string;
  username?: string;
  profilePic?: string;
  email?: string;
};

/**
 * Comments (and their replies) -> FeedComment, recursively.
 *
 * What the API really sends on a comment (per the old CommentThread), beyond
 * what `PostComment` types:
 *   - `userInfo`  { name, username, profilePic, email }  — the author
 *   - `mediaFiles`                                       — attachments
 * Replies can also arrive shaped like a StoryPost, i.e. with `creator`
 * instead of `userInfo`, and their own replies under `comments` — both are
 * handled, exactly as the old thread did.
 */
export function mapComment(c: PostComment, viewerEmail?: string): FeedComment {
  const loose = c as PostComment & {
    userInfo?: CommentAuthor;
    creator?: CommentAuthor;
    mediaFiles?: MediaFile[];
    comments?: PostComment[];
  };
  const author = loose.userInfo ?? loose.creator;
  const authorEmail = loose.createdBy ?? author?.email ?? "";
  const local = authorEmail.split("@")[0] ?? "";
  const reactions = loose.reactions ?? [];
  const byReactionType = Object.fromEntries(
    REACTION_TYPES.map((t) => [
      t,
      reactions.filter((r) => r.type === t).length,
    ]),
  ) as Record<string, number>;
  const replies = loose.replies ?? loose.comments ?? [];

  return {
    id: loose.publicId,
    authorEmail,
    mine: !!viewerEmail && authorEmail === viewerEmail,
    who: author?.name || local || "Unknown",
    handle: author?.username || local,
    avatar: author?.profilePic,
    createdAt: loose.createdDate,
    text: loose.message,
    media: (loose.mediaFiles ?? []).map(mapMedia),
    myReaction:
      reactions.find((r) => r.createdBy === viewerEmail)?.type ?? null,
    reactionCount: reactions.length,
    byReactionType,
    replies: replies.map((r) => mapComment(r, viewerEmail)),
  };
}

/** createdDate + duration. NOTE: the server's timestamps have no timezone
 *  suffix, so `new Date()` reads them as local time. If your API sends UTC,
 *  a poll's close time can be off by your UTC offset — append "Z" here if so. */
function pollExpiry(
  createdDate: string,
  d?: { days: number; hours: number; minutes: number },
): string | null {
  if (!d) return null;
  const start = new Date(createdDate).getTime();
  if (Number.isNaN(start)) return null;
  const ms = ((d.days * 24 + d.hours) * 60 + d.minutes) * 60_000;
  return new Date(start + ms).toISOString();
}

export function mapContentToFeedPost(
  raw: RawContent,
  viewerEmail?: string,
): FeedPost {
  const reactions = raw?.reactions ?? [];

  const byReactionType = Object.fromEntries(
    REACTION_TYPES.map((t) => [
      t,
      reactions.filter((r) => r.type === t).length,
    ]),
  ) as Record<string, number>;

  const myReaction =
    reactions.find((r) => r.createdBy === viewerEmail)?.type ?? null;

  // PollChoice: label is `choice`, votes is an array of voter identifiers.
  const pollChoices = raw?.pollChoices ?? [];
  const voteCounts = pollChoices.map((c) => c.votes?.length ?? 0);
  const totalVotes = voteCounts.reduce((sum, n) => sum + n, 0);
  const votedIndex = pollChoices.findIndex((c) =>
    c.votes?.includes(viewerEmail ?? ""),
  );
  const pollExpiresAt = pollChoices.length
    ? pollExpiry(raw?.createdDate, raw?.pollDuration)
    : null;

  const comments = (raw?.comments ?? []).map((c) => mapComment(c, viewerEmail));

  return {
    id: raw?.publicId,
    authorEmail: raw?.createdBy,
    who: raw?.creator?.name || "Unknown User",
    handle: raw?.creator?.username || "",
    avatar: raw?.creator?.profilePic,
    // PostCreator has no `verified`/`live` fields today — defaulting to
    // false rather than guessing keeps this file honest about what the
    // backend actually sends.
    verified: false,
    live: false,
    createdAt: raw?.createdDate,
    text: raw?.message,

    media: (raw?.mediaFiles ?? []).map(mapMedia),

    poll: pollChoices.length
      ? pollChoices.map((c, i) => ({
          id: c.publicId,
          label: c.choice,
          votes: voteCounts[i],
          pct: totalVotes ? Math.round((voteCounts[i] / totalVotes) * 100) : 0,
        }))
      : null,
    pollVotedIndex: votedIndex === -1 ? null : votedIndex,
    pollTotalVotes: totalVotes,
    pollExpiresAt,
    pollClosed: pollExpiresAt ? Date.now() > Date.parse(pollExpiresAt) : false,
    pollDuration: raw?.pollDuration,

    // Not sent by the backend yet — stays false/undefined until StoryPost
    // grows a `visibility`/`price` field.
    locked: false,
    price: undefined,

    counts: {
      reactions: raw?.meta?.reactionCount ?? reactions.length,
      comments: raw?.meta?.commentCount ?? comments.length,
      byReactionType,
    },
    myReaction,
    isBookmarked:
      raw?.bookmarkers?.some((b) => b.email === viewerEmail) ?? false,

    comments,

    raw,
  };
}
