// // src/components/cards/PostCard.tsx
// //
// // This is your new project's card (design system, layout, locked/PPV/gift
// // treatment) rewired to real data instead of the mock `useAppStore`. It
// // replaces BOTH the old `PostCard.tsx` and `FeedPost.tsx` — view tracking
// // is folded in here rather than living in a separate wrapper.
// //
// // What's live today: reactions, bookmark, comments, view tracking, poll
// // display, media (single or multiple files).
// // What's dormant until the backend ships the fields: locked/PPV unlock,
// // gifting, subscribe-gated content. The JSX for these already exists below
// // — they just won't render while `post.locked` / `post.price` are undefined.

// // src/components/cards/PostCard.tsx
// //
// // This is your new project's card (design system, layout, locked/PPV/gift
// // treatment) rewired to real data instead of the mock `useAppStore`. It
// // replaces BOTH the old `PostCard.tsx` and `FeedPost.tsx` — view tracking
// // is folded in here rather than living in a separate wrapper.
// //
// // What's live today: reactions, bookmark, comments, view tracking, poll
// // display, media (single or multiple files).
// // What's dormant until the backend ships the fields: locked/PPV unlock,
// // gifting, subscribe-gated content. The JSX for these already exists below
// // — they just won't render while `post.locked` / `post.price` are undefined.

// // src/components/cards/PostCard.tsx
// //
// // This is your new project's card (design system, layout, locked/PPV/gift
// // treatment) rewired to real data instead of the mock `useAppStore`. It
// // replaces BOTH the old `PostCard.tsx` and `FeedPost.tsx` — view tracking
// // is folded in here rather than living in a separate wrapper.
// //
// // What's live today: reactions, bookmark, comments, view tracking, poll
// // display, media (single or multiple files).
// // What's dormant until the backend ships the fields: locked/PPV unlock,
// // gifting, subscribe-gated content. The JSX for these already exists below
// // — they just won't render while `post.locked` / `post.price` are undefined.

// import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Avatar, Icon, Loop, Menu, Photo, SIZES, Verified } from "@/lib/ui";
// import { useCustomMutation, useGetData } from "@/hooks/api/use-api";
// import { useQueryClient } from "@tanstack/react-query";
// import { useAppSelector } from "@/services/hook";
// import type { RootState } from "@/services/store";
// import { formatTimeAgo, isActivelySubscribed } from "@/utils/helper";
// import type { CreatorUser } from "@/utils/types";
// import {
//   mapContentToFeedPost,
//   type RawContent,
//   type FeedPost,
// } from "@/lib/adapters/content";
// import { useContentInteractions } from "@/hooks/useContentInteractions";
// import { MediaLightbox } from "./media-light-box";
// import { CommentComposer } from "./comment-composer";

// const MEDIA_H = 420;
// const LOCKED_H = 320;

// export function FollowBtn({ username }: { username: string }) {
//   const queryClient = useQueryClient();
//   const { userObject } = useAppSelector((s: RootState) => s.auth);

//   const { data, isLoading: subsLoading } = useGetData({
//     url: `subscriptions?page=0&size=20&subscriberEmail=${userObject?.email}`,
//     queryKey: ["GetSubscriptionsForViewer"],
//   });

//   const currentSub = isActivelySubscribed(
//     (data as { data?: { content?: CreatorUser[] } } | undefined)?.data
//       ?.content ?? [],
//     username,
//   );
//   const isSubscribed = currentSub ? currentSub.isActive : false;

//   const invalidate = () =>
//     queryClient.invalidateQueries({
//       queryKey: ["GetSubscriptionsForViewer"],
//       exact: false,
//     });

//   const subscribeMutation = useCustomMutation({
//     endpoint: `subscriptions/subscribe/${username}`,
//     successMessage: () => "Followed",
//     onSuccessCallback: invalidate,
//   });
//   const unsubscribeMutation = useCustomMutation({
//     method: "delete",
//     endpoint: `subscriptions/unsubscribe/${currentSub?.subscription?.publicId}`,
//     successMessage: () => "Unfollowed",
//     onSuccessCallback: invalidate,
//   });

//   const isPending =
//     subscribeMutation.isPending || unsubscribeMutation.isPending;

