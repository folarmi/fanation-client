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
//   delete a post      DELETE contents/{postId}                      (TimeLineHomeModal)
//   edit a post        PUT    contents/{postId}                      (EditPost)
//   poll vote          PATCH  contents/{postId}/poll-vote/{choiceId} (AnsweredPoll)

import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomMutation } from "@/hooks/api/use-api";
import { useNotify } from "@/hooks/useNotify";
import type { RawContent } from "@/lib/adapters/content";
import type {
  MediaItem,
  Reaction,
  ReactionType,
  BookMark,
} from "@/utils/types";

/** Paginated list caches shaped { pages: [{ data: { content: [] } }] }.
 *  Add a key here when a new screen lists posts, and likes/bookmarks/votes
 *  keep working there with no other changes. */
const LIST_KEYS = [["GetContents"], ["GetUserContent"]] as const;

/** Single-post cache shaped { data: <post with nested comments/replies> }. */
const DETAIL_KEY = ["GetContentsById"] as const;

/** The Bookmarks page's cache. Different shape from the lists above: each
 *  entry is a SAVE RECORD whose `.content` is the post —
 *  { pages: [{ data: { content: [{ ..., content: <post> }] } }] } */
const BOOKMARK_KEY = ["GetUserBookmarks"] as const;

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
    [...LIST_KEYS, DETAIL_KEY, BOOKMARK_KEY].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [...key], exact: false }),
    );
  };
}

/** Drops a post from the Bookmarks page the instant it's un-bookmarked. */
function useBookmarkRemover() {
  const queryClient = useQueryClient();
  return (publicId: string) => {
    queryClient
      .getQueriesData<any>({ queryKey: [...BOOKMARK_KEY] })
      .forEach(([queryKey]) => {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: {
                ...page.data,
                content: page.data?.content?.filter(
                  (item: any) =>
                    (item?.content?.publicId ?? item?.publicId) !== publicId,
                ),
              },
            })),
          };
        });
      });
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
  const removeFromBookmarks = useBookmarkRemover();
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
    onError: () => {
      invalidate(); // roll back the optimistic change
      notify.error("Something went wrong, please try again");
    },
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

  /**
   * @param currentlyBookmarked  what the UI is showing right now. It has to be
   * passed in: on the Bookmarks page the post arrives nested inside a save
   * record and doesn't carry a reliable `bookmarkers` list, so it can't be
   * worked out from the cache. The endpoint itself is a toggle either way.
   */
  function toggleBookmark(currentlyBookmarked: boolean) {
    const removing = currentlyBookmarked;

    updateCache(publicId, (post) => {
      if (removing) {
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
    if (removing) removeFromBookmarks(publicId);

    saveMutation.mutate(
      { contentPublicId: publicId, saveType: "BOOKMARK" },
      // Same wording the old card used.
      {
        onSuccess: () =>
          notify.success(removing ? "Bookmark removed" : "Post bookmarked"),
      },
    );
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

/**
 * Deleting your own post — ported from the old TimeLineHomeModal.
 *   DELETE contents/{postId}
 * `onDeleted` runs after the server confirms (e.g. leave the post's own page).
 */
export function useDeletePost(publicId: string, onDeleted?: () => void) {
  const invalidate = useInvalidateContent();
  const notify = useNotify();

  const deleteMutation = useCustomMutation({
    endpoint: `contents/${publicId}`,
    method: "delete",
    successMessage: () => "Post deleted successfully",
    onSuccessCallback: () => {
      invalidate();
      onDeleted?.();
    },
    onError: (err: any) =>
      notify.error(err?.response?.data?.message || "Could not delete post"),
  });

  return {
    deletePost: () => deleteMutation.mutate({}),
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Saving an edited post — ported from the old EditPost.
 *   PUT contents/{postId}   body: { message, mentions, mediaFiles }
 * `mediaFiles` is the FULL list the post should end up with (the media being
 * kept plus anything just uploaded) — the request replaces, it doesn't append.
 * Refreshes every list, the detail page and Bookmarks (the old one only
 * refreshed the feed, so an edit didn't show on a profile or detail page).
 */
export function useEditPost(publicId: string, onSaved?: () => void) {
  const invalidate = useInvalidateContent();
  const notify = useNotify();

  const editMutation = useCustomMutation({
    endpoint: `contents/${publicId}`,
    method: "put",
    successMessage: () => "Post edited successfully",
    onSuccessCallback: () => {
      invalidate();
      onSaved?.();
    },
    // The old one swallowed errors silently.
    onError: (err: any) =>
      notify.error(err?.response?.data?.message || "Could not save changes"),
  });

  return {
    savePost: (payload: {
      message: string;
      mentions: string[];
      mediaFiles: MediaItem[];
    }) => editMutation.mutate(payload),
    isSaving: editMutation.isPending,
  };
}
