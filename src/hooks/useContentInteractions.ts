// // src/hooks/useContentInteractions.ts
// //
// // All the write-side API calls for a single post, in one place. The card
// // component calls `react("LOVE")`, `toggleBookmark()`, `addComment(text)`,
// // `recordView()` — it never touches useCustomMutation or the query cache
// // directly. Adding a new backend action later (unlock PPV, send a gift,
// // repost) means adding one method here, not restructuring the component.
// //
// // NOTE: endpoint paths below follow the pattern visible in your old code
// // (`contents/${id}/view`, `contents/reactions`, `contents/saves`). Confirm
// // the exact comment-creation endpoint with your backend — it's a guess.

// import { useRef } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { useCustomMutation } from "@/hooks/api/use-api";
// import type { RawContent } from "@/lib/adapters/content";
// import type {
//   MediaItem,
//   Reaction,
//   ReactionType,
//   BookMark,
// } from "@/utils/types";

// /** Runs `updater` against every mounted variant of the GetContents list
//  *  cache (all search terms / filters), so an optimistic update shows up
//  *  wherever the post is currently rendered. This replaces the three
//  *  near-identical forEach blocks that were duplicated per-action before. */
// function useContentCacheUpdater() {
//   const queryClient = useQueryClient();

//   return (publicId: string, updater: (post: RawContent) => RawContent) => {
//     const queries = queryClient.getQueriesData<any>({
//       queryKey: ["GetContents"],
//     });
//     queries.forEach(([queryKey]) => {
//       queryClient.setQueryData(queryKey, (oldData: any) => {
//         if (!oldData?.pages) return oldData;
//         return {
//           ...oldData,
//           pages: oldData.pages.map((page: any) => ({
//             ...page,
//             data: {
//               ...page.data,
//               content: page.data?.content?.map((post: RawContent) =>
//                 post?.publicId === publicId ? updater(post) : post,
//               ),
//             },
//           })),
//         };
//       });
//     });
//   };
// }

// export function useContentInteractions(publicId: string, viewerEmail?: string) {
//   const queryClient = useQueryClient();
//   const updateCache = useContentCacheUpdater();

//   const invalidate = () =>
//     queryClient.invalidateQueries({ queryKey: ["GetContents"], exact: false });

//   const reactMutation = useCustomMutation({
//     endpoint: `contents/reactions`,
//     onSuccessCallback: invalidate,
//   });
//   const deleteReactionMutation = useCustomMutation({
//     endpoint: `contents/${publicId}/reactions`,
//     method: "delete",
//     onSuccessCallback: invalidate,
//   });
//   const saveMutation = useCustomMutation({
//     endpoint: `contents/saves`,
//     onSuccessCallback: invalidate,
//   });
//   // Matches the old project's convention: replying to content `id` posts to
//   // `contents/{id}/replies` (see CommentBox.tsx's mutationEndpoint).
//   const commentMutation = useCustomMutation({
//     endpoint: `contents/${publicId}/replies`,
//     onSuccessCallback: invalidate,
//   });
//   const viewMutation = useCustomMutation({
//     endpoint: `contents/${publicId}/view`,
//     onSuccessCallback: () => {},
//   });

//   // `type` is now ReactionType (not a bare string) so the optimistic object
//   // below satisfies `Reaction` without a cast.
//   function react(type: ReactionType) {
//     const now = new Date().toISOString();
//     updateCache(publicId, (post) => {
//       const optimistic: Reaction = {
//         publicId: `temp-${Date.now()}`,
//         createdBy: viewerEmail ?? "",
//         lastModifiedBy: viewerEmail ?? "",
//         createdDate: now,
//         lastModifiedDate: now,
//         type,
//       };
//       return {
//         ...post,
//         reactions: [
//           ...(post.reactions ?? []).filter((r) => r.createdBy !== viewerEmail),
//           optimistic,
//         ],
//       };
//     });
//     reactMutation.mutate({ pubId: publicId, reactionType: type });
//   }

//   function removeReaction() {
//     updateCache(publicId, (post) => ({
//       ...post,
//       reactions: (post.reactions ?? []).filter(
//         (r) => r.createdBy !== viewerEmail,
//       ),
//     }));
//     deleteReactionMutation.mutate({});
//   }