//   return (
//     <button
//       className={"btn btn-sm " + (isSubscribed ? "btn-ghost" : "btn-blue")}
//       onClick={(e) => {
//         e.stopPropagation();
//         isSubscribed
//           ? unsubscribeMutation.mutate({})
//           : subscribeMutation.mutate({});
//       }}
//       disabled={isPending || subsLoading}
//     >
//       {isSubscribed ? "Following" : "Follow"}
//     </button>
//   );
// }

// /** One media item — photo, or a silent autoplay-when-in-view preview for
//  *  video (Instagram-feed style). Clicking either kind opens the lightbox,
//  *  where video actually gets a real <video controls> element and multiple
//  *  items become a carousel — see MediaLightbox.tsx. */
// function MediaTile({
//   file,
//   height,
//   onOpen,
// }: {
//   file: FeedPost["media"][number];
//   height: number;
//   onOpen: () => void;
// }) {
//   const isVideo = file.isVideo;
//   return (
//     <div
//       onClick={onOpen}
//       style={{
//         height,
//         borderRadius: 14,
//         position: "relative",
//         overflow: "hidden",
//         cursor: "pointer",
//       }}
//     >
//       {isVideo ? (
//         <Loop src={file.url} poster={undefined} active radius={14} />
//       ) : (
//         <Photo sizes={SIZES.feedCard} src={file.url} alt="" radius={14} />
//       )}
//       {isVideo && (
//         <div className="row center" style={{ position: "absolute", inset: 0 }}>
//           <div
//             className="feature-ic"
//             style={{ width: 56, height: 56, background: "rgba(0,0,0,.42)" }}
//           >
//             <Icon n="play" s={24} c="#fff" fill="#fff" />
//           </div>
//         </div>
//       )}
//       {file.duration && (
//         <div
//           className="pill t12 onart"
//           style={{ position: "absolute", bottom: 10, right: 10 }}
//         >
//           {file.duration}
//         </div>
//       )}
//     </div>
//   );
// }

// /** 0..N media files. Single file = full-width block; multiple = a simple
//  *  grid — but unlike the old project, every tile in that grid opens the SAME
//  *  lightbox instance scoped to this post's whole media list, at the index
//  *  clicked, so you can carousel through the rest from wherever you started. */
// function PostMedia({ media }: { media: FeedPost["media"] }) {
//   const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
//   if (!media.length) return null;

//   return (
//     <>
//       {media.length === 1 ? (
//         <MediaTile
//           file={media[0]}
//           height={MEDIA_H}
//           onOpen={() => setLightboxIndex(0)}
//         />
//       ) : (
//         <div
//           className="grid"
//           style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
//         >
//           {media.slice(0, 4).map((file, i) => (
//             <MediaTile
//               key={i}
//               file={file}
//               height={MEDIA_H / 2 - 3}
//               onOpen={() => setLightboxIndex(i)}
//             />
//           ))}
//         </div>
//       )}
//       {lightboxIndex !== null && (
//         <MediaLightbox
//           items={media}
//           startIndex={lightboxIndex}
//           onClose={() => setLightboxIndex(null)}
//         />
//       )}
//     </>
//   );
// }

// export function PostCard({ raw }: { raw: RawContent }) {
//   const navigate = useNavigate();
//   const { userObject } = useAppSelector((s: RootState) => s.auth);
//   const post = mapContentToFeedPost(raw, userObject?.email);
//   const { react, removeReaction, toggleBookmark, addComment, recordView } =
//     useContentInteractions(post.id, userObject?.email);

//   const mine = post.authorEmail === userObject?.email;
//   const isSub = false; // TODO: wire once subscription-per-post data exists; see FollowBtn for the query shape

//   const [showComments, setShowComments] = useState(false);
//   const [reportedLocally, setReportedLocally] = useState(false);

//   // View tracking, folded in from the old FeedPost wrapper.
//   const rootRef = useRef<HTMLDivElement>(null);
//   useEffect(() => {
//     if (!rootRef.current || post.raw.viewers?.includes(userObject?.email ?? ""))
//       return;
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
//           recordView();
//           observer.disconnect();
//         }
//       },
//       { threshold: 0.5 },
//     );
//     observer.observe(rootRef.current);
//     return () => observer.disconnect();
//   }, []);

