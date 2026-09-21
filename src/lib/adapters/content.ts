// src/lib/adapters/content.ts
//
// This file is the ONLY place that should know what the backend's JSON
// currently looks like. The card component never touches `raw` fields
// directly — it only sees `FeedPost`. When the backend adds a feature
// (a new reaction type, a paywall field, a repost count), you extend
// `RawContent` and `mapContentToFeedPost` here, and the component below
// keeps working unmodified.

export interface RawCreator {
  name: string;
  username: string;
  profilePic?: string;
  verified?: boolean;
  live?: boolean;
}

export interface RawMediaFile {
  url: string;
  type?: "IMAGE" | "VIDEO" | string;
  duration?: string; // e.g. "0:42", if the backend ever sends one
}

export interface RawReaction {
  publicId?: string;
  createdBy: string;
  type: string; // "LIKE" | "DISLIKE" | "LOVE" | "LOL" | whatever comes next
}

export interface RawComment {
  publicId: string;
  author: RawCreator;
  message: string;
  createdDate?: string;
}

export interface RawPollChoice {
  label: string;
  votes?: number;
  votedByMe?: boolean;
}

/**
 * The shape you pasted from the backend, typed. `[key: string]: unknown`
 * means a brand-new field the backend starts sending tomorrow won't get
 * stripped out by TypeScript — it just won't be *used* until you promote
 * it into a real field below.
 */
export interface RawContent {
  publicId: string;
  createdBy: string;
  createdDate: string;
  lastModifiedDate?: string;
  creator: RawCreator;
  message?: string;
  mediaFiles?: RawMediaFile[];
  reactions?: RawReaction[];
  comments?: RawComment[];
  bookmarkers?: { email: string }[];
  reposters?: { email: string }[];
  viewers?: string[];
  mentions?: unknown[];
  pollChoices?: RawPollChoice[];
  pollDuration?: { days: number; hours: number; minutes: number };
  published?: boolean;

  // --- Not in today's payload, but the shape the UI is already built for.
  // Reading them defensively now means the "locked post" / "PPV" / "gift"
  // UI in PostCard.tsx lights up the moment the backend ships these,
  // with ZERO changes to this file or the component.
  visibility?: "PUBLIC" | "SUBSCRIBERS_ONLY" | "LOCKED";
  price?: number; // coins to unlock, once `visibility === "LOCKED"` exists

  meta?: {
    reactionCount?: number;
    commentCount?: number;
    viewCount?: number;
    [key: string]: unknown;
  };

  [key: string]: unknown;
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

  media: RawMediaFile[];

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

  comments: { id: string; who: string; handle: string; text: string }[];

  /** Escape hatch — anything not promoted above is still here, unmodified. */
  raw: RawContent;
}

// Keep this list in one place; adding a fifth reaction type later is a
// one-line change here (and in the emoji map in PostCard.tsx).
const REACTION_TYPES = ["LIKE", "DISLIKE", "LOVE", "LOL"] as const;

export function mapContentToFeedPost(
  raw: RawContent,
  viewerEmail?: string,
): FeedPost {
  const reactions = raw.reactions ?? [];

  const byReactionType = Object.fromEntries(
    REACTION_TYPES.map((t) => [
      t,
      reactions.filter((r) => r.type === t).length,
    ]),
  ) as Record<string, number>;

  const myReaction =
    reactions.find((r) => r.createdBy === viewerEmail)?.type ?? null;

  const totalVotes = (raw.pollChoices ?? []).reduce(
    (sum, c) => sum + (c.votes ?? 0),
    0,
  );

  const votedIndex = raw.pollChoices?.findIndex((c) => c.votedByMe) ?? -1;

  return {
    id: raw.publicId,
    authorEmail: raw.createdBy,
    who: raw.creator?.name || "Unknown User",
    handle: raw.creator?.username || "",
    avatar: raw.creator?.profilePic,
    verified: !!raw.creator?.verified,
    live: !!raw.creator?.live,
    createdAt: raw.createdDate,
    text: raw.message,

    media: raw.mediaFiles ?? [],

    poll: raw.pollChoices?.length
      ? raw.pollChoices.map((c) => ({
          label: c.label,
          pct: totalVotes ? Math.round(((c.votes ?? 0) / totalVotes) * 100) : 0,
        }))
      : null,
    pollVotedIndex: votedIndex === -1 ? null : votedIndex,
    pollDuration: raw.pollDuration,

    locked: raw.visibility === "LOCKED",
    price: raw.price,

    counts: {
      reactions: raw.meta?.reactionCount ?? reactions.length,
      comments: raw.meta?.commentCount ?? raw.comments?.length ?? 0,
      byReactionType,
    },
    myReaction,
    isBookmarked:
      raw.bookmarkers?.some((b) => b.email === viewerEmail) ?? false,

    comments: (raw.comments ?? []).map((c) => ({
      id: c.publicId,
      who: c.author?.name || "Unknown",
      handle: c.author?.username || "",
      text: c.message,
    })),

    raw,
  };
}
