// src/hooks/useContentInteractions.ts
//
// All the write-side API calls for a single post, in one place. The card
// component calls `react("LOVE")`, `toggleBookmark()`, `addComment(text)`,
// `recordView()` — it never touches useCustomMutation or the query cache
// directly. Adding a new backend action later (unlock PPV, send a gift,
// repost) means adding one method here, not restructuring the component.
//
// NOTE: endpoint paths below follow the pattern visible in your old code
// (`contents/${id}/view`, `contents/reactions`, `contents/saves`). Confirm
// the exact comment-creation endpoint with your backend — it's a guess.

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

/** Runs `updater` against every mounted variant of the GetContents list
 *  cache (all search terms / filters), so an optimistic update shows up
 *  wherever the post is currently rendered. This replaces the three
 *  near-identical forEach blocks that were duplicated per-action before. */
function useContentCacheUpdater() {
  const queryClient = useQueryClient();

  return (publicId: string, updater: (post: RawContent) => RawContent) => {
    const queries = queryClient.getQueriesData<any>({
      queryKey: ["GetContents"],
    });
    queries.forEach(([queryKey]) => {
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
  };
}

export function useContentInteractions(publicId: string, viewerEmail?: string) {
  const queryClient = useQueryClient();
  const updateCache = useContentCacheUpdater();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["GetContents"], exact: false });

  const reactMutation = useCustomMutation({
    endpoint: `contents/reactions`,
    onSuccessCallback: invalidate,
  });
  const deleteReactionMutation = useCustomMutation({
    endpoint: `contents/${publicId}/reactions`,
    method: "delete",
    onSuccessCallback: invalidate,
  });
  const saveMutation = useCustomMutation({
    endpoint: `contents/saves`,
    onSuccessCallback: invalidate,
  });
  // Matches the old project's convention: replying to content `id` posts to
  // `contents/{id}/replies` (see CommentBox.tsx's mutationEndpoint).
  const commentMutation = useCustomMutation({
    endpoint: `contents/${publicId}/replies`,
    onSuccessCallback: invalidate,
  });
  const viewMutation = useCustomMutation({
    endpoint: `contents/${publicId}/view`,
    onSuccessCallback: () => {},
  });

  // `type` is now ReactionType (not a bare string) so the optimistic object
  // below satisfies `Reaction` without a cast.
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
      // BookMark requires name/profilePic/username, which this hook only
      // has an email for. These placeholders are fine — this entry only
      // exists until `invalidate()` refetches the real bookmarker list a
      // moment later, and the only field the UI actually reads is `email`
      // (see FeedPost.isBookmarked in content-adapter.ts).
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

  function addComment(payload: {
    message: string;
    mentions?: string[];
    mediaFiles?: MediaItem[];
    mediaType?: string;
  }) {
    if (!payload.message.trim() && !payload.mediaFiles?.length) return;
    commentMutation.mutate({
      message: payload.message,
      mentions: payload.mentions ?? [],
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
      commentMutation.isPending,
  };
}