//   const menu = mine
//     ? [
//         {
//           ic: "x",
//           t: "Delete post",
//           danger: true,
//           fn: () => {
//             /* TODO: delete mutation */
//           },
//         },
//       ]
//     : [
//         {
//           ic: "bookmark",
//           t: post.isBookmarked
//             ? "Remove from collection"
//             : "Save to collection",
//           fn: toggleBookmark,
//         },
//         "-" as const,
//         // Mute/block/report have no backend endpoint in the sample payload yet.
//         // Left in place — wire each to a real mutation as the API grows.
//         reportedLocally
//           ? { ic: "flag", t: "Reported ✓", off: true }
//           : {
//               ic: "flag",
//               t: "Report post",
//               danger: true,
//               fn: () => setReportedLocally(true),
//             },
//       ];

//   return (
//     <div
//       className="card"
//       style={{ padding: 18 }}
//       ref={rootRef}
//       onClick={() => navigate(`/dashboard/${post.id}`)}
//     >
//       <div className="row between" onClick={(e) => e.stopPropagation()}>
//         <div className="row gap12">
//           <Avatar
//             name={post.who}
//             size={44}
//             ring={post.live ? "var(--coral)" : undefined}
//           />
//           <div className="col">
//             <div className="row gap6">
//               <span className="b7 t14 uname">{post.who}</span>
//               {post.verified && <Verified />}
//               {isSub && !mine && (
//                 <span
//                   className="tag"
//                   style={{
//                     padding: "1px 8px",
//                     fontSize: 10.5,
//                     color: "var(--blueL-ink)",
//                     border: "none",
//                   }}
//                 >
//                   Subscribed
//                 </span>
//               )}
//             </div>
//             <div className="muted t13">
//               @{post.handle} · {formatTimeAgo(post.createdAt)}
//             </div>
//           </div>
//         </div>
//         <div className="row gap8">
//           {!mine && <FollowBtn username={post.handle} />}
//           <Menu items={menu} />
//         </div>
//       </div>

//       {post.text && (
//         <div
//           className="t14"
//           style={{ margin: "13px 0", lineHeight: 1.55 }}
//           onClick={(e) => e.stopPropagation()}
//         >
//           {post.text}
//         </div>
//       )}

//       <div onClick={(e) => e.stopPropagation()}>
//         {/* Locked / PPV — dormant until `visibility`/`price` exist on the payload. */}
//         {post.locked ? (
//           <div className="locked" style={{ height: LOCKED_H }}>
//             <Photo
//               sizes={SIZES.feedCard}
//               src={post.media[0]?.url}
//               blur={10}
//               scale={1.12}
//             />
//             <div className="lockcover">
//               <div
//                 className="feature-ic"
//                 style={{ background: "rgba(37,153,246,.16)" }}
//               >
//                 <Icon n="lock" c="var(--blueL)" />
//               </div>
//               <div className="b7" style={{ color: "#fff" }}>
//                 {isSub ? "Pay-per-view drop" : "Exclusive locked content"}
//               </div>
//               <div className="row gap8">
//                 {!isSub && (
//                   <button className="btn btn-ghost btn-sm">Subscribe</button>
//                 )}
//                 <button className="btn btn-blue btn-sm">
//                   Unlock · {post.price} coins
//                 </button>
//               </div>
//             </div>
//           </div>
//         ) : (
//           <PostMedia media={post.media} />
//         )}

//         {post.poll && (
//           <div className="col gap8" style={{ marginBottom: 4, marginTop: 12 }}>
//             {post.poll.map((o, i) => (
//               <div
//                 key={i}
//                 className="hair"
//                 style={{
//                   position: "relative",
//                   padding: "11px 14px",
//                   borderRadius: 12,
//                   overflow: "hidden",
//                   borderColor:
//                     post.pollVotedIndex === i
//                       ? "var(--blue-ink)"
//                       : "var(--line)",
//                 }}
//               >
//                 <div
//                   style={{
//                     position: "absolute",
//                     left: 0,
//                     top: 0,
//                     bottom: 0,
//                     width: `${o.pct}%`,
//                     background:
//                       post.pollVotedIndex === i
//                         ? "rgba(37,153,246,.3)"
//                         : "rgba(37,153,246,.14)",
//                   }}
//                 />
//                 <div className="row between" style={{ position: "relative" }}>
//                   <span className="row gap8 b6 t14">
//                     {post.pollVotedIndex === i && (
//                       <Icon n="check" s={14} c="var(--blueL-ink)" />
//                     )}
//                     {o.label}
//                   </span>
//                   <span className="muted t13">{o.pct}%</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div
//         className="row between postbar"
//         style={{ marginTop: 14 }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="row gap20 postacts">
//           <button
//             className="row gap6 muted"
//             onClick={() =>
//               post.myReaction === "LIKE" ? removeReaction() : react("LIKE")
//             }
//             style={{
//               color: post.myReaction === "LIKE" ? "var(--coral-ink)" : "",
//             }}
//           >
//             <Icon
//               n="heart"
//               s={19}
//               fill={post.myReaction === "LIKE" ? "var(--coral-ink)" : undefined}
//             />
//             {post.counts.reactions}
//           </button>
//           <button
//             className="row gap6 muted"
//             onClick={() => setShowComments((v) => !v)}
//             style={{ color: showComments ? "var(--blueL-ink)" : "" }}
//           >
//             <Icon n="comment" s={19} />
//             {post.counts.comments}
//           </button>
//         </div>
//         {!mine && (
//           <button className="btn btn-ghost btn-sm">
//             <Icon n="gift" s={15} />
//             Gift
//           </button>
//         )}
//       </div>

