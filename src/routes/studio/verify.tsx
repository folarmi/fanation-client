// import { useState } from "react";
// import { useAppStore } from "@/lib/core";
// import { Icon } from "@/lib/ui";
// import { useAppSelector } from "@/services/hook";
// import { RootState } from "@/services/store";
// import { useFetchProfile } from "@/hooks/apiHooks";

// const ITEMS: Array<[string, string, string, number]> = [
//   [
//     "user",
//     "Government-issued ID",
//     "Passport, national ID, or driver's licence",
//     1,
//   ],
//   ["camera", "Facial verification", "A quick liveness check on camera", 2],
//   ["shield", "2 private minutes", "Processed securely, never shared", 3],
// ];

// export default function VerifyPage() {
//   const S = useAppStore();
//   const { userObject } = useAppSelector((state: RootState) => state.auth);
//   const myProfileQuery = useFetchProfile(userObject, Boolean(userObject));
//   const profile = myProfileQuery.data?.data;

//   const [step, setStep] = useState(0);
//   const labels = [
//     "Start verification",
//     "Upload ID — continue",
//     "Run liveness check",
//   ];
//   const advance = () => {
//     const msgs = [
//       "Verification started — upload your ID",
//       "ID received · quality check passed",
//       "Liveness check passed — submitted for review",
//     ];
//     S.toast(msgs[step], step === 0 ? "" : "ok");
//     setStep((s) => s + 1);
//   };
//   return (
//     <div className="content" style={{ maxWidth: 620 }}>
//       <div className="card" style={{ padding: 24 }}>
//         <div className="row between" style={{ marginBottom: 8 }}>
//           <div className="row gap12">
//             <div
//               className="feature-ic"
//               style={{ background: "rgba(37,153,246,.16)" }}
//             >
//               <Icon n="shield" c="var(--blueL-ink)" />
//             </div>
//             <div className="col">
//               <div className="b7 t20">Identity verification</div>
//               <div className="muted t13">
//                 Unlock payouts and creator features.
//               </div>
//             </div>
//           </div>
//           {step === 3 && <span className="chip-coin">Under review · ~24h</span>}
//         </div>
//         <hr className="divider" style={{ margin: "16px 0" }} />
//         {step > 0 && (
//           <div style={{ marginBottom: 16 }}>
//             <div className="row between t13 muted" style={{ marginBottom: 6 }}>
//               <span>Progress</span>
//               <span>{step}/3</span>
//             </div>
//             <div className="progress">
//               <i style={{ width: `${(step / 3) * 100}%` }} />
//             </div>
//           </div>
//         )}
//         <div className="up muted" style={{ marginBottom: 12 }}>
//           What you'll need
//         </div>
//         {ITEMS.map((r) => (
//           <div key={r[1]} className="row gap12" style={{ marginBottom: 12 }}>
//             <div
//               className="feature-ic"
//               style={{
//                 width: 38,
//                 height: 38,
//                 background:
//                   step >= r[3] ? "rgba(93,221,144,.14)" : "var(--fill)",
//               }}
//             >
//               <Icon
//                 n={step >= r[3] ? "check" : r[0]}
//                 s={17}
//                 c={step >= r[3] ? "var(--mint-ink)" : "var(--muted)"}
//               />
//             </div>
//             <div>
//               <div className="b6 t14">{r[1]}</div>
//               <div className="muted t12">{step >= r[3] ? "Done" : r[2]}</div>
//             </div>
//           </div>
//         ))}
//         {step < 3 ? (
//           <button
//             className="btn btn-blue btn-block"
//             style={{ marginTop: 8 }}
//             onClick={advance}
//           >
//             {labels[step]}
//           </button>
//         ) : (
//           <button
//             className="btn btn-ghost btn-block btn-sm"
//             style={{ marginTop: 8 }}
//             onClick={() => {
//               setStep(0);
//               S.toast("Resubmission started — previous documents cleared");
//             }}
//           >
//             Resubmit documents
//           </button>
//         )}
//         <div className="row center muted2 t12" style={{ marginTop: 10 }}>
//           Securely processed by Didit
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";
import { useAppSelector } from "@/services/hook";
import { RootState } from "@/services/store";
import { useFetchProfile } from "@/hooks/apiHooks";
import { useCustomMutation } from "@/hooks/api/use-api";
import api from "@/services/axios";
import { useDidit } from "@/hooks/useDidit";
import { useKycSession } from "@/hooks/useKycSession";
// import { useCustomMutation } from "@/hooks/apiCalls";
// import { useDidit } from "@/hooks/useDidit";
// import { useKycSession } from "@/hooks/useKycSession";
// import api from "@/lib/axios";

