// import { useCallback, useState } from "react";
// import { FirebaseError } from "firebase/app";
// import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// import { auth } from "@/services/firebase";
// import { showErrorToast } from "@/utils/toastUtils";
// import { useSignIn } from "./useSignIn";
// import { getDeviceOS } from "@/utils/helper";

// interface GoogleSignInMetadata {
//   ip: string;
//   location: string;
//   platform: string;
//   browser: string;
//   endpoint?: string;
// }

// const getFirebaseErrorMessage = (error: FirebaseError): string => {
//   switch (error.code) {
//     case "auth/popup-blocked":
//       return "Your browser blocked the Google sign-in popup.";

//     case "auth/account-exists-with-different-credential":
//       return "An account already exists with this email using another sign-in method.";

//     case "auth/network-request-failed":
//       return "Unable to connect to Google. Check your internet connection.";

//     case "auth/unauthorized-domain":
//       return "This domain has not been authorised for Google sign-in.";

//     default:
//       return error.message || "Unable to sign in with Google.";
//   }
// };

// export function useGoogleSignIn({
//   ip,
//   location,
//   platform,
//   browser,
//   endpoint = "auth/login/oauth2",
// }: GoogleSignInMetadata) {
//   const [, setNotVerifiedError] = useState(false);

//   const [isOpeningPopup, setIsOpeningPopup] = useState(false);

//   const signInMutation = useSignIn({
//     setNotVerifiedError,
//     endpoint,
//   });

//   const signInWithGoogle = useCallback(async () => {
//     console.log(
//       "signInWithGoogle called, isOpeningPopup:",
//       isOpeningPopup,
//       "isPending:",
//       signInMutation.isPending,
//     );
//     if (isOpeningPopup || signInMutation.isPending) {
//       return;
//     }

//     setIsOpeningPopup(true);

//     const provider = new GoogleAuthProvider();

//     provider.addScope("https://www.googleapis.com/auth/userinfo.email");

//     provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

//     provider.setCustomParameters({
//       prompt: "select_account",
//     });

//     try {
//       const result = await signInWithPopup(auth, provider);

//       console.log("Firebase auth success:", result.user.email);

//       const idToken = await result.user.getIdToken();
//       console.log("Got ID token, length:", idToken.length);

//       signInMutation.mutate({
//         token: idToken,

//         deviceMetaDto: {
//           deviceOS: getDeviceOS(),
//           deviceIP: ip,
//           location,
//           platform,
//           browser,
//         },
//       });
//     } catch (error: unknown) {
//       if (error instanceof FirebaseError) {
//         // The user deliberately closed the popup.
//         // Do not display an error toast.
//         if (
//           error.code === "auth/popup-closed-by-user" ||
//           error.code === "auth/cancelled-popup-request"
//         ) {
//           return;
//         }

//         showErrorToast(getFirebaseErrorMessage(error));

//         return;
//       }

//       showErrorToast(
//         error instanceof Error
//           ? error.message
//           : "Unable to sign in with Google.",
//       );
//     } finally {
//       setIsOpeningPopup(false);
//     }
//   }, [browser, ip, isOpeningPopup, location, platform, signInMutation]);

//   return {
//     signInWithGoogle,

//     isGoogleSigningIn: isOpeningPopup || signInMutation.isPending,
//   };
// }

import { useCallback, useState } from "react";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";

import { auth } from "@/services/firebase";
import { showErrorToast } from "@/utils/toastUtils";
import { useSignIn } from "./useSignIn";
import { getDeviceOS } from "@/utils/helper";

interface GoogleSignInMetadata {
  ip: string;
  location: string;
  platform: string;
  browser: string;
  endpoint?: string;
}

const getFirebaseErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window.";

    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using another sign-in method.";

    case "auth/network-request-failed":
      return "Unable to connect to Google. Check your internet connection.";

    case "auth/unauthorized-domain":
      return "This domain has not been authorised for Google sign-in.";

    default:
      return error.message || "Unable to sign in with Google.";
  }
};

export const GOOGLE_DEVICE_META_KEY = "googleSignInDeviceMeta";

export function useGoogleSignIn({
  ip,
  location,
  platform,
  browser,
  endpoint = "auth/login/oauth2",
}: GoogleSignInMetadata) {
  const [, setNotVerifiedError] = useState(false);

  const [isOpeningRedirect, setIsOpeningRedirect] = useState(false);

  const signInMutation = useSignIn({
    setNotVerifiedError,
    endpoint,
  });

  const signInWithGoogle = useCallback(async () => {
    if (isOpeningRedirect) {
      return;
    }

    setIsOpeningRedirect(true);

    // Component state won't survive the full-page redirect, so stash
    // device metadata here and read it back after Google returns us.
    sessionStorage.setItem(
      GOOGLE_DEVICE_META_KEY,
      JSON.stringify({
        deviceOS: getDeviceOS(),
        deviceIP: ip,
        location,
        platform,
        browser,
      }),
    );

    const provider = new GoogleAuthProvider();

    provider.addScope("https://www.googleapis.com/auth/userinfo.email");

    provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

    provider.setCustomParameters({
      prompt: "select_account",
    });

    try {
      // This navigates the browser away from the app.
      await signInWithRedirect(auth, provider);
    } catch (error: unknown) {
      setIsOpeningRedirect(false);
      sessionStorage.removeItem(GOOGLE_DEVICE_META_KEY);

      if (error instanceof FirebaseError) {
        showErrorToast(getFirebaseErrorMessage(error));
        return;
      }

      showErrorToast(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Google.",
      );
    }
  }, [browser, ip, isOpeningRedirect, location, platform]);

  return {
    signInWithGoogle,

    isGoogleSigningIn: isOpeningRedirect || signInMutation.isPending,
  };
}