//       {showComments && (
//         <div
//           style={{
//             marginTop: 14,
//             borderTop: "1px solid var(--line)",
//             paddingTop: 12,
//           }}
//           onClick={(e) => e.stopPropagation()}
//         >
//           {post.comments.map((c) => (
//             <div
//               key={c.id}
//               className="row gap10"
//               style={{ padding: "7px 0", alignItems: "flex-start" }}
//             >
//               <Avatar name={c.mine ? "You" : c.authorEmail} size={30} />
//               <div className="col">
//                 <span className="t13">
//                   <b className="uname">
//                     {c.mine ? "You" : c.authorEmail.split("@")[0]}
//                   </b>
//                 </span>
//                 <span className="t14">{c.text}</span>
//               </div>
//             </div>
//           ))}
//           <CommentComposer onSubmit={addComment} />
//         </div>
//       )}
//     </div>
//   );
// }

// src/components/cards/PostCard.tsx
//
// This is your new project's card (design system, layout, locked/PPV/gift
// treatment) rewired to real data instead of the mock `useAppStore`. It
// replaces BOTH the old `PostCard.tsx` and `FeedPost.tsx` — view tracking
// is folded in here rather than living in a separate wrapper.
//
// What's live today: reactions, bookmark, comments, view tracking, poll
// display, media (single or multiple files).
// What's dormant until the backend ships the fields: locked/PPV unlock,
// gifting, subscribe-gated content. The JSX for these already exists below
// — they just won't render while `post.locked` / `post.price` are undefined.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Icon, Loop, Menu, Photo, SIZES, Verified } from "@/lib/ui";
import { useCustomMutation, useGetData } from "@/hooks/api/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";
import { formatTimeAgo, isActivelySubscribed } from "@/utils/helper";
import type { CreatorUser } from "@/utils/types";
import {
  mapContentToFeedPost,
  type RawContent,
  type FeedPost,
} from "@/lib/adapters/content";
import {
  useContentInteractions,
  usePollVote,
} from "@/hooks/useContentInteractions";
import { CommentComposer } from "./comment-composer";
import { MediaExtras } from "./media-extras";
import { MediaLightbox } from "./media-light-box";

const MEDIA_H = 420;
const LOCKED_H = 320;

export function FollowBtn({ username }: { username: string }) {
  const queryClient = useQueryClient();
  const { userObject } = useAppSelector((s: RootState) => s.auth);

  const { data, isLoading: subsLoading } = useGetData({
    url: `subscriptions?page=0&size=20&subscriberEmail=${userObject?.email}`,
    queryKey: ["GetSubscriptionsForViewer"],
  });

  const currentSub = isActivelySubscribed(
    (data as { data?: { content?: CreatorUser[] } } | undefined)?.data
      ?.content ?? [],
    username,
  );
  const isSubscribed = currentSub ? currentSub.isActive : false;

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["GetSubscriptionsForViewer"],
      exact: false,
    });

  const subscribeMutation = useCustomMutation({
    endpoint: `subscriptions/subscribe/${username}`,
    successMessage: () => "Followed",
    onSuccessCallback: invalidate,
  });
  const unsubscribeMutation = useCustomMutation({
    method: "delete",
    endpoint: `subscriptions/unsubscribe/${currentSub?.subscription?.publicId}`,
    successMessage: () => "Unfollowed",
    onSuccessCallback: invalidate,
  });

  const isPending =
    subscribeMutation.isPending || unsubscribeMutation.isPending;

  return (
    <button
      className={"btn btn-sm " + (isSubscribed ? "btn-ghost" : "btn-blue")}
      onClick={(e) => {
        e.stopPropagation();
        isSubscribed
          ? unsubscribeMutation.mutate({})
          : subscribeMutation.mutate({});
      }}
      disabled={isPending || subsLoading}
    >
      {isSubscribed ? "Following" : "Follow"}
    </button>
  );
}

