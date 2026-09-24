// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { byHandle, seedCommentsFor, useAppStore } from "@/lib/core";
// import type { Post } from "@/lib/core";
// import {
//   Avatar,
//   Icon,
//   Loop,
//   Menu,
//   Photo,
//   SIZES,
//   Verified,
//   postMediaFor,
//   postVideoFor,
//   useInView,
// } from "@/lib/ui";
// import { useCustomMutation, useGetData } from "@/hooks/api/use-api";
// import { useQueryClient } from "@tanstack/react-query";
// import { useAppSelector } from "@/services/hook";
// import { RootState } from "@/services/store";
// import { isActivelySubscribed } from "@/utils/helper";
// import { CreatorUser } from "@/utils/types";

// /**
//  * The feed column is 640 wide and the photographs are cropped 3:2, so 420 is
//  * very close to the height the picture wants to be — the frame crops a sliver
//  * off the top and bottom rather than slicing the subject in half. The lock is
//  * shorter on purpose: it is a teaser, and a shorter frame reads as one.
//  */
// const MEDIA_H = 420;
// const LOCKED_H = 320;

// /**
//  * The media on a post.
//  *
//  * Video posts autoplay muted, the way Instagram's web feed does, but only
//  * while they are on screen — `useInView` is what keeps the other eight clips
//  * paused on their poster frame. Clicking toggles play, so a person who wants a
//  * still can have one. There is no sound control here: the loops carry no audio
//  * track, and a speaker button that does nothing is worse than no button.
//  */
// function PostMedia({
//   p,
//   onToggle,
//   playing,
// }: {
//   p: Post;
//   playing: boolean;
//   onToggle: () => void;
// }) {
//   const [ref, inView] = useInView<HTMLDivElement>(0.4);
//   const src = postMediaFor(p);
//   const loop = postVideoFor(p);
//   const isVideo = p.type === "video" && !!loop;

//   return (
//     <div
//       ref={ref}
//       onClick={isVideo ? onToggle : undefined}
//       style={{
//         height: MEDIA_H,
//         borderRadius: 14,
//         position: "relative",
//         overflow: "hidden",
//         cursor: isVideo ? "pointer" : "default",
//       }}
//     >
//       {isVideo ? (
//         <Loop src={loop} poster={src} active={inView && playing} radius={14} />
//       ) : (
//         <Photo
//           sizes={SIZES.feedCard}
//           src={src}
//           seed={p.seed}
//           alt=""
//           radius={14}
//         />
//       )}
//       {isVideo && !playing && (
//         <div className="row center" style={{ position: "absolute", inset: 0 }}>
//           <div
//             className="feature-ic"
//             style={{ width: 56, height: 56, background: "rgba(0,0,0,.42)" }}
//           >
//             <Icon n="play" s={24} c="#fff" fill="#fff" />
//           </div>
//         </div>
//       )}
//       {p.dur && (
//         <div
//           className="pill t12 onart"
//           style={{ position: "absolute", bottom: 10, right: 10 }}
//         >
//           {p.dur}
//         </div>
//       )}
//     </div>
//   );
// }

// export function FollowBtn({ publicId }: { publicId: string }) {
//   const queryClient = useQueryClient();
//   const { userObject } = useAppSelector((state: RootState) => state.auth);

//   const { data: getViewerSubscriptions, isLoading: subsLoading } = useGetData({
//     url: `subscriptions?page=0&size=20&subscriberEmail=${userObject?.email}`,
//     queryKey: ["GetSubscriptionsForViewer"],
//   });

//   const currentSub = isActivelySubscribed(
//     (
//       getViewerSubscriptions as
//         | { data?: { content?: CreatorUser[] } }
//         | undefined
//     )?.data?.content ?? [],
//     publicId,
//   );

//   const isSubscribed = currentSub ? currentSub.isActive : false;

//   const invalidate = () =>
//     queryClient.invalidateQueries({
//       queryKey: ["GetSubscriptionsForViewer"],
//       exact: false,
//     });

//   const subscribeMutation = useCustomMutation({
//     endpoint: `subscriptions/subscribe/${publicId}`,
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

//   const handleClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (isSubscribed) {
//       unsubscribeMutation.mutate({});
//     } else {
//       subscribeMutation.mutate({});
//     }
//   };

//   return (
//     <button
//       className={"btn btn-sm " + (isSubscribed ? "btn-ghost" : "btn-blue")}
//       onClick={handleClick}
//       disabled={isPending || subsLoading}
//     >
//       {isSubscribed ? "Following" : "Follow"}
//     </button>
//   );
// }