//   function toggleBookmark() {
//     updateCache(publicId, (post) => {
//       const already = post.bookmarkers?.some((b) => b.email === viewerEmail);
//       if (already) {
//         return {
//           ...post,
//           bookmarkers: post.bookmarkers?.filter((b) => b.email !== viewerEmail),
//         };
//       }
//       // BookMark requires name/profilePic/username, which this hook only
//       // has an email for. These placeholders are fine — this entry only
//       // exists until `invalidate()` refetches the real bookmarker list a
//       // moment later, and the only field the UI actually reads is `email`
//       // (see FeedPost.isBookmarked in content-adapter.ts).
//       const optimistic: BookMark = {
//         email: viewerEmail ?? "",
//         name: "",
//         profilePic: "",
//         username: "",
//       };
//       return {
//         ...post,
//         bookmarkers: [...(post.bookmarkers ?? []), optimistic],
//       };
//     });
//     saveMutation.mutate({ contentPublicId: publicId, saveType: "BOOKMARK" });
//   }

//   function addComment(payload: {
//     message: string;
//     mentions?: string[];
//     mediaFiles?: MediaItem[];
//     mediaType?: string;
//   }) {
//     if (!payload.message.trim() && !payload.mediaFiles?.length) return;
//     commentMutation.mutate({
//       message: payload.message,
//       mentions: payload.mentions ?? [],
//       mediaFiles: payload.mediaFiles ?? [],
//       mediaType: payload.mediaType,
//     });
//   }

//   const hasRecordedView = useRef(false);
//   function recordView() {
//     if (hasRecordedView.current) return;
//     hasRecordedView.current = true;
//     viewMutation.mutate({});
//   }

//   return {
//     react,
//     removeReaction,
//     toggleBookmark,
//     addComment,
//     recordView,
//     isMutating:
//       reactMutation.isPending ||
//       deleteReactionMutation.isPending ||
//       saveMutation.isPending ||
//       commentMutation.isPending,
//   };
// }

// src/hooks/useContentInteractions.ts
//
// All the write-side API calls, in one place. Components call `react("LIKE")`,
// `toggleBookmark()`, `addComment(...)`, `usePollVote(...)` — they never touch
// useCustomMutation or the query cache directly.
//
// Every endpoint below is taken from the old project's own code:
//   like / unlike      POST   contents/reactions  { pubId, reactionType }
//                      DELETE contents/{id}/reactions
//                      (the old Postcard used these for posts AND comments)
//   bookmark           POST   contents/saves      { contentPublicId, saveType }
//   view               POST   contents/{id}/view
//   comment on a post  POST   contents/{postId}/comments            (CommentThread)
//   reply to a comment POST   contents/comments/{commentId}/replies (CommentItem)
//   delete a comment   DELETE contents/comments/{commentId}/remove  (DeleteButton)
//   poll vote          PATCH  contents/{postId}/poll-vote/{choiceId} (AnsweredPoll)

// src/hooks/useContentInteractions.ts
//
// All the write-side API calls, in one place. Components call `react("LIKE")`,
// `toggleBookmark()`, `addComment(...)`, `usePollVote(...)` — they never touch
// useCustomMutation or the query cache directly.
//
// Every endpoint below is taken from the old project's own code:
//   like / unlike      POST   contents/reactions  { pubId, reactionType }
//                      DELETE contents/{id}/reactions
//                      (the old Postcard used these for posts AND comments)
//   bookmark           POST   contents/saves      { contentPublicId, saveType }
//   view               POST   contents/{id}/view
//   comment on a post  POST   contents/{postId}/comments            (CommentThread)
//   reply to a comment POST   contents/comments/{commentId}/replies (CommentItem)
//   delete a comment   DELETE contents/comments/{commentId}/remove  (DeleteButton)
//   poll vote          PATCH  contents/{postId}/poll-vote/{choiceId} (AnsweredPoll)

import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomMutation } from "@/hooks/api/use-api";
import type { RawContent } from "@/lib/adapters/content";
import type {
  MediaItem,
  Reaction,
  ReactionType,
  BookMark,
} from "@/utils/types";
import { useNotify } from "./useNotify";

/** Paginated list caches shaped { pages: [{ data: { content: [] } }] }.
 *  Add a key here when a new screen lists posts, and likes/bookmarks/votes
 *  keep working there with no other changes. */