/** One media item — photo, or a silent autoplay-when-in-view preview for
 *  video (Instagram-feed style). Clicking either kind opens the lightbox,
 *  where video actually gets a real <video controls> element and multiple
 *  items become a carousel — see MediaLightbox.tsx. */
function MediaTile({
  file,
  height,
  onOpen,
}: {
  file: FeedPost["media"][number];
  height: number;
  onOpen: () => void;
}) {
  const isVideo = file.isVideo;
  return (
    <div
      onClick={onOpen}
      style={{
        height,
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {isVideo ? (
        <Loop src={file.url} poster={undefined} active radius={14} />
      ) : (
        <Photo sizes={SIZES.feedCard} src={file.url} alt="" radius={14} />
      )}
      {isVideo && (
        <div className="row center" style={{ position: "absolute", inset: 0 }}>
          <div
            className="feature-ic"
            style={{ width: 56, height: 56, background: "rgba(0,0,0,.42)" }}
          >
            <Icon n="play" s={24} c="#fff" fill="#fff" />
          </div>
        </div>
      )}
      {file.duration && (
        <div
          className="pill t12 onart"
          style={{ position: "absolute", bottom: 10, right: 10 }}
        >
          {file.duration}
        </div>
      )}
    </div>
  );
}

/** 0..N media files. Photos/videos become tiles (one = full width, several =
 *  a grid); audio and documents render as a player / link underneath, since
 *  neither can be drawn as an image tile. Every tile opens the SAME lightbox,
 *  scoped to this post's visual media, at the index clicked — so you can
 *  carousel through the rest from wherever you started. */
function PostMedia({ media }: { media: FeedPost["media"] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (!media.length) return null;

  const visual = media.filter((m) => m.isVisual);
  const extras = media.filter((m) => !m.isVisual);

  return (
    <>
      {visual.length === 1 && (
        <MediaTile
          file={visual[0]}
          height={MEDIA_H}
          onOpen={() => setLightboxIndex(0)}
        />
      )}
      {visual.length > 1 && (
        <div
          className="grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
        >
          {visual.slice(0, 4).map((file, i) => (
            <MediaTile
              key={i}
              file={file}
              height={MEDIA_H / 2 - 3}
              onOpen={() => setLightboxIndex(i)}
            />
          ))}
        </div>
      )}
      {extras.length > 0 && (
        <div style={{ marginTop: visual.length ? 10 : 0 }}>
          <MediaExtras media={extras} />
        </div>
      )}
      {lightboxIndex !== null && (
        <MediaLightbox
          items={visual}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

/** Where a post's detail page lives. Register this route
 *  (`<Route path="/p/:id" element={<PostDetailPage />} />`) or change it here —
 *  it's the only place the path is written. (The mock card's "copy link" text
 *  already used /p/:id, hence the choice.) */
export const postPath = (id: string) => `/p/${id}`;

/** Same wording as the old AnsweredPoll: "3d left" / "4h 26min left" /
 *  "12min left" / "Poll ended". */
function pollStatus(expiresAt: string | null, closed: boolean): string {
  if (closed) return "Poll ended";
  if (!expiresAt) return "";
  const ms = Date.parse(expiresAt) - Date.now();
  if (ms <= 0) return "Poll ended";
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d left`;
  return hours > 0 ? `${hours}h ${mins}min left` : `${mins}min left`;
}

export function PostCard({
  raw,
  variant = "feed",
}: {
  raw: RawContent;
  /** "detail" = the post's own page: the card doesn't navigate to itself, and
   *  the comment thread below it replaces the inline comments panel. */
  variant?: "feed" | "detail";
}) {
  const navigate = useNavigate();
  const { userObject } = useAppSelector((s: RootState) => s.auth);
  const post = mapContentToFeedPost(raw, userObject?.email);
  const { react, removeReaction, toggleBookmark, addComment, recordView } =
    useContentInteractions(post.id, userObject?.email);

  const mine = post.authorEmail === userObject?.email;
  const isSub = false; // TODO: wire once subscription-per-post data exists; see FollowBtn for the query shape

  const [showComments, setShowComments] = useState(false);
  const [reportedLocally, setReportedLocally] = useState(false);

  // Polls: pick an option, then press Vote. The vote request's URL contains the
  // chosen option's id, so the hook is handed the current selection.
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const { vote, isVoting } = usePollVote(
    post.id,
    selectedChoice ?? "",
    userObject?.email,
  );
  const showPollResults = post.pollVotedIndex !== null || post.pollClosed;
  const pollTimeLeft = pollStatus(post.pollExpiresAt, post.pollClosed);

  // View tracking, folded in from the old FeedPost wrapper.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!rootRef.current || post.raw.viewers?.includes(userObject?.email ?? ""))
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          recordView();
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  const menu = mine
    ? [
        {
          ic: "x",
          t: "Delete post",
          danger: true,
          fn: () => {
            /* TODO: delete mutation */
          },
        },
      ]
    : [
        {
          ic: "bookmark",
          t: post.isBookmarked
            ? "Remove from collection"
            : "Save to collection",
          fn: toggleBookmark,
        },
        "-" as const,
        // Mute/block/report have no backend endpoint in the sample payload yet.
        // Left in place — wire each to a real mutation as the API grows.
        reportedLocally
          ? { ic: "flag", t: "Reported ✓", off: true }
          : {
              ic: "flag",
              t: "Report post",
              danger: true,
              fn: () => setReportedLocally(true),
            },
      ];

  return (
    <div
      className="card"
      style={{ padding: 18 }}
      ref={rootRef}
      onClick={
        variant === "feed" ? () => navigate(postPath(post.id)) : undefined
      }
    >
      <div className="row between" onClick={(e) => e.stopPropagation()}>
        <div className="row gap12">
          <Avatar
            name={post.who}
            size={44}
            ring={post.live ? "var(--coral)" : undefined}
          />
          <div className="col">
            <div className="row gap6">
              <span className="b7 t14 uname">{post.who}</span>
              {post.verified && <Verified />}
              {isSub && !mine && (
                <span
                  className="tag"
                  style={{
                    padding: "1px 8px",
                    fontSize: 10.5,
                    color: "var(--blueL-ink)",
                    border: "none",
                  }}
                >
                  Subscribed
                </span>
              )}
            </div>
            <div className="muted t13">
              @{post.handle} · {formatTimeAgo(post.createdAt)}
            </div>
          </div>
        </div>
        <div className="row gap8">
          {!mine && <FollowBtn username={post.handle} />}
          <Menu items={menu} />
        </div>
      </div>

      {post.text && (
        <div
          className="t14"
          style={{ margin: "13px 0", lineHeight: 1.55 }}
          onClick={(e) => e.stopPropagation()}
        >
          {post.text}
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        {/* Locked / PPV — dormant until `visibility`/`price` exist on the payload. */}
        {post.locked ? (
          <div className="locked" style={{ height: LOCKED_H }}>
            <Photo
              sizes={SIZES.feedCard}
              src={post.media[0]?.url}
              blur={10}
              scale={1.12}
            />
            <div className="lockcover">
              <div
                className="feature-ic"
                style={{ background: "rgba(37,153,246,.16)" }}
              >
                <Icon n="lock" c="var(--blueL)" />
              </div>
              <div className="b7" style={{ color: "#fff" }}>
                {isSub ? "Pay-per-view drop" : "Exclusive locked content"}
              </div>
              <div className="row gap8">
                {!isSub && (
                  <button className="btn btn-ghost btn-sm">Subscribe</button>
                )}
                <button className="btn btn-blue btn-sm">
                  Unlock · {post.price} coins
                </button>
              </div>
            </div>
          </div>
        ) : (
          <PostMedia media={post.media} />
        )}

        {post.poll && (
          <div className="col gap8" style={{ marginBottom: 4, marginTop: 12 }}>
            {/* Voting view: time left sits above the options, like the old form. */}
            {!showPollResults && pollTimeLeft && (
              <div className="muted t12">{pollTimeLeft}</div>
            )}

            {post.poll.map((o, i) =>
              showPollResults ? (
                // ── Results: shown once you've voted, or the poll has ended ──
                <div
                  key={o.id || i}
                  className="hair"
                  style={{
                    position: "relative",
                    padding: "11px 14px",
                    borderRadius: 12,
                    overflow: "hidden",
                    borderColor:
                      post.pollVotedIndex === i
                        ? "var(--blue-ink)"
                        : "var(--line)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${o.pct}%`,
                      background:
                        post.pollVotedIndex === i
                          ? "rgba(37,153,246,.3)"
                          : "rgba(37,153,246,.14)",
                    }}
                  />
                  <div className="row between" style={{ position: "relative" }}>
                    <span className="row gap8 b6 t14">
                      {post.pollVotedIndex === i && (
                        <Icon n="check" s={14} c="var(--blueL-ink)" />
                      )}
                      {o.label}
                    </span>
                    <span className="muted t13">{o.pct}%</span>
                  </div>
                </div>
              ) : (
                // ── Voting: pick an option, then press Vote ──
                <button
                  type="button"
                  key={o.id || i}
                  className="hair row gap10"
                  onClick={() => setSelectedChoice(o.id)}
                  style={{
                    padding: "11px 14px",
                    borderRadius: 12,
                    textAlign: "left",
                    borderColor:
                      selectedChoice === o.id
                        ? "var(--blue-ink)"
                        : "var(--line)",
                    background:
                      selectedChoice === o.id
                        ? "rgba(37,153,246,.1)"
                        : undefined,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      flex: "none",
                      borderRadius: "50%",
                      border: `2px solid ${selectedChoice === o.id ? "var(--blue-ink)" : "var(--line2)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedChoice === o.id && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--blue-ink)",
                        }}
                      />
                    )}
                  </span>
                  <span className="b6 t14">{o.label}</span>
                </button>
              ),
            )}

            {!showPollResults && (
              <button
                type="button"
                className="btn btn-blue btn-sm"
                style={{ alignSelf: "flex-start" }}
                disabled={!selectedChoice || isVoting}
                onClick={vote}
              >
                {isVoting ? "Voting…" : "Vote"}
              </button>
            )}

            {showPollResults && (
              <div className="muted t12">
                {post.pollTotalVotes.toLocaleString()}{" "}
                {post.pollTotalVotes === 1 ? "vote" : "votes"}
                {pollTimeLeft && ` · ${pollTimeLeft}`}
                {post.pollVotedIndex !== null && " · you voted"}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="row between postbar"
        style={{ marginTop: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row gap20 postacts">
          <button
            className="row gap6 muted"
            onClick={() =>
              post.myReaction === "LIKE" ? removeReaction() : react("LIKE")
            }
            style={{
              color: post.myReaction === "LIKE" ? "var(--coral-ink)" : "",
            }}
          >
            <Icon
              n="heart"
              s={19}
              fill={post.myReaction === "LIKE" ? "var(--coral-ink)" : undefined}
            />
            {post.counts.reactions}
          </button>
          <button
            className="row gap6 muted"
            onClick={() =>
              variant === "detail"
                ? document
                    .getElementById("post-comments")
                    ?.scrollIntoView({ behavior: "smooth" })
                : setShowComments((v) => !v)
            }
            style={{
              color:
                variant === "feed" && showComments ? "var(--blueL-ink)" : "",
            }}
          >
            <Icon n="comment" s={19} />
            {post.counts.comments}
          </button>
        </div>
        {!mine && (
          <button className="btn btn-ghost btn-sm">
            <Icon n="gift" s={15} />
            Gift
          </button>
        )}
      </div>

      {variant === "feed" && showComments && (
        <div
          style={{
            marginTop: 14,
            borderTop: "1px solid var(--line)",
            paddingTop: 12,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {post.comments.map((c) => (
            <div
              key={c.id}
              className="row gap10"
              style={{ padding: "7px 0", alignItems: "flex-start" }}
            >
              <Avatar name={c.who} src={c.avatar} size={30} />
              <div className="col">
                <span className="t13">
                  <b className="uname">{c.mine ? "You" : c.who}</b>
                </span>
                <span className="t14">{c.text}</span>
              </div>
            </div>
          ))}
          <CommentComposer onSubmit={addComment} />
        </div>
      )}
    </div>
  );
}