// /** Full-action post card — the atom of the fan experience. */
// export function PostCard({ p }: { p: Post }) {
//   const S = useAppStore();
//   const navigate = useNavigate();
//   // `byHandle` falls back to CREATORS[0] for a miss, so "yourhandle" (own
//   // posts) must be excluded explicitly rather than trusted to come back empty.
//   const author = p.mine ? null : byHandle(p.h);
//   const [showC, setShowC] = useState(false);
//   const [ctext, setCtext] = useState("");
//   const [playing, setPlaying] = useState(true);
//   const liked = !!S.liked[p.id];
//   const savedP = !!S.saved[p.id];
//   const isSub = !!S.subs[p.h];
//   const isUnlocked = !!S.unlocked[p.id];
//   const voted = S.votes[p.id];
//   const myC = S.comments[p.id] ?? [];
//   const seeds = p.mine ? [] : seedCommentsFor(p.id);
//   const sendC = () => {
//     const v = ctext.trim();
//     if (!v) return;
//     S.addComment(p.id, v);
//     setCtext("");
//   };
//   const menu = p.mine
//     ? [
//         {
//           ic: "repost",
//           t: "Copy link",
//           fn: () => S.toast(`Link copied — fanation.app/p/${p.id}`),
//         },
//         "-" as const,
//         { ic: "x", t: "Delete post", danger: true, fn: () => S.delPost(p.id) },
//       ]
//     : [
//         {
//           ic: "bookmark",
//           t: savedP ? "Remove from collection" : "Save to collection",
//           fn: () => S.toggleSave(p.id),
//         },
//         {
//           ic: "repost",
//           t: "Copy link",
//           fn: () => S.toast(`Link copied — fanation.app/p/${p.id}`),
//         },
//         "-" as const,
//         { ic: "eye", t: "Not interested", fn: () => S.hide(p.id) },
//         { ic: "bell", t: `Mute @${p.h}`, fn: () => S.mute(p.h) },
//         {
//           ic: "shield",
//           t: `Block @${p.h}`,
//           danger: true,
//           fn: () => S.block(p.h),
//         },
//         S.reported[p.id]
//           ? { ic: "flag", t: "Reported ✓", off: true }
//           : {
//               ic: "flag",
//               t: "Report post",
//               danger: true,
//               fn: () => S.openModal("report", p),
//             },
//       ];

//   return (
//     <div className="card" style={{ padding: 18 }}>
//       <div className="row between">
//         <div className="row gap12">
//           <Avatar
//             name={p.who}
//             size={44}
//             ring={author?.live ? "var(--coral)" : undefined}
//             onClick={author?.live ? () => navigate(`/live/${p.h}`) : undefined}
//           />
//           <div className="col">
//             <div className="row gap6">
//               <span className="b7 t14 uname">{p.who}</span>
//               {p.v && <Verified />}
//               {isSub && !p.mine && (
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
//               {p.mine && p.vis && (
//                 <span
//                   className="tag"
//                   style={{ padding: "1px 8px", fontSize: 10.5 }}
//                 >
//                   {p.vis}
//                 </span>
//               )}
//             </div>
//             <div className="muted t13">
//               @{p.h} · {p.t}
//             </div>
//           </div>
//         </div>
//         <Menu items={menu} />
//       </div>
//       <div className="t14" style={{ margin: "13px 0", lineHeight: 1.55 }}>
//         {p.text}
//       </div>

//       {(p.type === "image" || p.type === "video") && (
//         <PostMedia
//           p={p}
//           playing={playing}
//           onToggle={() => setPlaying((v) => !v)}
//         />
//       )}

//       {p.poll && (
//         <div className="col gap8" style={{ marginBottom: 4 }}>
//           {p.poll.map((o, i) => {
//             const pct =
//               voted == null
//                 ? o.pct
//                 : voted === i
//                   ? Math.min(99, o.pct + 1)
//                   : Math.max(1, o.pct - 1);
//             return (
//               <div
//                 key={i}
//                 className="hair"
//                 onClick={() => {
//                   if (voted == null) S.vote(p.id, i);
//                 }}
//                 style={{
//                   position: "relative",
//                   padding: "11px 14px",
//                   borderRadius: 12,
//                   overflow: "hidden",
//                   cursor: voted == null ? "pointer" : "default",
//                   borderColor: voted === i ? "var(--blue-ink)" : "var(--line)",
//                 }}
//               >
//                 <div
//                   style={{
//                     position: "absolute",
//                     left: 0,
//                     top: 0,
//                     bottom: 0,
//                     width: `${pct}%`,
//                     background:
//                       voted === i
//                         ? "rgba(37,153,246,.3)"
//                         : "rgba(37,153,246,.14)",
//                     transition: ".4s",
//                   }}
//                 />
//                 <div className="row between" style={{ position: "relative" }}>
//                   <span className="row gap8 b6 t14">
//                     {voted === i && (
//                       <Icon n="check" s={14} c="var(--blueL-ink)" />
//                     )}
//                     {o.label}
//                   </span>
//                   <span className="muted t13">{pct}%</span>
//                 </div>
//               </div>
//             );
//           })}
//           <div className="muted t12">
//             {voted == null
//               ? "1,204 votes · 2 days left"
//               : "1,205 votes · you voted · 2 days left"}
//           </div>
//         </div>
//       )}