const LIST_KEYS = [["GetContents"], ["GetUserContent"]] as const;

/** Single-post cache shaped { data: <post with nested comments/replies> }. */
const DETAIL_KEY = ["GetContentsById"] as const;

/** Applies `updater` to whichever node in a post/comment/reply tree has the
 *  matching publicId, leaving the rest of the tree untouched. */
function patchTree(node: any, id: string, updater: (n: any) => any): any {
  if (!node || typeof node !== "object") return node;
  const patched = node.publicId === id ? updater(node) : node;
  const next = { ...patched };
  if (Array.isArray(patched.comments)) {
    next.comments = patched.comments.map((c: any) => patchTree(c, id, updater));
  }
  if (Array.isArray(patched.replies)) {
    next.replies = patched.replies.map((r: any) => patchTree(r, id, updater));
  }
  return next;
}

function useContentCacheUpdater() {
  const queryClient = useQueryClient();

  return (publicId: string, updater: (post: RawContent) => RawContent) => {
    // 1. Every mounted list (feed, creator profile, ...)
    LIST_KEYS.forEach((key) => {
      queryClient
        .getQueriesData<any>({ queryKey: [...key] })
        .forEach(([queryKey]) => {
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: {
                  ...page.data,
                  content: page.data?.content?.map((post: RawContent) =>
                    post?.publicId === publicId ? updater(post) : post,
                  ),
                },
              })),
            };
          });
        });
    });

    // 2. The detail page's cache — the post itself, or a comment/reply inside it
    queryClient
      .getQueriesData<any>({ queryKey: [...DETAIL_KEY] })
      .forEach(([queryKey]) => {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: patchTree(oldData.data, publicId, updater),
          };
        });
      });
  };
}

/** Refetch every cache that can show this content. Shared by all the hooks
 *  below so a new list key only ever needs adding to LIST_KEYS. */
export function useInvalidateContent() {
  const queryClient = useQueryClient();
  return () => {
    [...LIST_KEYS, DETAIL_KEY].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [...key], exact: false }),
    );
  };
}

/**
 * @param kind  "post" (default) or "comment". It only changes where
 *              `addComment` sends: on a post it adds a comment, on a comment
 *              it adds a reply. Likes work identically for both.
 */
