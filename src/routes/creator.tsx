import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { byHandle, useAppStore } from "@/lib/core";
import {
  Avatar,
  Icon,
  Photo,
  SIZES,
  // Verified,
  coverFor,
} from "@/lib/ui";
import { FollowBtn, PostCard } from "@/components/post-card";
import { useGetData, useInfiniteGetData } from "@/hooks/api/use-api";
import { CreatorUser } from "@/utils/types";
import { InfiniteLoader } from "@/components/infinite-loader";
import { MediaTab } from "@/components/MediaTab";

export default function CreatorProfilePage() {
  const { handle = "" } = useParams<{ handle: string }>();
  const S = useAppStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Posts");

  const { data: profileData } = useGetData({
    url: `profile/${handle}`,
    queryKey: ["GetProfileByUserName", handle],
  });

  const creatorProfile = (profileData as { data?: CreatorUser } | undefined)
    ?.data;

  // The Subscribe / Gift / Tip modals were written for a mock `Creator`, and
  // byHandle() falls back to CREATORS[0] for any creator it doesn't know —
  // i.e. every real one — which sent gifts, tips and subscriptions to the WRONG
  // person. Start from whatever it returns (so the modals still get every field
  // they expect) and overwrite the identity with the real profile. `live` only
  // exists in the mock directory, so an unknown creator is never "live".
  // (price and tag still come from the mock: there's no real data for them yet.)
  const mock = byHandle(handle);
  const known = mock.handle === handle;
  const c = {
    ...mock,
    id: known ? mock.id : handle,
    handle,
    name: creatorProfile?.fullName ?? (known ? mock.name : handle),
    live: known ? mock.live : false,
  };
  const isSub = !!S.subs[c.handle];

  const {
    data: creatorContentPages,
    isLoading: creatorContentIsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteGetData({
    url: `contents?creator=${creatorProfile?.email}&liveStream=false&sort=createdDate,desc`,
    queryKey: ["GetUserContent", creatorProfile?.email ?? ""],
    enabled: !!creatorProfile?.email, // don't fetch until we have the email
    pageSize: 20,
  });

  // Was reading only pages[0] — later pages fetched via fetchNextPage were
  // silently dropped. Flatten all fetched pages, same as FeedPage.tsx.
  const creatorContent = useMemo(
    () =>
      creatorContentPages?.pages?.flatMap((page: any) => page.data?.content) ??
      [],
    [creatorContentPages],
  );

  return (
    <div>
      {/* The covers are cropped 3:1 (1500×500) for exactly this strip. Nothing
          is written on it — the avatar is the only thing that overlaps it — so
          it needs no scrim. */}
      <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
        <Photo
          sizes={SIZES.cover}
          src={coverFor(creatorProfile?.coverImageUrl)}
          seed={c.id}
        />
      </div>

      {/* The avatar alone rides up into the photograph; the name, handle and
          counts sit below it on the page background. Pulling the whole header
          block up put the name inside the cover, and a third of the covers are
          near-white — no amount of scrim makes white type readable there. */}
      {/* .content carries its own 26px top padding, which eats into whatever
          negative margin sits here before the avatar ever reaches the seam —
          -78 nets out to roughly half the avatar riding up into the cover,
          not just grazing its bottom edge. */}
      <div className="content" style={{ marginTop: -78 }}>
        {/* The cover strip above is `position: relative`, which — regardless
            of z-index — paints above any plain static sibling in normal
            flow, DOM order or not. Without its own position here, the
            avatar's top half was rendering under the cover instead of over
            it. `relative` puts it in the same paint layer, where DOM order
            (avatar after cover) wins. */}
        <div
          style={{
            width: 112,
            height: 112,
            boxSizing: "border-box",
            border: "4px solid var(--bg)",
            borderRadius: "50%",
            position: "relative",
          }}
        >
          <Avatar
            name={creatorProfile?.displayName}
            size={104}
            ring={c.live ? "var(--coral)" : undefined}
            onClick={c.live ? () => navigate(`/live/${c.handle}`) : undefined}
          />
        </div>

        <div
          className="row between wrap"
          style={{ alignItems: "flex-end", gap: 16, marginTop: 14 }}
        >
          <div className="col gap4">
            <div className="row gap8 t24 b7 uname">
              {creatorProfile?.fullName}
              {/* {c.v && <Verified s={18} />}{" "} */}
              {c.live && (
                <span className="badge-live">
                  <span className="dot" />
                  LIVE
                </span>
              )}
            </div>
            <div className="muted">
              @{creatorProfile?.username} · {c.tag}
            </div>
            <div className="row gap16 muted t13" style={{ marginTop: 4 }}>
              <span>
                <b className="mint">8,412</b> subscribers
              </span>
              <span>
                <b>326</b> posts
              </span>
              <span>
                <b>1.2M</b> likes
              </span>
            </div>
          </div>

          <div className="row gap10">
            {/* FollowBtn takes `username` — prefer the real fetched profile's
                username, falling back to the mock handle if that hasn't
                loaded yet. */}
            <FollowBtn username={creatorProfile?.username ?? c.handle} />
            <button
              className="btn btn-ghost"
              onClick={() => navigate("/messages")}
            >
              <Icon n="msg" s={16} />
              Message
            </button>
            {isSub ? (
              <button
                className="btn btn-ghost"
                style={{
                  color: "var(--mint-ink)",
                  borderColor: "var(--mint-edge)",
                }}
                onClick={() => navigate("/subscriptions")}
              >
                <Icon n="check" s={16} />
                Subscribed
              </button>
            ) : (
              <button
                className="btn btn-blue"
                onClick={() => S.openModal("subscribe", c)}
              >
                Subscribe · ${c.price}/mo
              </button>
            )}
          </div>
        </div>

        <div
          className="row gap24"
          style={{ margin: "22px 0 0", borderBottom: "1px solid var(--line)" }}
        >
          {["Posts", "Media"].map((t) => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "12px 2px",
                cursor: "pointer",
                fontWeight: 600,
                color: tab === t ? "var(--text)" : "var(--muted)",
                borderBottom:
                  tab === t
                    ? "2px solid var(--blue-ink)"
                    : "2px solid transparent",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        <div className="split" style={{ marginTop: 20 }}>
          <div className="grow col gap16" style={{ maxWidth: 620 }}>
            {tab === "Media" ? (
              <MediaTab
                posts={creatorContent}
                isLoading={creatorContentIsLoading}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
              />
            ) : (
              <>
                {creatorContentIsLoading && (
                  <div className="card row center" style={{ padding: 40 }}>
                    <span
                      aria-label="Loading posts"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "var(--muted)",
                        display: "block",
                        animation: "blink 1.4s ease-in-out infinite",
                      }}
                    />
                  </div>
                )}

                {/* was: creatorContent?.map((p) => <PostCard key={p.id} p={p} />)
                    — PostCard takes `raw`, not `p`, and posts key off
                    `publicId`, not `id`. This is why nothing rendered. */}
                {creatorContent.map((raw) => (
                  <PostCard key={raw.publicId} raw={raw} />
                ))}

                <InfiniteLoader
                  onLoadMore={fetchNextPage}
                  hasMore={hasNextPage}
                  isLoading={isFetchingNextPage}
                />
              </>
            )}
            {/* was checking the mock `posts` array's length, not the real
                fetched content, so this could show/hide incorrectly. */}
            {tab === "Posts" &&
              !creatorContentIsLoading &&
              creatorContent.length === 0 && (
                <div className="card col center gap8" style={{ padding: 40 }}>
                  <div className="b7">No posts yet</div>
                  <div className="muted t13">
                    {creatorProfile?.displayName ?? "This creator"} hasn&apos;t
                    posted anything yet.
                  </div>
                </div>
              )}
          </div>
          <div className="col gap16 rail">
            <div className="card" style={{ padding: 18 }}>
              <div className="b7 t18" style={{ marginBottom: 4 }}>
                Subscribe to {c.name.split(" ")[0]}
              </div>
              <div className="muted t13" style={{ marginBottom: 14 }}>
                Unlock all posts, live streams, and DMs.
              </div>
              {(
                [
                  ["1 month", `$${c.price}`],
                  ["3 months", `$${Math.round(c.price * 2.5)} · save 17%`],
                  ["12 months", `$${Math.round(c.price * 9.2)} · save 24%`],
                ] as const
              ).map((b, i) => (
                <div
                  key={i}
                  className="row between hair"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => S.openModal("subscribe", c)}
                >
                  <span className="b6 t14">{b[0]}</span>
                  <span className="blue b7">{b[1]}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div className="row gap10" style={{ marginBottom: 10 }}>
                <button
                  className="btn btn-ghost btn-sm grow"
                  onClick={() => S.openModal("gift", c)}
                >
                  <Icon n="gift" s={14} />
                  Gift
                </button>
                <button
                  className="btn btn-ghost btn-sm grow"
                  onClick={() => S.openModal("tip", c)}
                >
                  <Icon n="dollar" s={14} />
                  Tip
                </button>
              </div>
              <div className="muted2 t12">
                Gifts and tips go 80% to the creator.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
