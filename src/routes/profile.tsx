// import { useNavigate } from "react-router-dom";
// import { useAppStore } from "@/lib/core";
// import { Avatar, Icon, Photo, SIZES, coverFor } from "@/lib/ui";
// import { PostCard } from "@/components/post-card";
// import { useFetchProfile } from "@/hooks/apiHooks";
// import { useAppSelector } from "@/services/hook";
// import { RootState } from "@/services/store";
// import { useInfiniteGetData } from "@/hooks/api/use-api";

// /**
//  * The signed-in account's own profile — same header/avatar shape as
//  * `/creator/:handle`, but there is no creator to subscribe to or tip here,
//  * so those actions are swapped for editing and posting. Name and handle
//  * come from the store (`S.profile`), same as the sidebar's account card in
//  * `_shell.tsx` — editing here is what keeps both in sync.
//  */
// export default function ProfilePage() {
//   const S = useAppStore();
//   const navigate = useNavigate();
//   const { userObject } = useAppSelector((state: RootState) => state.auth);

//   // const { name, handle, avatarUrl, coverUrl } = S.profile;
//   const subCount = Object.keys(S.subs).length;
//   const followCount = Object.values(S.follows).filter(Boolean).length;

//   const myProfileQuery = useFetchProfile(userObject, true);
//   const myProfileData = myProfileQuery?.data?.data;
//   const isCreator = myProfileQuery?.data?.data?.role === "CREATOR";
//   const contentEmail = myProfileQuery?.data?.data?.email;

//   const {
//     data: creatorContentPages,
//     // isLoading: creatorContentIsLoading,
//     // fetchNextPage,
//     // hasNextPage,
//     // isFetchingNextPage,
//   } = useInfiniteGetData({
//     url: `contents?creator=${contentEmail}&liveStream=false&sort=createdDate,desc`,
//     queryKey: ["GetUserContent", contentEmail ?? ""],
//     enabled: !!contentEmail, // don't fetch until we have the email
//     pageSize: 20,
//   });
//   const contentPages = creatorContentPages?.pages[0]?.data?.content;
//   console.log(contentPages);
//   return (
//     <div>
//       <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
//         {myProfileData?.coverImageUrl ? (
//           <img
//             src={myProfileData?.coverImageUrl}
//             alt=""
//             style={{
//               position: "absolute",
//               inset: 0,
//               width: "100%",
//               height: "100%",
//               objectFit: "cover",
//             }}
//           />
//         ) : (
//           <Photo
//             sizes={SIZES.cover}
//             src={coverFor(myProfileData?.username)}
//             seed={myProfileData?.username}
//           />
//         )}
//       </div>

//       <div className="content" style={{ marginTop: -78 }}>
//         <div
//           style={{
//             width: 112,
//             height: 112,
//             boxSizing: "border-box",
//             border: "4px solid var(--bg)",
//             borderRadius: "50%",
//             position: "relative",
//           }}
//         >
//           <Avatar
//             name={myProfileData?.fullName}
//             size={104}
//             src={myProfileData?.profileImageUrl}
//           />
//         </div>

//         <div
//           className="row between wrap"
//           style={{ alignItems: "flex-end", gap: 16, marginTop: 14 }}
//         >
//           <div className="col gap4">
//             <div className="t24 b7 uname">{myProfileData?.fullName}</div>
//             <div className="muted">@{myProfileData?.username}</div>

//             {isCreator && (
//               <div className="row gap16 muted t13" style={{ marginTop: 4 }}>
//                 <span>
//                   <b>{S.myPosts.length}</b> posts
//                 </span>
//                 <span>
//                   <b>{subCount}</b> subscriptions
//                 </span>
//                 <span>
//                   <b>{followCount}</b> following
//                 </span>
//               </div>
//             )}
//           </div>

//           <div className="row gap10">
//             <button
//               className="btn btn-ghost"
//               onClick={() => navigate("/profile/edit")}
//             >
//               <Icon n="gear" s={16} />
//               Edit profile
//             </button>
//             <button
//               className="btn btn-blue"
//               onClick={() => S.openModal("compose")}
//             >
//               <Icon n="plus" s={15} />
//               New post
//             </button>
//           </div>
//         </div>

//         <div className="up muted" style={{ margin: "26px 0 14px" }}>
//           Your posts
//         </div>

//         <div className="col gap16" style={{ maxWidth: 620 }}>
//           {creatorContentPages?.length === 0 ? (
//             <div
//               className="card col center gap10"
//               style={{ padding: 48, textAlign: "center" }}
//             >
//               <div className="feature-ic" style={{ background: "var(--fill)" }}>
//                 <Icon n="doc" c="var(--muted)" />
//               </div>
//               <div className="b7">You haven&apos;t posted yet</div>
//               <div className="muted t13">
//                 Share something with your fans to see it here.
//               </div>
//               <button
//                 className="btn btn-blue btn-sm"
//                 onClick={() => S.openModal("compose")}
//               >
//                 Create a post
//               </button>
//             </div>
//           ) : (
//             contentPages?.map((p) => <PostCard key={p.id} p={p} />)
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { Avatar, Icon, Photo, SIZES, coverFor } from "@/lib/ui";
import { PostCard } from "@/components/post-card";
import { useFetchProfile } from "@/hooks/apiHooks";
import { useAppSelector } from "@/services/hook";
import { RootState } from "@/services/store";
import { useInfiniteGetData } from "@/hooks/api/use-api";
import type { RawContent } from "@/lib/adapters/content";
import { InfiniteLoader } from "@/components/infinite-loader";

