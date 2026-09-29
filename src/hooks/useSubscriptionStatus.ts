// src/hooks/useSubscriptionStatus.ts
//
// Is the signed-in user subscribed to (following) this creator? ONE place that
// answers it, used by both <FollowBtn> and the "Subscribed" tag on a post, so
// the two can't disagree. It's the same query and the same
// isActivelySubscribed() check FollowBtn always used — the query key is shared,
// so a feed of 20 posts still makes a single request.
//
// (An earlier PostCard of mine set the tag from the mock store's `S.subs`,
// which never reflects real follows — that's the regression this replaces.)
//
// Limit inherited from the original query: it fetches the first 20
// subscriptions only (`size=20`). Someone following more than 20 creators will
// see "Follow" / no tag for the rest. Raise the size or page it if that matters.

import { useGetData } from "@/hooks/api/use-api";
import { useAppSelector } from "@/services/hook";
import type { RootState } from "@/services/store";
import { isActivelySubscribed } from "@/utils/helper";
import type { CreatorUser } from "@/utils/types";

export function useSubscriptionStatus(username: string) {
  const { userObject } = useAppSelector((s: RootState) => s.auth);

  const { data, isLoading } = useGetData({
    url: `subscriptions?page=0&size=20&subscriberEmail=${userObject?.email}`,
    queryKey: ["GetSubscriptionsForViewer"],
  });

  const currentSub = isActivelySubscribed(
    (data as { data?: { content?: CreatorUser[] } } | undefined)?.data
      ?.content ?? [],
    username,
  );

  return {
    currentSub,
    isSubscribed: currentSub ? currentSub.isActive : false,
    isLoading,
  };
}