export function useContentInteractions(
  publicId: string,
  viewerEmail?: string,
  kind: "post" | "comment" = "post",
) {
  const updateCache = useContentCacheUpdater();
  const invalidate = useInvalidateContent();
  const notify = useNotify();

  // On failure, refetch too — otherwise the optimistic heart/bookmark stays
  // on screen even though the server rejected it.
  const reactMutation = useCustomMutation({
    endpoint: `contents/reactions`,
    onSuccessCallback: invalidate,
    onError: invalidate,
  });
  const deleteReactionMutation = useCustomMutation({
    endpoint: `contents/${publicId}/reactions`,
    method: "delete",
    onSuccessCallback: invalidate,
    onError: invalidate,
  });
  const saveMutation = useCustomMutation({
    endpoint: `contents/saves`,
    onSuccessCallback: invalidate,
    onError: invalidate,
  });
  const replyMutation = useCustomMutation({
    endpoint:
      kind === "comment"
        ? `contents/comments/${publicId}/replies`
        : `contents/${publicId}/comments`,
    onSuccessCallback: invalidate,
    // Same wording the old CommentBox used for replies.
    successMessage: () =>
      kind === "comment"
        ? "Reply added successfully"
        : "Comment added successfully",
    onError: (err: any) =>
      notify.error(err?.response?.data?.message || "An error occurred"),
  });
  const viewMutation = useCustomMutation({
    endpoint: `contents/${publicId}/view`,
    onSuccessCallback: () => {},
  });

  function react(type: ReactionType) {
    const now = new Date().toISOString();
    updateCache(publicId, (post) => {
      const optimistic: Reaction = {
        publicId: `temp-${Date.now()}`,
        createdBy: viewerEmail ?? "",
        lastModifiedBy: viewerEmail ?? "",
        createdDate: now,
        lastModifiedDate: now,
        type,
      };
      return {
        ...post,
        reactions: [
          ...(post.reactions ?? []).filter((r) => r.createdBy !== viewerEmail),
          optimistic,
        ],
      };
    });
    reactMutation.mutate({ pubId: publicId, reactionType: type });
  }

  function removeReaction() {
    updateCache(publicId, (post) => ({
      ...post,
      reactions: (post.reactions ?? []).filter(
        (r) => r.createdBy !== viewerEmail,
      ),
    }));
    deleteReactionMutation.mutate({});
  }

  function toggleBookmark() {
    updateCache(publicId, (post) => {
      const already = post.bookmarkers?.some((b) => b.email === viewerEmail);
      if (already) {
        return {
          ...post,
          bookmarkers: post.bookmarkers?.filter((b) => b.email !== viewerEmail),
        };
      }
      // BookMark requires name/profilePic/username, which this hook only has
      // an email for. Fine: this entry lives until invalidate() refetches, and
      // the only field the UI reads is `email` (FeedPost.isBookmarked).
      const optimistic: BookMark = {
        email: viewerEmail ?? "",
        name: "",
        profilePic: "",
        username: "",
      };
      return {
        ...post,
        bookmarkers: [...(post.bookmarkers ?? []), optimistic],
      };
    });
    saveMutation.mutate({ contentPublicId: publicId, saveType: "BOOKMARK" });
  }

  /** On a post: adds a comment. On a comment: adds a reply. */
  function addComment(payload: {
    message: string;
    mentions?: string[];
    mediaFiles?: MediaItem[];
    mediaType?: string;
  }) {
    if (!payload.message.trim() && !payload.mediaFiles?.length) return;
    replyMutation.mutate({
      message: payload.message,
      mentions: payload.mentions ?? [],
      scheduledFor: null, // the old CommentBox always sent this, null for comments
      mediaFiles: payload.mediaFiles ?? [],
      mediaType: payload.mediaType,
    });
  }

  const hasRecordedView = useRef(false);
  function recordView() {
    if (hasRecordedView.current) return;
    hasRecordedView.current = true;
    viewMutation.mutate({});
  }

  return {
    react,
    removeReaction,
    toggleBookmark,
    addComment,
    recordView,
    isMutating:
      reactMutation.isPending ||
      deleteReactionMutation.isPending ||
      saveMutation.isPending ||
      replyMutation.isPending,
  };
}

/**
 * Voting — ported from the old AnsweredPoll.tsx.
 *
 * The choice id is part of the URL, so the caller passes the currently
 * selected id in and the endpoint follows it: pick an option (a render), then
 * press Vote (a later event) — exactly how the old form's `watch()` worked.
 */
export function usePollVote(
  publicId: string,
  choiceId: string,
  viewerEmail?: string,
) {
  const updateCache = useContentCacheUpdater();
  const invalidate = useInvalidateContent();
  const notify = useNotify();

  const voteMutation = useCustomMutation({
    endpoint: `contents/${publicId}/poll-vote/${choiceId}`,
    method: "patch",
    onSuccessCallback: invalidate,
    successMessage: () => "Vote submitted!",
    onError: (err: any) => {
      invalidate(); // roll back the optimistic vote below
      notify.error(err?.response?.data?.message || "An error occurred");
    },
  });

  function vote() {
    if (!choiceId) return;
    // Optimistic: count my vote immediately so the results view appears at once.
    updateCache(publicId, (post) => ({
      ...post,
      pollChoices: post.pollChoices?.map((c) =>
        c.publicId === choiceId
          ? { ...c, votes: [...(c.votes ?? []), viewerEmail ?? ""] }
          : c,
      ),
    }));
    voteMutation.mutate({ pollChoiceId: choiceId });
  }

  return { vote, isVoting: voteMutation.isPending };
}

/**
 * Deleting a comment or reply — ported from the old CommentThread's
 * DeleteButton. `onError` lets the caller close its "Delete? Yes / No" prompt,
 * as the old one did.
 */
export function useDeleteComment(commentId: string, onError?: () => void) {
  const invalidate = useInvalidateContent();

  const deleteMutation = useCustomMutation({
    endpoint: `contents/comments/${commentId}/remove`,
    method: "delete",
    onSuccessCallback: invalidate,
    successMessage: () => "Comment deleted successfully",
    onError: () => onError?.(),
  });

  return {
    deleteComment: () => deleteMutation.mutate({}),
    isDeleting: deleteMutation.isPending,
  };
}