type PageState =
  | "idle"
  | "pending_review"
  | "in_review"
  | "verified"
  | "declined"
  | "failed"
  | "poll_exhausted";

const EDIT_PROFILE_ROUTE = "/dashboard/profile/edit-profile";
const DASHBOARD_ROUTE = "/dashboard";
const REDIRECT_DELAY_MS = 3000;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 10;

const statusToPageState = (status: string): PageState | null => {
  switch (status) {
    case "APPROVED":
      return "verified";
    case "DECLINED":
      return "declined";
    case "IN_REVIEW":
    case "In Review":
      return "in_review";
    default:
      return null; // "In Progress" / "Not Started" — no session yet
  }
};

// Where the checklist + progress bar sit for a given state.
// idle/failed haven't submitted anything yet; pending_review is "submitted,
// waiting"; in_review/poll_exhausted are "further along, still waiting";
// verified is done.
const stepForState = (s: PageState) =>
  s === "verified"
    ? 3
    : s === "in_review" || s === "poll_exhausted"
      ? 2
      : s === "pending_review"
        ? 1
        : 0;

const ITEMS: Array<[string, string, string, number]> = [
  [
    "user",
    "Government-issued ID",
    "Passport, national ID, or driver's licence",
    1,
  ],
  ["camera", "Facial verification", "A quick liveness check on camera", 1],
  ["shield", "Review", "Final confirmation from our team", 3],
];