//       {p.type === "locked" && !isUnlocked && (
//         <div className="locked" style={{ height: LOCKED_H }}>
//           {/* Same photograph the unlocked branch shows, blurred in CSS rather
//               than pre-blurred into a second file — unlocking has to reveal the
//               picture the blur was hiding, not swap in a different one. The
//               oversize scale covers the soft rim a blur leaves at the edges. */}
//           <Photo
//             sizes={SIZES.feedCard}
//             src={postMediaFor(p)}
//             seed={p.seed}
//             blur={10}
//             scale={1.12}
//           />
//           <div className="lockcover">
//             <div
//               className="feature-ic"
//               style={{ background: "rgba(37,153,246,.16)" }}
//             >
//               <Icon n="lock" c="var(--blueL)" />
//             </div>
//             <div className="b7" style={{ color: "#fff" }}>
//               {isSub ? "Pay-per-view drop" : "Exclusive locked content"}
//             </div>
//             <div className="row gap8">
//               {!isSub && (
//                 <button
//                   className="btn btn-ghost btn-sm"
//                   onClick={() => S.openModal("subscribe", byHandle(p.h))}
//                 >
//                   Subscribe
//                 </button>
//               )}
//               <button
//                 className="btn btn-blue btn-sm"
//                 onClick={() => S.openModal("ppv", p)}
//               >
//                 Unlock · {p.price} coins
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {p.type === "locked" && isUnlocked && (
//         <div
//           style={{
//             height: MEDIA_H,
//             borderRadius: 14,
//             position: "relative",
//             overflow: "hidden",
//           }}
//         >
//           <Photo
//             sizes={SIZES.feedCard}
//             src={postMediaFor(p)}
//             seed={p.seed}
//             radius={14}
//           />
//           <span
//             className="chip-mint onart"
//             style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}
//           >
//             <Icon n="check" s={12} />
//             Unlocked
//           </span>
//         </div>
//       )}

//       {/* `postbar`/`postacts` exist only so the phone breakpoint can tighten these
//           gaps — at 390px the default 20px spacing runs the row past the card. */}
//       <div className="row between postbar" style={{ marginTop: 14 }}>
//         <div className="row gap20 postacts">
//           <button
//             className="row gap6 muted"
//             onClick={() => S.toggleLike(p.id)}
//             style={{ color: liked ? "var(--coral-ink)" : "" }}
//           >
//             <Icon
//               n="heart"
//               s={19}
//               fill={liked ? "var(--coral-ink)" : undefined}
//             />
//             {(p.likes + (liked ? 1 : 0)).toLocaleString()}
//           </button>
//           <button
//             className="row gap6 muted"
//             onClick={() => setShowC((v) => !v)}
//             style={{ color: showC ? "var(--blueL-ink)" : "" }}
//           >
//             <Icon n="comment" s={19} />
//             {p.comments + myC.length}
//           </button>
//         </div>
//         <div className="row gap12">
//           {!p.mine && (
//             <button
//               className="btn btn-ghost btn-sm"
//               onClick={() => S.openModal("gift", byHandle(p.h))}
//             >
//               <Icon n="gift" s={15} />
//               Gift
//             </button>
//           )}
//         </div>
//       </div>

//       {showC && (
//         <div
//           style={{
//             marginTop: 14,
//             borderTop: "1px solid var(--line)",
//             paddingTop: 12,
//           }}
//         >
//           {seeds.map((c, i) => (
//             <div
//               key={i}
//               className="row gap10"
//               style={{ padding: "7px 0", alignItems: "flex-start" }}
//             >
//               <Avatar name={c[0]} size={30} />
//               <div className="col">
//                 <span className="t13">
//                   <b className="uname">{c[0]}</b>{" "}
//                   <span className="muted2">@{c[1]}</span>
//                 </span>
//                 <span className="t14">{c[2]}</span>
//               </div>
//             </div>
//           ))}
//           {myC.map((c, i) => (
//             <div
//               key={`m${i}`}
//               className="row gap10"
//               style={{ padding: "7px 0", alignItems: "flex-start" }}
//             >
//               <Avatar name="You" size={30} />
//               <div className="col">
//                 <span className="t13">
//                   <b className="uname">You</b>{" "}
//                   <span className="muted2">@yourhandle · now</span>
//                 </span>
//                 <span className="t14">{c}</span>
//               </div>
//             </div>
//           ))}
//           <div className="row gap10" style={{ marginTop: 8 }}>
//             <Avatar name="You" size={32} />
//             <input
//               className="input"
//               placeholder="Add a comment…"
//               value={ctext}
//               style={{ padding: "9px 13px" }}
//               onChange={(e) => setCtext(e.target.value)}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") sendC();
//               }}
//             />
//             <button
//               className="btn btn-blue btn-sm"
//               disabled={!ctext.trim()}
//               onClick={sendC}
//             >
//               <Icon n="send" s={15} />
//             </button>
//           </div>
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
import { useContentInteractions } from "@/hooks/useContentInteractions";

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

/** One media item — photo or video, autoplay-when-in-view like the mock version. */
function MediaTile({
  file,
  height,
  playing,
  onToggle,
}: {
  file: FeedPost["media"][number];
  height: number;
  playing: boolean;
  onToggle: () => void;
}) {
  const isVideo = file.isVideo;
  return (
    <div
      onClick={isVideo ? onToggle : undefined}
      style={{
        height,
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
        cursor: isVideo ? "pointer" : "default",
      }}
    >
      {isVideo ? (
        <Loop src={file.url} poster={undefined} active={playing} radius={14} />
      ) : (
        <Photo sizes={SIZES.feedCard} src={file.url} alt="" radius={14} />
      )}
      {isVideo && !playing && (
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

/** 0..N media files. Single file = full-width block; multiple = a simple grid.
 *  This is the one part of the visual layer that genuinely differs from the
 *  mock version, because the mock only ever had one image per post. */
function PostMedia({ media }: { media: FeedPost["media"] }) {
  const [playingIdx, setPlayingIdx] = useState<number | null>(0);
  if (!media.length) return null;

  if (media.length === 1) {
    return (
      <MediaTile
        file={media[0]}
        height={MEDIA_H}
        playing={playingIdx === 0}
        onToggle={() => setPlayingIdx((v) => (v === 0 ? null : 0))}
      />
    );
  }

  return (
    <div
      className="grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
      }}
    >
      {media.slice(0, 4).map((file, i) => (
        <MediaTile
          key={i}
          file={file}
          height={MEDIA_H / 2 - 3}
          playing={playingIdx === i}
          onToggle={() => setPlayingIdx((v) => (v === i ? null : i))}
        />
      ))}
    </div>
  );
}

export function PostCard({ raw }: { raw: RawContent }) {
  const navigate = useNavigate();
  const { userObject } = useAppSelector((s: RootState) => s.auth);
  const post = mapContentToFeedPost(raw, userObject?.email);
  const { react, removeReaction, toggleBookmark, addComment, recordView } =
    useContentInteractions(post.id, userObject?.email);

  const mine = post.authorEmail === userObject?.email;
  const isSub = false; // TODO: wire once subscription-per-post data exists; see FollowBtn for the query shape

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [reportedLocally, setReportedLocally] = useState(false);

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

  const sendComment = () => {
    const v = commentText.trim();
    if (!v) return;
    addComment(v);
    setCommentText("");
  };

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
      onClick={() => navigate(`/dashboard/${post.id}`)}
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
          {!mine && <FollowBtn username={post.raw.createdBy} />}
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
            {post.poll.map((o, i) => (
              <div
                key={i}
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
            ))}
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
            onClick={() => setShowComments((v) => !v)}
            style={{ color: showComments ? "var(--blueL-ink)" : "" }}
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

      {showComments && (
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
              <Avatar name={c.mine ? "You" : c.authorEmail} size={30} />
              <div className="col">
                <span className="t13">
                  <b className="uname">
                    {c.mine ? "You" : c.authorEmail.split("@")[0]}
                  </b>
                </span>
                <span className="t14">{c.text}</span>
              </div>
            </div>
          ))}
          <div className="row gap10" style={{ marginTop: 8 }}>
            <Avatar name="You" size={32} />
            <input
              className="input"
              placeholder="Add a comment…"
              value={commentText}
              style={{ padding: "9px 13px" }}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
            />
            <button
              className="btn btn-blue btn-sm"
              disabled={!commentText.trim()}
              onClick={sendComment}
            >
              <Icon n="send" s={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
