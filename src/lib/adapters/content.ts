// src/lib/adapters/content.ts
//
// This file is the ONLY place that should know what the backend's JSON
// actually looks like. The card component never touches raw fields
// directly — it only sees `FeedPost`. When the backend adds a feature
// (a new reaction type, a paywall field, per-comment author info), you
// extend this file, and the component keeps working unmodified.
//
// The raw types (StoryPost, MediaFile, PostComment, PollChoice, ...) are
// imported from your real `@/utils/types` — this file doesn't redefine
// them, so it can't drift out of sync with what the backend team maintains.

import type { StoryPost, MediaFile, PollChoice } from "@/utils/types";

/** Alias kept so PostCard.tsx / FeedPage.tsx don't need to change their
 *  imports — `RawContent` just IS `StoryPost`. */
export type RawContent = StoryPost;

export interface FeedMedia {
  url: string;
  isVideo: boolean;
  duration?: string; // not in MediaFile today; stays optional for when it is
}

export interface FeedComment {
  id: string;
  authorEmail: string;
  mine: boolean;
  text: string;
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

  poll: { label: string; pct: number }[] | null;
  pollVotedIndex: number | null;
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

function mapMedia(file: MediaFile): FeedMedia {
  return {
    url: file.mediaLink,
    isVideo: file.mediaType === "VIDEO",
    // MediaFile has no duration field yet — reading it defensively means
    // the moment the backend adds one, this line just starts working.
    duration: (file as { duration?: string }).duration,
  };
}

function mapPollChoice(
  choice: PollChoice,
  viewerEmail: string | undefined,
  totalVotes: number,
): { label: string; pct: number } {
  const voteCount = choice.votes?.length ?? 0;
  return {
    label: choice.choice,
    pct: totalVotes ? Math.round((voteCount / totalVotes) * 100) : 0,
  };
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

  const pollChoices = raw?.pollChoices ?? [];
  const totalVotes = pollChoices.reduce(
    (sum, c) => sum + (c.votes?.length ?? 0),
    0,
  );
  const votedIndex = pollChoices.findIndex((c) =>
    c.votes?.includes(viewerEmail ?? ""),
  );

  return {
    id: raw?.publicId,
    authorEmail: raw?.createdBy,
    who: raw?.creator?.name || "Unknown User",
    handle: raw?.creator?.username || "",
    avatar: raw?.creator?.profilePic,
    // PostCreator has no `verified`/`live` fields today — these come from
    // the mock creator directory elsewhere in the app for now. Defaulting
    // to false here rather than guessing keeps this file honest about what
    // the backend actually sends.
    verified: false,
    live: false,
    createdAt: raw?.createdDate,
    text: raw?.message,

    media: (raw?.mediaFiles ?? []).map(mapMedia),

    poll: pollChoices.length
      ? pollChoices.map((c) => mapPollChoice(c, viewerEmail, totalVotes))
      : null,
    pollVotedIndex: votedIndex === -1 ? null : votedIndex,
    pollDuration: raw?.pollDuration,

    // Not sent by the backend yet — see RawContent's source type. Stays
    // `false`/`undefined` until StoryPost grows a `visibility`/`price` field.
    locked: false,
    price: undefined,

    counts: {
      reactions: raw?.meta?.reactionCount ?? reactions.length,
      comments: raw?.meta?.commentCount ?? raw?.comments?.length ?? 0,
      byReactionType,
    },
    myReaction,
    isBookmarked:
      raw?.bookmarkers?.some((b) => b.email === viewerEmail) ?? false,

    // PostComment carries only `createdBy` (an email) — no name, no
    // username. There is currently no way to show a real display name for
    // someone else's comment without a separate user lookup. "mine" is the
    // one thing we CAN tell for certain; the component decides how to
    // render the rest (e.g. "You" vs. the email's local part).
    comments: (raw?.comments ?? []).map((c) => ({
      id: c.publicId,
      authorEmail: c.createdBy,
      mine: c.createdBy === viewerEmail,
      text: c.message,
    })),

    raw,
  };
}