export default function VerifyPage() {
  const S = useAppStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { userObject } = useAppSelector((state: RootState) => state.auth);
  const myProfileQuery = useFetchProfile(userObject, Boolean(userObject));
  const profile = myProfileQuery.data?.data;

  const kycSessionQuery = useKycSession({
    email: profile?.email,
    enabled: Boolean(profile?.email),
  });
  const latestSession = kycSessionQuery.data;

  const [pageState, setPageState] = useState<PageState>("idle");
  const [initialisedFromSession, setInitialisedFromSession] = useState(false);

  // Derive initial state from any existing session on mount; local state
  // takes over once the user starts a new flow this visit.
  useEffect(() => {
    if (initialisedFromSession || kycSessionQuery.isLoading) return;
    if (!latestSession) {
      setInitialisedFromSession(true);
      return;
    }
    const derived = statusToPageState(latestSession.status);
    if (derived) setPageState(derived);
    setInitialisedFromSession(true);
  }, [latestSession, kycSessionQuery.isLoading, initialisedFromSession]);

  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };
  useEffect(() => () => stopPolling(), []);

  const isVerified = profile?.kycVerified === true;

  const fullName = profile?.fullName?.trim() ?? "";
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstname = nameParts[0] ?? "";
  const lastname = nameParts.slice(1).join(" ");

  const isProfileComplete =
    Boolean(profile?.email?.trim()) &&
    nameParts.length >= 2 &&
    Boolean(profile?.username?.trim()) &&
    Boolean(profile?.gender) &&
    Boolean(profile?.location?.trim());

  // Kick to edit-profile if required fields are missing — same gate as before.
  useEffect(() => {
    if (!myProfileQuery.isSuccess || isProfileComplete) return;
    S.toast(
      "Please complete your profile before starting identity verification",
      "err",
    );
    navigate(EDIT_PROFILE_ROUTE, { replace: true });
  }, [myProfileQuery.isSuccess, isProfileComplete, navigate]);

  const verifyCreatorMutation = useCustomMutation({
    endpoint: "profile/verify",
    successMessage: () => "Verification complete",
    onSuccessCallback: () => {
      queryClient.invalidateQueries({
        queryKey: ["viewProfile"],
        exact: false,
      });
      stopPolling();
      setPageState("verified");
      S.toast("Identity verified 🎉", "ok");
      setTimeout(() => navigate(DASHBOARD_ROUTE), REDIRECT_DELAY_MS);
    },
    onError: (error: any) => {
      console.warn("profile/verify failed:", error);
    },
  });

  const startPollingStatus = (sessionId: string) => {
    pollAttemptsRef.current = 0;

    const poll = async () => {
      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setPageState("poll_exhausted");
        return;
      }
      pollAttemptsRef.current += 1;

      try {
        const response = await api.get(`kyc/${sessionId}/status`);
        const status = response.data?.body?.status as string | undefined;

        if (!status) {
          pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        if (status === "APPROVED") {
          verifyCreatorMutation.mutate({});
          return;
        }
        if (status === "DECLINED") {
          stopPolling();
          setPageState("declined");
          return;
        }
        if (status === "IN_REVIEW" || status === "In Review") {
          stopPolling();
          setPageState("in_review");
          return;
        }
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        console.warn("Status poll error:", err);
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  };

  const { startDiditKyc, isStartingDiditKyc } = useDidit({
    onVerificationCompleted: (sessionId: string) => {
      setPageState("pending_review");
      S.toast("Verification submitted — reviewing now", "ok");
      startPollingStatus(sessionId);
    },
    onVerificationCancelled: () => setPageState("idle"),
    onVerificationFailed: () => setPageState("failed"),
  });

  const handleStartVerification = () => {
    if (pageState === "pending_review" || isVerified || isStartingDiditKyc)
      return;
    if (!isProfileComplete) {
      navigate(EDIT_PROFILE_ROUTE, {
        state: {
          message:
            "Please complete your profile before starting identity verification.",
        },
      });
      return;
    }
    if (!profile?.email || !firstname || !lastname) return;

    startDiditKyc({
      email: profile.email,
      firstname,
      lastname,
      cbUrl: window.location.origin,
    });
  };

  const handleCheckAgain = async () => {
    const result = await kycSessionQuery.refetch();
    const session = result.data;
    if (session?.sessionId) {
      pollAttemptsRef.current = 0;
      setPageState("pending_review");
      startPollingStatus(session.sessionId);
    }
  };

  // --- loading / hard-blocked states -------------------------------------

  if (
    myProfileQuery.isLoading ||
    kycSessionQuery.isLoading ||
    !initialisedFromSession
  ) {
    return (
      <div className="content" style={{ maxWidth: 620 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="muted t13">Loading your verification status…</div>
        </div>
      </div>
    );
  }

  if (myProfileQuery.isError) {
    return (
      <div className="content" style={{ maxWidth: 620 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="row gap12">
            <div
              className="feature-ic"
              style={{ background: "rgba(239,68,68,.14)" }}
            >
              <Icon n="alert" c="var(--red-ink)" />
            </div>
            <div className="muted t13">
              We couldn't retrieve your profile. Please refresh and try again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isProfileComplete) {
    // Redirect effect above will fire; render nothing meaningful in the gap.
    return (
      <div className="content" style={{ maxWidth: 620 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="muted t13">Redirecting to your profile…</div>
        </div>
      </div>
    );
  }

  const resolvedState: PageState = isVerified ? "verified" : pageState;
  const step = stepForState(resolvedState);

  // --- outcome banners (declined / failed / in_review / poll_exhausted) --

  const banner: Record<
    string,
    { icon: string; bg: string; ic: string; title: string; body: string }
  > = {
    declined: {
      icon: "x",
      bg: "rgba(239,68,68,.14)",
      ic: "var(--red-ink)",
      title: "Verification declined",
      body: "Your identity check didn't pass — usually a name mismatch or unclear document/face. Try again with a valid government-issued ID.",
    },
    failed: {
      icon: "alert",
      bg: "rgba(239,68,68,.14)",
      ic: "var(--red-ink)",
      title: "Something went wrong",
      body: "The verification couldn't be completed. Check your camera permissions and try again.",
    },
    in_review: {
      icon: "clock",
      bg: "rgba(234,179,8,.14)",
      ic: "var(--yellow-ink)",
      title: "Under manual review",
      body: "This has been flagged for a manual review — can take up to 24h. We'll notify you, no action needed right now.",
    },
    poll_exhausted: {
      icon: "refresh",
      bg: "var(--fill)",
      ic: "var(--muted)",
      title: "Still processing",
      body: "Submitted, but we haven't gotten confirmation yet. This can occasionally take a few minutes.",
    },
  };

  if (resolvedState in banner) {
    const b = banner[resolvedState];
    return (
      <div className="content" style={{ maxWidth: 620 }}>
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div
            className="feature-ic"
            style={{ background: b.bg, margin: "0 auto 12px" }}
          >
            <Icon n={b.icon} c={b.ic} />
          </div>
          <div className="b7 t20">{b.title}</div>
          <div className="muted t13" style={{ marginTop: 8 }}>
            {b.body}
          </div>
          <div
            className="col gap12"
            style={{ marginTop: 20, alignItems: "center" }}
          >
            {resolvedState === "poll_exhausted" ? (
              <button
                className="btn btn-blue btn-block"
                onClick={handleCheckAgain}
              >
                Check again
              </button>
            ) : (
              (resolvedState === "declined" || resolvedState === "failed") && (
                <button
                  className="btn btn-blue btn-block"
                  onClick={() => setPageState("idle")}
                >
                  Try again
                </button>
              )
            )}
            <button
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => navigate(DASHBOARD_ROUTE)}
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- main card: idle / pending_review / verified ------------------------

  return (
    <div className="content" style={{ maxWidth: 620 }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <div className="row gap12">
            <div
              className="feature-ic"
              style={{ background: "rgba(37,153,246,.16)" }}
            >
              <Icon n="shield" c="var(--blueL-ink)" />
            </div>
            <div className="col">
              <div className="b7 t20">Identity verification</div>
              <div className="muted t13">
                Unlock payouts and creator features.
              </div>
            </div>
          </div>
          {resolvedState === "verified" && (
            <span className="chip-coin">Verified</span>
          )}
          {resolvedState === "pending_review" && (
            <span className="chip-coin">Processing</span>
          )}
        </div>

        <hr className="divider" style={{ margin: "16px 0" }} />

        <div style={{ marginBottom: 16 }}>
          <div className="row between t13 muted" style={{ marginBottom: 6 }}>
            <span>Progress</span>
            <span>{step}/3</span>
          </div>
          <div className="progress">
            <i style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        <div className="up muted" style={{ marginBottom: 12 }}>
          What you'll need
        </div>

        {ITEMS.map((r) => (
          <div key={r[1]} className="row gap12" style={{ marginBottom: 12 }}>
            <div
              className="feature-ic"
              style={{
                width: 38,
                height: 38,
                background:
                  step >= r[3] ? "rgba(93,221,144,.14)" : "var(--fill)",
              }}
            >
              <Icon
                n={step >= r[3] ? "check" : r[0]}
                s={17}
                c={step >= r[3] ? "var(--mint-ink)" : "var(--muted)"}
              />
            </div>
            <div>
              <div className="b6 t14">{r[1]}</div>
              <div className="muted t12">{step >= r[3] ? "Done" : r[2]}</div>
            </div>
          </div>
        ))}

        {resolvedState === "verified" ? (
          <button
            className="btn btn-blue btn-block"
            style={{ marginTop: 8 }}
            onClick={() => navigate(DASHBOARD_ROUTE)}
          >
            Go to dashboard
          </button>
        ) : resolvedState === "pending_review" ? (
          <>
            <button className="btn btn-block" style={{ marginTop: 8 }} disabled>
              Waiting for confirmation…
            </button>
            <button
              className="btn btn-ghost btn-block btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => navigate(DASHBOARD_ROUTE)}
            >
              Continue to dashboard
            </button>
          </>
        ) : (
          <button
            className="btn btn-blue btn-block"
            style={{ marginTop: 8 }}
            onClick={handleStartVerification}
            disabled={isStartingDiditKyc}
          >
            {isStartingDiditKyc
              ? "Preparing verification…"
              : "Start verification"}
          </button>
        )}

        <div className="row center muted2 t12" style={{ marginTop: 10 }}>
          Securely processed by Didit
        </div>
      </div>
    </div>
  );
}