/**
 * The signed-in account's own profile — same header/avatar shape as
 * `/creator/:handle`, but there is no creator to subscribe to or tip here,
 * so those actions are swapped for editing and posting. Name and handle
 * come from the store (`S.profile`), same as the sidebar's account card in
 * `_shell.tsx` — editing here is what keeps both in sync.
 */
export default function ProfilePage() {
  const S = useAppStore();
  const navigate = useNavigate();
  const { userObject } = useAppSelector((state: RootState) => state.auth);

  // const { name, handle, avatarUrl, coverUrl } = S.profile;
  const subCount = Object.keys(S.subs).length;
  const followCount = Object.values(S.follows).filter(Boolean).length;

  const myProfileQuery = useFetchProfile(userObject, true);
  const myProfileData = myProfileQuery?.data?.data;
  const isCreator = myProfileQuery?.data?.data?.role === "CREATOR";
  const contentEmail = myProfileQuery?.data?.data?.email;

  const {
    data: creatorContentPages,
    isLoading: creatorContentIsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteGetData({
    url: `contents?creator=${contentEmail}&liveStream=false&sort=createdDate,desc`,
    queryKey: ["GetUserContent", contentEmail ?? ""],
    enabled: !!contentEmail, // don't fetch until we have the email
    pageSize: 20,
  });

  // Was reading only pages[0], and `creatorContentPages` itself (the
  // InfiniteData object — { pages, pageParams }) has no .length or .map of
  // its own, which is exactly what each TS error was pointing at. Flatten
  // every fetched page into a typed array, the same fix as the feed and
  // creator-profile pages.
  const contentPages: RawContent[] = useMemo(
    () =>
      creatorContentPages?.pages?.flatMap((page: any) => page.data?.content) ??
      [],
    [creatorContentPages],
  );

  return (
    <div>
      <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
        {myProfileData?.coverImageUrl ? (
          <img
            src={myProfileData?.coverImageUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Photo
            sizes={SIZES.cover}
            src={coverFor(myProfileData?.username)}
            seed={myProfileData?.username}
          />
        )}
      </div>

      <div className="content" style={{ marginTop: -78 }}>
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
            name={myProfileData?.fullName}
            size={104}
            src={myProfileData?.profileImageUrl}
          />
        </div>

        <div
          className="row between wrap"
          style={{ alignItems: "flex-end", gap: 16, marginTop: 14 }}
        >
          <div className="col gap4">
            <div className="t24 b7 uname">{myProfileData?.fullName}</div>
            <div className="muted">@{myProfileData?.username}</div>

            {isCreator && (
              <div className="row gap16 muted t13" style={{ marginTop: 4 }}>
                <span>
                  {/* Was S.myPosts.length (the mock store) — now the real
                      fetched count, same source as the list below it. */}
                  <b>{contentPages.length}</b> posts
                </span>
                <span>
                  <b>{subCount}</b> subscriptions
                </span>
                <span>
                  <b>{followCount}</b> following
                </span>
              </div>
            )}
          </div>

          <div className="row gap10">
            <button
              className="btn btn-ghost"
              onClick={() => navigate("/profile/edit")}
            >
              <Icon n="gear" s={16} />
              Edit profile
            </button>
            <button
              className="btn btn-blue"
              onClick={() => S.openModal("compose")}
            >
              <Icon n="plus" s={15} />
              New post
            </button>
          </div>
        </div>

        <div className="up muted" style={{ margin: "26px 0 14px" }}>
          Your posts
        </div>

        <div className="col gap16" style={{ maxWidth: 620 }}>
          {!creatorContentIsLoading && contentPages.length === 0 ? (
            <div
              className="card col center gap10"
              style={{ padding: 48, textAlign: "center" }}
            >
              <div className="feature-ic" style={{ background: "var(--fill)" }}>
                <Icon n="doc" c="var(--muted)" />
              </div>
              <div className="b7">You haven&apos;t posted yet</div>
              <div className="muted t13">
                Share something with your fans to see it here.
              </div>
              <button
                className="btn btn-blue btn-sm"
                onClick={() => S.openModal("compose")}
              >
                Create a post
              </button>
            </div>
          ) : (
            // was: p.id / <PostCard p={p} /> — real posts key off `publicId`,
            // and PostCard takes `raw`, not `p`. Same fix as the feed and the
            // creator profile page.
            contentPages.map((raw) => <PostCard key={raw.publicId} raw={raw} />)
          )}
        </div>

        <InfiniteLoader
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
        />
      </div>
    </div>
  );
}
